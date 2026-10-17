import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Rol, TipoMovimientoInventario } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const AjusteInventarioSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  tipoAjuste: z.enum(["INCREMENTO", "DECREMENTO"]),
  cantidadBultos: z.number().positive("La cantidad debe ser mayor a 0"),
  motivo: z.string().min(5, "Debe especificar un motivo detallado del ajuste"),
});

export async function inventarioRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Consultar Kardex / Historial de Movimientos de Inventario
  server.get("/api/inventario/kardex", async (request) => {
    const { productoId, tipo, limit } = request.query as {
      productoId?: string;
      tipo?: TipoMovimientoInventario;
      limit?: string;
    };

    const whereClause: any = {};
    if (productoId) whereClause.productoId = productoId;
    if (tipo) whereClause.tipo = tipo;

    const movimientos = await prisma.movimientoInventario.findMany({
      where: whereClause,
      orderBy: { fecha: "desc" },
      take: limit ? Number(limit) : 100,
      include: {
        producto: {
          select: { id: true, nombre: true, pesoBultoKg: true },
        },
      },
    });

    const formatMovimientos = movimientos.map((m) => {
      const cantidad = Number(m.cantidadBultos);
      const saldo = Number(m.saldoResultante);
      const costo = Number(m.costoUnitario);
      const pesoBulto = Number(m.producto.pesoBultoKg);

      return {
        id: m.id,
        fecha: m.fecha,
        producto: m.producto,
        tipo: m.tipo,
        cantidadBultos: cantidad,
        cantidadKg: Number((cantidad * pesoBulto).toFixed(2)),
        saldoResultante: saldo,
        saldoKg: Number((saldo * pesoBulto).toFixed(2)),
        costoUnitario: costo,
        referenciaId: m.referenciaId,
        observaciones: m.observaciones,
      };
    });

    return { kardex: formatMovimientos };
  });

  // Resumen consolidado de existencias actuales (Kardex global)
  server.get("/api/inventario/resumen", async () => {
    const productos = await prisma.producto.findMany({
      orderBy: { nombre: "asc" },
    });

    let totalBultosGlobal = 0;
    let valorTotalGlobal = 0;

    const existencias = productos.map((p) => {
      const stock = Number(p.stockActual);
      const costo = Number(p.costoPromedio);
      const pesoBulto = Number(p.pesoBultoKg);
      const valor = stock * costo;

      totalBultosGlobal += stock;
      valorTotalGlobal += valor;

      return {
        id: p.id,
        nombre: p.nombre,
        activo: p.activo,
        stockBultos: stock,
        stockKg: Number((stock * pesoBulto).toFixed(2)),
        costoPromedio: costo,
        valorTotal: Number(valor.toFixed(2)),
      };
    });

    return {
      resumen: {
        totalBultos: Number(totalBultosGlobal.toFixed(2)),
        totalKg: Number((totalBultosGlobal * 50).toFixed(2)),
        valorTotal: Number(valorTotalGlobal.toFixed(2)),
        productos: existencias,
      },
    };
  });

  // Realizar ajuste manual de inventario (Exclusivo Administrador)
  server.post(
    "/api/inventario/ajuste",
    { preHandler: requireRoles([Rol.ADMINISTRADOR]) },
    async (request, reply) => {
      const parse = AjusteInventarioSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const { productoId, tipoAjuste, cantidadBultos, motivo } = parse.data;
      const usuarioId = request.user.id;

      const resultado = await prisma.$transaction(async (tx) => {
        const prod = await tx.producto.findUnique({ where: { id: productoId } });
        if (!prod) {
          throw new Error("Producto no encontrado");
        }

        const stockActual = Number(prod.stockActual);
        let nuevoStock = stockActual;

        if (tipoAjuste === "INCREMENTO") {
          nuevoStock += cantidadBultos;
        } else {
          nuevoStock -= cantidadBultos;
          // REGLA CRÍTICA: INVENTARIO NEGATIVO PROHIBIDO (Sección 8)
          if (nuevoStock < 0) {
            throw new Error(
              `El ajuste no es posible: generaría inventario negativo (${nuevoStock.toFixed(2)} bultos). Stock actual: ${stockActual.toFixed(2)}`
            );
          }
        }

        // Actualizar stock
        await tx.producto.update({
          where: { id: productoId },
          data: { stockActual: nuevoStock },
        });

        // Registrar movimiento de inventario
        const movimiento = await tx.movimientoInventario.create({
          data: {
            productoId,
            tipo: TipoMovimientoInventario.AJUSTE,
            cantidadBultos: tipoAjuste === "INCREMENTO" ? cantidadBultos : -cantidadBultos,
            saldoResultante: nuevoStock,
            costoUnitario: prod.costoPromedio,
            observaciones: `Ajuste manual (${tipoAjuste}): ${motivo}`,
          },
        });

        // Registrar auditoría obligatoria (Sección 21)
        await tx.auditoria.create({
          data: {
            usuarioId,
            accion: "AJUSTE_INVENTARIO",
            entidad: "Producto",
            entidadId: productoId,
            valorAnterior: JSON.stringify({ stockBultos: stockActual }),
            valorNuevo: JSON.stringify({ stockBultos: nuevoStock, tipoAjuste, cantidadBultos }),
            motivo,
          },
        });

        return { producto: prod.nombre, stockAnterior: stockActual, nuevoStock, movimiento };
      });

      return reply.status(200).send({ ajuste: resultado });
    }
  );
}
