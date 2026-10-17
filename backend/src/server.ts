import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { setupAuth } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usuariosRoutes } from "./routes/usuarios.routes.js";
import { productosRoutes } from "./routes/productos.routes.js";
import { clientesRoutes } from "./routes/clientes.routes.js";
import { proveedoresRoutes } from "./routes/proveedores.routes.js";
import { comprasRoutes } from "./routes/compras.routes.js";
import { inventarioRoutes } from "./routes/inventario.routes.js";
import { clasificacionesRoutes } from "./routes/clasificaciones.routes.js";
import { mermasRoutes } from "./routes/mermas.routes.js";
import { ventasRoutes } from "./routes/ventas.routes.js";
import { abonosRoutes } from "./routes/abonos.routes.js";

dotenv.config();

const server = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  },
});

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  // CORS habilitado para acceso desde tablets y móviles en red LAN local
  await server.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  // Autenticación JWT y guards de roles
  await setupAuth(server);

  // Módulos Fase 1 (Configuración y Catálogos)
  await server.register(authRoutes);
  await server.register(usuariosRoutes);
  await server.register(productosRoutes);
  await server.register(clientesRoutes);
  await server.register(proveedoresRoutes);

  // Módulos Fase 2 (Compras, Inventario, Clasificación y Mermas)
  await server.register(comprasRoutes);
  await server.register(inventarioRoutes);
  await server.register(clasificacionesRoutes);
  await server.register(mermasRoutes);

  // Módulos Fase 3 (Ventas Contado, Ventas Crédito y Abonos)
  await server.register(ventasRoutes);
  await server.register(abonosRoutes);

  // Healthcheck
  server.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "PapApp API",
      version: "1.2.0",
      fases: [
        "Fase 1: Catálogos & Auth",
        "Fase 2: Compras, Inventario, Clasificación, Mermas",
        "Fase 3: Ventas Contado, Ventas Crédito, Abonos de Cartera",
      ],
    };
  });

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`[PapApp API] Servidor iniciado en http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
