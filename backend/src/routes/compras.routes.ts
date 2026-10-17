import { FastifyInstance } from "fastify";
import { z } from "zod";
import { FormaPago, Rol, TipoMovimientoInventario, TipoMovimientoCaja } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const ItemCompraSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidadBultos: z.number().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.number().nonnegative("El precio unitario no puede ser negativo"),
});

const CreateCompraSchema = z.object({
  proveedorId: z.string().uuid("ID de proveedor inválido"),
  formaPago: z.nativeEnum(FormaPago),
  observaciones: z.string().optional(),
  items: z.array(ItemCompraSchema).min(1, "Debe agregar al menos un producto a la compra"),
});

export async function comprasRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar compras realizadas (Admin y Auxiliar)
  server.get(
    "/api/compras",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request) => {
      const compras = await prisma.compra.findMany({
        orderBy: { fecha: "desc" },
        include: {
          proveedor: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true } },
          detalles: {
            include: {
              producto: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      const formatCompras = compras.map((c) => ({
        id: c.id,
        numero: c.numero,
        fecha: c.fecha,
        proveedor: c.proveedor,
        formaPago: c.formaPago,
        total: Number(c.total),
        observaciones: c.observaciones,
        usuario: c.usuario,
        detalles: c.detalles.map((d) => ({
          id: d.id,
          producto: d.producto,
          cantidadBultos: Number(d.cantidadBultos),
          precioUnitario: Number(d.precioUnitario),
          subtotal: Number(d.subtotal),
        })),
      }));

      return { compras: formatCompras };
    }
  );

  // Registrar nueva compra (Admin y Auxiliar)
  server.post(
    "/api/compras",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const parse = CreateCompraSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const { proveedorId, formaPago, observaciones, items } = parse.data;
      const usuarioId = request.user.id;

      // Calcular total general de la compra
      const totalCompra = items.reduce((acc, item) => acc + item.cantidadBultos * item.precioUnitario, 0);

      // Ejecutar transacción atómica: Compra + Stock + Promedio Ponderado + MovimientoInventario + (Caja o CxP)
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Validar existencia del proveedor
        const proveedor = await tx.proveedor.findUnique({ where: { id: proveedorId } });
        if (!proveedor) {
          throw new Error("Proveedor no encontrado");
        }

        // 2. Crear cabecera de compra
        const compra = await tx.compra.create({
          data: {
            proveedorId,
            formaPago,
            total: totalCompra,
            observaciones,
            usuarioId,
          },
        });

        // 3. Procesar cada ítem de producto
        for (const item of items) {
          const subtotalItem = item.cantidadBultos * item.precioUnitario;

          // Registrar detalle
          await tx.detalleCompra.create({
            data: {
              compraId: compra.id,
              productoId: item.productoId,
              cantidadBultos: item.cantidadBultos,
              precioUnitario: item.precioUnitario,
              subtotal: subtotalItem,
            },
          });

          // Obtener producto actual para recalcular costo promedio ponderado
          const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
          if (!prod) {
            throw new Error(`Producto con ID ${item.productoId} no encontrado`);
          }

          const stockActualNum = Number(prod.stockActual);
          const costoActualNum = Number(prod.costoPromedio);
          const nuevoStock = stockActualNum + item.cantidadBultos;

          // Fórmula Oficial Promedio Ponderado (Sección 18):
          // Costo Promedio = (Valor Existente + Valor Entrada) / (Cantidad Existente + Cantidad Entrada)
          const valorExistente = stockActualNum * costoActualNum;
          const valorEntrada = item.cantidadBultos * item.precioUnitario;
          const nuevoCostoPromedio = nuevoStock > 0 ? (valorExistente + valorEntrada) / nuevoStock : item.precioUnitario;

          // Actualizar producto
          await tx.producto.update({
            where: { id: item.productoId },
            data: {
              stockActual: nuevoStock,
              costoPromedio: nuevoCostoPromedio,
            },
          });

          // Registrar Movimiento de Inventario tipo COMPRA
          await tx.movimientoInventario.create({
            data: {
              productoId: item.productoId,
              tipo: TipoMovimientoInventario.COMPRA,
              cantidadBultos: item.cantidadBultos,
              saldoResultante: nuevoStock,
              costoUnitario: item.precioUnitario,
              referenciaId: compra.id,
              observaciones: `Compra #${compra.numero} - ${formaPago}`,
            },
          });
        }

        // 4. Impacto Financiero
        if (formaPago === FormaPago.CONTADO) {
          // Genera Egreso en Caja
          await tx.movimientoCaja.create({
            data: {
              tipo: TipoMovimientoCaja.EGRESO,
              categoria: "Pago Proveedor",
              monto: totalCompra,
              descripcion: `Pago de contado por Compra #${compra.numero} a ${proveedor.nombre}`,
              referenciaId: compra.id,
            },
          });
        } else {
          // Genera Cuenta por Pagar (incrementa saldo pendiente al proveedor)
          const nuevoSaldoProveedor = Number(proveedor.saldoActual) + totalCompra;
          await tx.proveedor.update({
            where: { id: proveedorId },
            data: {
              saldoActual: nuevoSaldoProveedor,
            },
          });
        }

        return compra;
      });

      return reply.status(201).send({ compra: resultado });
    }
  );
}
