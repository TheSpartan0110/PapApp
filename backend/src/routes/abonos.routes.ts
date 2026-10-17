import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Rol, TipoMovimientoCaja } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const CreateAbonoSchema = z.object({
  clienteId: z.string().uuid("ID de cliente inválido"),
  valor: z.number().positive("El valor del abono debe ser mayor a 0"),
  observaciones: z.string().optional(),
});

export async function abonosRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar historial de abonos
  server.get("/api/abonos", async (request) => {
    const { clienteId, limit } = request.query as { clienteId?: string; limit?: string };

    const whereClause: any = {};
    if (clienteId) whereClause.clienteId = clienteId;

    const abonos = await prisma.abonoCliente.findMany({
      where: whereClause,
      orderBy: { fecha: "desc" },
      take: limit ? Number(limit) : 50,
      include: {
        cliente: {
          select: { id: true, nombre: true, telefono: true, nivelRiesgo: true },
        },
      },
    });

    const formatAbonos = abonos.map((a) => ({
      id: a.id,
      numero: a.numero,
      fecha: a.fecha,
      cliente: a.cliente,
      valor: Number(a.valor),
      saldoAnterior: Number(a.saldoAnterior),
      saldoActual: Number(a.saldoActual),
      observaciones: a.observaciones,
    }));

    return { abonos: formatAbonos };
  });

  // Registrar abono de cliente (Admin y Auxiliar Contable)
  server.post(
    "/api/abonos",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const parse = CreateAbonoSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const { clienteId, valor, observaciones } = parse.data;

      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Obtener cliente y saldo actual
        const cliente = await tx.cliente.findUnique({ where: { id: clienteId } });
        if (!cliente) {
          throw new Error("Cliente no encontrado");
        }

        const saldoPrevio = Number(cliente.saldoActual);
        if (saldoPrevio <= 0) {
          throw new Error(`El cliente ${cliente.nombre} no presenta saldo pendiente por cobrar.`);
        }

        if (valor > saldoPrevio) {
          throw new Error(
            `El valor del abono ($${valor.toLocaleString("es-CO")}) excede la deuda actual del cliente ($${saldoPrevio.toLocaleString("es-CO")}).`
          );
        }

        const nuevoSaldo = saldoPrevio - valor;

        // 2. Actualizar saldo del cliente
        await tx.cliente.update({
          where: { id: clienteId },
          data: { saldoActual: nuevoSaldo },
        });

        // 3. Crear registro formal de Abono
        const abono = await tx.abonoCliente.create({
          data: {
            clienteId,
            valor,
            saldoAnterior: saldoPrevio,
            saldoActual: nuevoSaldo,
            observaciones,
          },
        });

        // 4. Generar Ingreso en Caja (Sección 14: Categoría Abono Ventas)
        await tx.movimientoCaja.create({
          data: {
            tipo: TipoMovimientoCaja.INGRESO,
            categoria: "Abono Ventas",
            monto: valor,
            descripcion: `Abono a cartera Recibo #${abono.numero} de ${cliente.nombre}`,
            referenciaId: abono.id,
          },
        });

        return {
          abono,
          cliente: cliente.nombre,
          saldoAnterior: saldoPrevio,
          nuevoSaldo,
        };
      });

      return reply.status(201).send({ reciboAbono: resultado });
    }
  );
}
