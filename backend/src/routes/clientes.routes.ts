import { FastifyInstance } from "fastify";
import { z } from "zod";
import { NivelRiesgo, Rol } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const CreateClienteSchema = z.object({
  nombre: z.string().min(2, "El nombre del cliente es requerido"),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
  nivelRiesgo: z.nativeEnum(NivelRiesgo).default(NivelRiesgo.BUENO),
});

const UpdateClienteSchema = z.object({
  nombre: z.string().min(2).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
  nivelRiesgo: z.nativeEnum(NivelRiesgo).optional(),
});

export async function clientesRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar todos los clientes
  server.get("/api/clientes", async () => {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
    });

    const formatClientes = clientes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      direccion: c.direccion,
      observaciones: c.observaciones,
      nivelRiesgo: c.nivelRiesgo,
      saldoActual: Number(c.saldoActual),
      createdAt: c.createdAt,
    }));

    return { clientes: formatClientes };
  });

  // Consultar cliente por ID con historial resumido
  server.get("/api/clientes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        ventas: {
          take: 10,
          orderBy: { fecha: "desc" },
          select: {
            id: true,
            numero: true,
            fecha: true,
            total: true,
            formaPago: true,
            anulada: true,
          },
        },
        abonos: {
          take: 10,
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!cliente) {
      return reply.status(404).send({ error: "Cliente no encontrado" });
    }

    return {
      cliente: {
        ...cliente,
        saldoActual: Number(cliente.saldoActual),
      },
    };
  });

  // Crear cliente (todos los roles)
  server.post("/api/clientes", async (request, reply) => {
    const parse = CreateClienteSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const nuevo = await prisma.cliente.create({
      data: {
        ...parse.data,
        saldoActual: 0,
      },
    });

    return reply.status(201).send({ cliente: nuevo });
  });

  // Modificar cliente (Admin y Auxiliar)
  server.put(
    "/api/clientes/:id",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parse = UpdateClienteSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const actualizado = await prisma.cliente.update({
        where: { id },
        data: parse.data,
      });

      return { cliente: actualizado };
    }
  );
}
