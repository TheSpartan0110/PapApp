import { FastifyInstance } from "fastify";
import { z } from "zod";
import { MotivoMerma, Rol, TipoMovimientoInventario } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const CreateMermaSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidadBultos: z.number().positive("La cantidad a mermar debe ser mayor a 0"),
  motivo: z.nativeEnum(MotivoMerma),
  observaciones: z.string().optional(),
});

export async function mermasRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar registro histórico de mermas
  server.get("/api/mermas", async (request) => {
    const { productoId, motivo } = request.query as {
      productoId?: string;
      motivo?: MotivoMerma;
    };

    const whereClause: any = {};
    if (productoId) whereClause.productoId = productoId;
    if (motivo) whereClause.motivo = motivo;

    const mermas = await prisma.merma.findMany({
      where: whereClause,
      orderBy: { fecha: "desc" },
      include: {
        producto: { select: { id: true, nombre: true } },
      },
    });

    const formatMermas = mermas.map((m) => {
      const bultos = Number(m.cantidadBultos);
      const costo = Number(m.costoUnitario);

      return {
        id: m.id,
        fecha: m.fecha,
        producto: m.producto,
        cantidadBultos: bultos,
        equivKg: Number((bultos * 50).toFixed(2)),
        costoUnitario: costo,
        perdidaValorTotal: Number((bultos * costo).toFixed(2)),
        motivo: m.motivo,
        observaciones: m.observaciones,
      };
    });

    return { mermas: formatMermas };
  });

  // Registrar nueva merma (Admin y Auxiliar)
  server.post(
    "/api/mermas",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const parse = CreateMermaSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const { productoId, cantidadBultos, motivo, observaciones } = parse.data;
      const usuarioId = request.user.id;

      const resultado = await prisma.$transaction(async (tx) => {
        const prod = await tx.producto.findUnique({ where: { id: productoId } });
        if (!prod) {
          throw new Error("Producto no encontrado");
        }

        const stockActual = Number(prod.stockActual);
        if (stockActual < cantidadBultos) {
          throw new Error(
            `Inventario insuficiente para mermar: se solicitan ${cantidadBultos} bultos pero solo hay ${stockActual} disponibles en ${prod.nombre}.`
          );
        }

        const nuevoStock = stockActual - cantidadBultos;
        const costoUnitario = Number(prod.costoPromedio);

        // 1. Descontar del inventario
        await tx.producto.update({
          where: { id: productoId },
          data: { stockActual: nuevoStock },
        });

        // 2. Registrar registro formal de Merma (Sección 16)
        const merma = await tx.merma.create({
          data: {
            productoId,
            cantidadBultos,
            costoUnitario,
            motivo,
            observaciones,
          },
        });

        // 3. Registrar Movimiento de Inventario tipo MERMA
        await tx.movimientoInventario.create({
          data: {
            productoId,
            tipo: TipoMovimientoInventario.MERMA,
            cantidadBultos: -cantidadBultos,
            saldoResultante: nuevoStock,
            costoUnitario,
            referenciaId: merma.id,
            observaciones: `Merma por ${motivo}: ${observaciones || "Sin observaciones"}`,
          },
        });

        // 4. Auditoría (RNF-05 y Sección 21)
        await tx.auditoria.create({
          data: {
            usuarioId,
            accion: "REGISTRO_MERMA",
            entidad: "Merma",
            entidadId: merma.id,
            valorAnterior: JSON.stringify({ stockBultos: stockActual }),
            valorNuevo: JSON.stringify({ stockBultos: nuevoStock, cantidadMermada: cantidadBultos, motivo }),
            motivo: `Merma de ${cantidadBultos} bultos de ${prod.nombre} por motivo: ${motivo}`,
          },
        });

        return merma;
      });

      return reply.status(201).send({ merma: resultado });
    }
  );
}
