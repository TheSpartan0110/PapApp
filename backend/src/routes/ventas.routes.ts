import { FastifyInstance } from "fastify";
import { z } from "zod";
import { FormaPago, NivelRiesgo, Rol, TipoMovimientoCaja, TipoMovimientoInventario } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const ItemVentaSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidadBultos: z.number().positive("La cantidad en bultos debe ser mayor a 0"),
  precioUnitario: z.number().nonnegative("El precio unitario no puede ser negativo"),
  descuento: z.number().nonnegative("El descuento no puede ser negativo").default(0),
});

const CreateVentaSchema = z.object({
  clienteId: z.string().uuid("ID de cliente inválido"),
  formaPago: z.nativeEnum(FormaPago),
  descuento: z.number().nonnegative().default(0),
  observaciones: z.string().optional(),
  items: z.array(ItemVentaSchema).min(1, "Debe agregar al menos un producto a la venta"),
});

export async function ventasRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar ventas realizadas con filtros
  server.get("/api/ventas", async (request) => {
    const { clienteId, formaPago, fechaInicio, fechaFin, limit } = request.query as {
      clienteId?: string;
      formaPago?: FormaPago;
      fechaInicio?: string;
      fechaFin?: string;
      limit?: string;
    };

    const whereClause: any = {};
    if (clienteId) whereClause.clienteId = clienteId;
    if (formaPago) whereClause.formaPago = formaPago;
    if (fechaInicio || fechaFin) {
      whereClause.fecha = {};
      if (fechaInicio) whereClause.fecha.gte = new Date(fechaInicio);
      if (fechaFin) whereClause.fecha.lte = new Date(fechaFin);
    }

    const ventas = await prisma.venta.findMany({
      where: whereClause,
      orderBy: { fecha: "desc" },
      take: limit ? Number(limit) : 50,
      include: {
        cliente: { select: { id: true, nombre: true, nivelRiesgo: true, telefono: true } },
        vendedor: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, pesoBultoKg: true } },
          },
        },
      },
    });

    const formatVentas = ventas.map((v) => {
      const totalNum = Number(v.total);
      const descNum = Number(v.descuento);

      // Calcular costo total de ventas y utilidad bruta de la transacción
      let costoVentaTotal = 0;
      const detallesFormateados = v.detalles.map((d) => {
        const cant = Number(d.cantidadBultos);
        const precio = Number(d.precioUnitario);
        const costo = Number(d.costoUnitario);
        const sub = Number(d.subtotal);
        costoVentaTotal += cant * costo;

        return {
          id: d.id,
          producto: d.producto,
          cantidadBultos: cant,
          equivKg: Number((cant * Number(d.producto.pesoBultoKg)).toFixed(2)),
          precioUnitario: precio,
          costoUnitario: costo,
          subtotal: sub,
          utilidadLinea: Number((sub - cant * costo).toFixed(2)),
        };
      });

      const utilidadTotal = totalNum - costoVentaTotal;
      const margenPorcentaje = totalNum > 0 ? (utilidadTotal / totalNum) * 100 : 0;

      return {
        id: v.id,
        numero: v.numero,
        fecha: v.fecha,
        cliente: v.cliente,
        vendedor: v.vendedor,
        formaPago: v.formaPago,
        total: totalNum,
        descuento: descNum,
        anulada: v.anulada,
        observaciones: v.observaciones,
        costoVentaTotal: Number(costoVentaTotal.toFixed(2)),
        utilidadBruta: Number(utilidadTotal.toFixed(2)),
        margenPorcentaje: Number(margenPorcentaje.toFixed(1)),
        detalles: detallesFormateados,
      };
    });

    return { ventas: formatVentas };
  });

  // Obtener detalle de venta por ID para comprobante
  server.get("/api/ventas/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        cliente: true,
        vendedor: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!venta) {
      return reply.status(404).send({ error: "Venta no encontrada" });
    }

    return {
      venta: {
        ...venta,
        total: Number(venta.total),
        descuento: Number(venta.descuento),
        detalles: venta.detalles.map((d) => ({
          ...d,
          cantidadBultos: Number(d.cantidadBultos),
          precioUnitario: Number(d.precioUnitario),
          costoUnitario: Number(d.costoUnitario),
          descuento: Number(d.descuento),
          subtotal: Number(d.subtotal),
        })),
      },
    };
  });

  // Registrar nueva venta (POS - Todos los roles autenticados)
  server.post("/api/ventas", async (request, reply) => {
    const parse = CreateVentaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const { clienteId, formaPago, descuento, observaciones, items } = parse.data;
    const usuarioId = request.user.id;

    // Calcular subtotal de todos los ítems
    const totalItems = items.reduce(
      (acc, item) => acc + (item.cantidadBultos * item.precioUnitario - item.descuento),
      0
    );
    const totalVenta = Math.max(0, totalItems - descuento);

    // Transacción ACID para asegurar integridad de Inventario, Caja y Cartera
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Validar cliente y reglas de crédito
      const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }

      // Regla de riesgo: Clientes bloqueados solo pueden comprar de contado
      if (formaPago === FormaPago.CREDITO && cliente.nivelRiesgo === NivelRiesgo.BLOQUEADO) {
        throw new Error("El cliente está en estado BLOQUEADO. No tiene permitido crédito (solo venta de contado).");
      }

      // 2. Validar stock de cada producto antes de aplicar la venta (Inventario Negativo Prohibido)
      for (const item of items) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!prod) {
          throw new Error(`Producto con ID ${item.productoId} no encontrado`);
        }
        if (!prod.activo) {
          throw new Error(`El producto ${prod.nombre} está inactivo para ventas`);
        }

        const stockDisponible = Number(prod.stockActual);
        if (stockDisponible < item.cantidadBultos) {
          throw new Error(
            `Inventario insuficiente para ${prod.nombre}: solicitados ${item.cantidadBultos} bultos, pero solo hay ${stockDisponible} bultos en bodega.`
          );
        }
      }

      // 3. Crear cabecera de la venta
      const venta = await tx.venta.create({
        data: {
          clienteId,
          formaPago,
          total: totalVenta,
          descuento,
          observaciones,
          usuarioId,
        },
      });

      // 4. Procesar cada ítem del detalle y actualizar inventario
      for (const item of items) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        const stockPrevio = Number(prod!.stockActual);
        const costoUnitarioActual = Number(prod!.costoPromedio);
        const nuevoStock = stockPrevio - item.cantidadBultos;
        const subtotalLinea = item.cantidadBultos * item.precioUnitario - item.descuento;

        // Registrar detalle capturando costoUnitario al momento de la venta para utilidad real
        await tx.detalleVenta.create({
          data: {
            ventaId: venta.id,
            productoId: item.productoId,
            cantidadBultos: item.cantidadBultos,
            precioUnitario: item.precioUnitario,
            costoUnitario: costoUnitarioActual,
            descuento: item.descuento,
            subtotal: subtotalLinea,
          },
        });

        // Descontar inventario
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stockActual: nuevoStock },
        });

        // Movimiento de Inventario tipo VENTA
        await tx.movimientoInventario.create({
          data: {
            productoId: item.productoId,
            tipo: TipoMovimientoInventario.VENTA,
            cantidadBultos: -item.cantidadBultos,
            saldoResultante: nuevoStock,
            costoUnitario: costoUnitarioActual,
            referenciaId: venta.id,
            observaciones: `Venta #${venta.numero} - ${cliente.nombre} (${formaPago})`,
          },
        });
      }

      // 5. Impacto Financiero
      if (formaPago === FormaPago.CONTADO) {
        // Ingreso inmediato a caja física
        await tx.movimientoCaja.create({
          data: {
            tipo: TipoMovimientoCaja.INGRESO,
            categoria: "Venta Contado",
            monto: totalVenta,
            descripcion: `Ingreso por Venta de Contado #${venta.numero} a ${cliente.nombre}`,
            referenciaId: venta.id,
          },
        });
      } else {
        // Incrementa la cartera / cuentas por cobrar del cliente
        const nuevoSaldoCliente = Number(cliente.saldoActual) + totalVenta;
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoActual: nuevoSaldoCliente },
        });
      }

      return venta;
    });

    return reply.status(201).send({ venta: resultado });
  });

  // Anular venta (Exclusivo Administrador con Auditoría)
  server.post(
    "/api/ventas/:id/anular",
    { preHandler: requireRoles([Rol.ADMINISTRADOR]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { motivo } = request.body as { motivo?: string };

      if (!motivo || motivo.trim().length < 5) {
        return reply.status(400).send({ error: "Debe proporcionar un motivo detallado para la anulación" });
      }

      const usuarioId = request.user.id;

      const resultado = await prisma.$transaction(async (tx) => {
        const venta = await tx.venta.findUnique({
          where: { id },
          include: { detalles: true, cliente: true },
        });

        if (!venta) {
          throw new Error("Venta no encontrada");
        }
        if (venta.anulada) {
          throw new Error("La venta ya se encuentra anulada");
        }

        // 1. Marcar como anulada
        await tx.venta.update({
          where: { id },
          data: { anulada: true },
        });

        // 2. Reingresar inventario de cada producto
        for (const det of venta.detalles) {
          const prod = await tx.producto.findUnique({ where: { id: det.productoId } });
          if (prod) {
            const stockActual = Number(prod.stockActual);
            const cantReingreso = Number(det.cantidadBultos);
            const nuevoStock = stockActual + cantReingreso;

            await tx.producto.update({
              where: { id: det.productoId },
              data: { stockActual: nuevoStock },
            });

            await tx.movimientoInventario.create({
              data: {
                productoId: det.productoId,
                tipo: TipoMovimientoInventario.AJUSTE,
                cantidadBultos: cantReingreso,
                saldoResultante: nuevoStock,
                costoUnitario: prod.costoPromedio,
                referenciaId: venta.id,
                observaciones: `Reingreso por anulación de Venta #${venta.numero}`,
              },
            });
          }
        }

        // 3. Revertir impacto financiero
        const totalVenta = Number(venta.total);
        if (venta.formaPago === FormaPago.CONTADO) {
          // Salida de caja por anulación
          await tx.movimientoCaja.create({
            data: {
              tipo: TipoMovimientoCaja.EGRESO,
              categoria: "Ajuste Contable",
              monto: totalVenta,
              descripcion: `Reversión en caja por anulación de Venta #${venta.numero}`,
              referenciaId: venta.id,
            },
          });
        } else {
          // Disminuir cartera del cliente
          const saldoPrevio = Number(venta.cliente.saldoActual);
          const nuevoSaldo = Math.max(0, saldoPrevio - totalVenta);
          await tx.cliente.update({
            where: { id: venta.clienteId },
            data: { saldoActual: nuevoSaldo },
          });
        }

        // 4. Registro de auditoría inmutable
        await tx.auditoria.create({
          data: {
            usuarioId,
            accion: "ANULAR_VENTA",
            entidad: "Venta",
            entidadId: venta.id,
            valorAnterior: JSON.stringify({ anulada: false, total: totalVenta }),
            valorNuevo: JSON.stringify({ anulada: true }),
            motivo: motivo.trim(),
          },
        });

        return venta;
      });

      return reply.status(200).send({ ventaAnulada: resultado });
    }
  );
}
