import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Rol } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const CreateProveedorSchema = z.object({
  nombre: z.string().min(2, "El nombre del proveedor es requerido"),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
});

const UpdateProveedorSchema = z.object({
  nombre: z.string().min(2).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
});

export async function proveedoresRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Listar todos los proveedores
  server.get("/api/proveedores", async () => {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: "asc" },
    });

    const formatProveedores = proveedores.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      telefono: p.telefono,
      direccion: p.direccion,
      observaciones: p.observaciones,
      saldoActual: Number(p.saldoActual),
      createdAt: p.createdAt,
    }));

    return { proveedores: formatProveedores };
  });

  // Consultar proveedor por ID con compras recientes
  server.get("/api/proveedores/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        compras: {
          take: 10,
          orderBy: { fecha: "desc" },
        },
        pagos: {
          take: 10,
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!proveedor) {
      return reply.status(404).send({ error: "Proveedor no encontrado" });
    }

    return {
      proveedor: {
        ...proveedor,
        saldoActual: Number(proveedor.saldoActual),
      },
    };
  });

  // Crear proveedor (Admin y Auxiliar)
  server.post(
    "/api/proveedores",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const parse = CreateProveedorSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const nuevo = await prisma.proveedor.create({
        data: {
          ...parse.data,
          saldoActual: 0,
        },
      });

      return reply.status(201).send({ proveedor: nuevo });
    }
  );

  // Modificar proveedor (Admin y Auxiliar)
  server.put(
    "/api/proveedores/:id",
    { preHandler: requireRoles([Rol.ADMINISTRADOR, Rol.AUXILIAR_CONTABLE]) },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parse = UpdateProveedorSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
      }

      const actualizado = await prisma.proveedor.update({
        where: { id },
        data: parse.data,
      });

      return { proveedor: actualizado };
    }
  );
}
