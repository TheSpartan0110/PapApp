import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const LoginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function authRoutes(server: FastifyInstance) {
  server.post("/api/auth/login", async (request, reply) => {
    const parse = LoginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Datos inválidos", issues: parse.error.format() });
    }

    const { username, password } = parse.data;

    const user = await prisma.usuario.findUnique({
      where: { username },
    });

    if (!user || user.estado !== "ACTIVO") {
      return reply.status(401).send({ error: "Credenciales inválidas o usuario inactivo" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return reply.status(401).send({ error: "Credenciales inválidas" });
    }

    const token = server.jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol,
        nombre: user.nombre,
      },
      { expiresIn: "7d" } // 7 días de sesión local para tablets/móviles
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
      },
    };
  });

  server.get("/api/auth/me", { preHandler: [server.authenticate] }, async (request) => {
    return { user: request.user };
  });
}
