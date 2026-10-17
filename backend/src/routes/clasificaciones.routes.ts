import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Rol, TipoMovimientoInventario } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const DestinoClasificacionSchema = z.object({
  productoDestinoId: z.string().uuid("ID de producto destino inválido"),
  cantidadDestino: z.number().positive("La cantidad debe ser mayor a 0"),
  costoAsignado: z.number().nonnegative("El costo asignado no puede ser negativo").optional(),
});

const CreateClasificacionSchema = z.object({
  productoOrigenId: z.string().uuid("ID de producto origen inválido"),
  cantidadOrigen: z.number().positive("La cantidad origen debe ser mayor a 0"),
  cantidadPerdida: z.number().nonnegative("La cantidad perdida no puede ser negativa").default(0),
  observaciones: z.string().optional(),
  destinos: z.array(DestinoClasificacionSchema).min(1, "Debe especificar al menos un producto destino"),
});

export async function clasificacionesRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar clasificaciones históricas
  server.get("/api/clasificaciones", async () => {
    const clasificaciones = await prisma.clasificacionInventario.findMany({
      orderBy: { fecha: "desc" },
      take: 50,
      include: {
        productoOrigen: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true } },
        destinos: {
          include: {
            productoDestino: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    const format = clasificaciones.map((c) => ({
      id: c.id,
      fecha: c.fecha,
      productoOrigen: c.productoOrigen,
      cantidadOrigen: Number(c.cantidadOrigen),
      cantidadPerdida: Number(c.cantidadPerdida),
      observaciones: c.observaciones,
      usuario: c.usuario,
      destinos: c.destinos.map((d) => ({
        id: d.id,
        producto: d.productoDestino,
        cantidadDestino: Number(d.cantidadDestino),
        costoAsignado: Number(d.costoAsignado),
      })),
    }));

    return { clasificaciones: format };
  });

  // Ejecutar proceso de clasificación (Admin y Auxiliar)
  server.post(
    "/api/clasificaciones",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const parse = CreateClasificacionSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const { productoOrigenId, cantidadOrigen, cantidadPerdida, observaciones, destinos } = parse.data;
      const usuarioId = request.user.id;

      // 1. Validar Balance de Masa (Sección 9): Origen = Suma(Destinos) + Perdida
      const sumaBultosDestino = destinos.reduce((acc, d) => acc + d.cantidadDestino, 0);
      const sumaTotalSalidas = sumaBultosDestino + cantidadPerdida;

      if (Math.abs(sumaTotalSalidas - cantidadOrigen) > 0.001) {
        return reply.status(400).send({
          error: "Desbalance de masa en clasificación",
          message: `La cantidad de origen (${cantidadOrigen} bultos) no coincide con los destinos más la pérdida (${sumaTotalSalidas} bultos).`,
        });
      }

      // 2. Ejecutar transacción atómica
      const resultado = await prisma.$transaction(async (tx) => {
        // Verificar producto origen y existencia disponible
        const prodOrigen = await tx.producto.findUnique({ where: { id: productoOrigenId } });
        if (!prodOrigen) {
          throw new Error("Producto origen no encontrado");
        }

        const stockOrigen = Number(prodOrigen.stockActual);
        if (stockOrigen < cantidadOrigen) {
          throw new Error(
            `Inventario insuficiente para clasificar: se requieren ${cantidadOrigen} bultos pero solo hay ${stockOrigen} disponibles de ${prodOrigen.nombre}.`
          );
        }

        const costoPromedioOrigen = Number(prodOrigen.costoPromedio);
        const costoTotalOrigen = cantidadOrigen * costoPromedioOrigen;

        // Descontar inventario de origen
        const nuevoStockOrigen = stockOrigen - cantidadOrigen;
        await tx.producto.update({
          where: { id: productoOrigenId },
          data: { stockActual: nuevoStockOrigen },
        });

        // Registrar movimiento de salida por clasificación
        await tx.movimientoInventario.create({
          data: {
            productoId: productoOrigenId,
            tipo: TipoMovimientoInventario.CLASIFICACION_SALIDA,
            cantidadBultos: -cantidadOrigen,
            saldoResultante: nuevoStockOrigen,
            costoUnitario: costoPromedioOrigen,
            observaciones: `Salida a clasificación de ${cantidadOrigen} bultos`,
          },
        });

        // 3. Crear cabecera de Clasificación
        const clasificacion = await tx.clasificacionInventario.create({
          data: {
            productoOrigenId,
            cantidadOrigen,
            cantidadPerdida,
            observaciones,
            usuarioId,
          },
        });

        // 4. Regla de Valoración de Costos aprobada en v1.2:
        // El producto principal (destino 0 o que coincida con origen o de mayor volumen) absorbe el costo residual + pérdida.
        // Los subproductos reciben un costo base de referencia (ej. el costo asignado o 40% del costo base).
        let costoAcumuladoSubproductos = 0;
        const destinosCalculados: {
          productoDestinoId: string;
          cantidadDestino: number;
          costoAsignado: number;
          esPrincipal: boolean;
        }[] = [];

        // Asumimos que el primer destino es el producto principal útil (ej. Capira Primera)
        for (let i = 0; i < destinos.length; i++) {
          const d = destinos[i];
          const esPrincipal = i === 0;

          if (!esPrincipal) {
            // Costo asignado explícito o referencia menor (50% del origen por defecto si no se especificó)
            const costoUnitSub = d.costoAsignado !== undefined ? d.costoAsignado : costoPromedioOrigen * 0.45;
            costoAcumuladoSubproductos += d.cantidadDestino * costoUnitSub;
            destinosCalculados.push({
              productoDestinoId: d.productoDestinoId,
              cantidadDestino: d.cantidadDestino,
              costoAsignado: costoUnitSub,
              esPrincipal: false,
            });
          } else {
            destinosCalculados.push({
              productoDestinoId: d.productoDestinoId,
              cantidadDestino: d.cantidadDestino,
              costoAsignado: 0, // Se calculará como residual
              esPrincipal: true,
            });
          }
        }

        // El producto principal absorbe todo el costo remanente (incluyendo la pérdida)
        const itemPrincipal = destinosCalculados.find((d) => d.esPrincipal);
        if (itemPrincipal && itemPrincipal.cantidadDestino > 0) {
          const costoRemanente = Math.max(0, costoTotalOrigen - costoAcumuladoSubproductos);
          itemPrincipal.costoAsignado = Number((costoRemanente / itemPrincipal.cantidadDestino).toFixed(2));
        }

        // 5. Ingresar cada producto destino a inventario con promedio ponderado
        for (const dest of destinosCalculados) {
          const pDest = await tx.producto.findUnique({ where: { id: dest.productoDestinoId } });
          if (!pDest) {
            throw new Error(`Producto destino con ID ${dest.productoDestinoId} no encontrado`);
          }

          const stockActualDest = Number(pDest.stockActual);
          const costoActualDest = Number(pDest.costoPromedio);
          const nuevoStockDest = stockActualDest + dest.cantidadDestino;

          // Promedio ponderado en entrada de clasificación
          const valorExistenteDest = stockActualDest * costoActualDest;
          const valorNuevoDest = dest.cantidadDestino * dest.costoAsignado;
          const nuevoCostoPromedioDest =
            nuevoStockDest > 0 ? (valorExistenteDest + valorNuevoDest) / nuevoStockDest : dest.costoAsignado;

          await tx.producto.update({
            where: { id: dest.productoDestinoId },
            data: {
              stockActual: nuevoStockDest,
              costoPromedio: nuevoCostoPromedioDest,
            },
          });

          // Registrar detalle de clasificación
          await tx.detalleClasificacionDestino.create({
            data: {
              clasificacionId: clasificacion.id,
              productoDestinoId: dest.productoDestinoId,
              cantidadDestino: dest.cantidadDestino,
              costoAsignado: dest.costoAsignado,
            },
          });

          // Movimiento de inventario tipo CLASIFICACION_ENTRADA
          await tx.movimientoInventario.create({
            data: {
              productoId: dest.productoDestinoId,
              tipo: TipoMovimientoInventario.CLASIFICACION_ENTRADA,
              cantidadBultos: dest.cantidadDestino,
              saldoResultante: nuevoStockDest,
              costoUnitario: dest.costoAsignado,
              referenciaId: clasificacion.id,
              observaciones: `Entrada por clasificación desde ${prodOrigen.nombre}`,
            },
          });
        }

        return clasificacion;
      });

      return reply.status(201).send({ clasificacion: resultado });
    }
  );
}
