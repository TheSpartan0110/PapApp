import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Rol, EstadoUsuario } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRoles } from "../plugins/auth.js";

const CreateUsuarioSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z.nativeEnum(Rol),
});

const UpdateUsuarioSchema = z.object({
  nombre: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  rol: z.nativeEnum(Rol).optional(),
  estado: z.nativeEnum(EstadoUsuario).optional(),
});

export async function usuariosRoutes(server: FastifyInstance) {
  // Todas las rutas de usuarios requieren rol ADMINISTRADOR
  server.addHook("preHandler", server.authenticate);

  server.get("/api/usuarios", { preHandler: requireRoles([Rol.ADMINISTRADOR]) }, async () => {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nombre: "asc" },
    });
    return { usuarios };
  });

  server.post("/api/usuarios", { preHandler: requireRoles([Rol.ADMINISTRADOR]) }, async (request, reply) => {
    const parse = CreateUsuarioSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const { nombre, username, password, rol } = parse.data;

    const exists = await prisma.usuario.findUnique({ where: { username } });
    if (exists) {
      return reply.status(400).send({ error: "El nombre de usuario ya existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        username,
        passwordHash,
        rol,
      },
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estado: true,
        createdAt: true,
      },
    });

    return reply.status(201).send({ usuario: nuevo });
  });

  server.put("/api/usuarios/:id", { preHandler: requireRoles([Rol.ADMINISTRADOR]) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = UpdateUsuarioSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const dataToUpdate: any = {};
    if (parse.data.nombre) dataToUpdate.nombre = parse.data.nombre;
    if (parse.data.rol) dataToUpdate.rol = parse.data.rol;
    if (parse.data.estado) dataToUpdate.estado = parse.data.estado;
    if (parse.data.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(parse.data.password, 10);
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estado: true,
      },
    });

    return { usuario: actualizado };
  });
}
