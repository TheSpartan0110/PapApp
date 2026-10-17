import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { Rol } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; username: string; rol: Rol; nombre: string };
    user: { id: string; username: string; rol: Rol; nombre: string };
  }
}

export async function setupAuth(server: FastifyInstance) {
  const secret = process.env.JWT_SECRET || "papapp_secret_offline_jwt_key_2026";

  await server.register(fastifyJwt, {
    secret,
  });

  server.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "No autorizado", message: "Token inválido o expirado" });
    }
  });
}

export function requireRoles(roles: Rol[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "No autenticado" });
    }

    if (!roles.includes(request.user.rol)) {
      return reply.status(403).send({
        error: "Acceso denegado",
        message: `El rol '${request.user.rol}' no tiene permisos para esta operación`,
      });
    }
  };
}
