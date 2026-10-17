import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Rol } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const CreateProductoSchema = z.object({
  nombre: z.string().min(2, "El nombre del producto es requerido"),
  descripcion: z.string().optional(),
  pesoBultoKg: z.number().positive().default(50.0),
  observaciones: z.string().optional(),
});

const UpdateProductoSchema = z.object({
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional(),
  pesoBultoKg: z.number().positive().optional(),
  observaciones: z.string().optional(),
  activo: z.boolean().optional(),
});

export async function productosRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  // Consulta de catálogo (disponible para todos los roles autenticados)
  server.get("/api/productos", async (request) => {
    const { soloActivos } = request.query as { soloActivos?: string };

    const whereClause: any = {};
    if (soloActivos === "true") {
      whereClause.activo = true;
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
      orderBy: { nombre: "asc" },
    });

    const formatProductos = productos.map((p) => {
      const stockNum = Number(p.stockActual);
      const pesoNum = Number(p.pesoBultoKg);
      const costoNum = Number(p.costoPromedio);

      return {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        pesoBultoKg: pesoNum,
        stockBultos: stockNum,
        equivKg: Number((stockNum * pesoNum).toFixed(2)),
        costoPromedio: costoNum,
        valorTotalStock: Number((stockNum * costoNum).toFixed(2)),
        activo: p.activo,
        observaciones: p.observaciones,
      };
    });

    return { productos: formatProductos };
  });

  // Crear producto comercial (Solo Administrador)
  server.post("/api/productos", { preHandler: requireRoles([Rol.ADMINISTRADOR]) }, async (request, reply) => {
    const parse = CreateProductoSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const { nombre, descripcion, pesoBultoKg, observaciones } = parse.data;

    const exists = await prisma.producto.findUnique({ where: { nombre } });
    if (exists) {
      return reply.status(400).send({ error: "Ya existe un producto con este nombre" });
    }

    const nuevo = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        pesoBultoKg,
        observaciones,
        stockActual: 0,
        costoPromedio: 0,
      },
    });

    return reply.status(201).send({ producto: nuevo });
  });

  // Modificar producto (Solo Administrador)
  server.put("/api/productos/:id", { preHandler: requireRoles([Rol.ADMINISTRADOR]) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = UpdateProductoSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: parse.data,
    });

    return { producto: actualizado };
  });

  // Activar / Desactivar producto (Solo Administrador)
  server.patch("/api/productos/:id/estado", { preHandler: requireRoles([Rol.ADMINISTRADOR]) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { activo } = request.body as { activo: boolean };

    if (typeof activo !== "boolean") {
      return reply.status(400).send({ error: "El estado activo debe ser booleano" });
    }

    const actualizado = await prisma.producto.update({
      where: { id },
      data: { activo },
    });

    return { producto: actualizado };
  });
}
