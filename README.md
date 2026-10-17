# PapApp 🥔

> Sistema web interno de gestión comercial, inventario, cartera, proveedores, caja y reportes para empresa comercializadora de papa. Diseñado para operar **100% Offline en red local (LAN)**.

---

## 🚀 Arquitectura y Tecnologías (ADR-006)

- **Backend:** Node.js (TypeScript) + Fastify (Monolito Modular)
- **Base de Datos:** PostgreSQL 16 con Prisma ORM (Modo relacional con 14 entidades)
- **Frontend:** React 18 + Vite + TailwindCSS (Mobile-first, optimizado para PC, Tablet y Móvil)
- **Despliegue:** Docker Compose con volúmenes persistentes y reinicio automático

---

## 📦 Estructura del Proyecto

```
TheSpartan0110_PapApp/
├── docker-compose.yml       # Orquestación de PostgreSQL, Backend y Frontend
├── .env.example             # Plantilla de variables de entorno
├── spec.md                  # Especificación funcional y técnica v1.2
├── backend/                 # API Fastify + Prisma + JWT Auth
│   ├── prisma/
│   │   ├── schema.prisma    # Modelado relacional completo
│   │   └── seed.ts          # Datos iniciales (roles, productos, clientes, prov)
│   └── src/
│       ├── routes/          # Rutas de Fase 1 (Auth, Usuarios, Productos, Clientes, Prov)
│       ├── plugins/         # Middleware de JWT y Role guards
│       └── server.ts        # Punto de entrada Fastify
└── frontend/                # Interfaz React Vite
    ├── src/
    │   ├── api/client.ts    # Cliente HTTP tipado con token storage
    │   ├── App.tsx          # Dashboard operativo y simulador de clasificación
    │   └── index.css        # Estilos base y tokens visuales
    └── nginx.conf           # Configuración para contenedor Nginx
```

---

## 🛠️ Puesta en Marcha

### Opción 1: Con Docker Compose (Recomendada para producción / LAN)

1. Iniciar Docker Desktop en Windows.
2. Ejecutar:
   ```bash
   docker compose up -d --build
   ```
3. Abrir en el navegador:
   - **Frontend:** `http://localhost:3000` (o `http://<IP_LOCAL>:3000` desde tablets/celulares en la misma red Wi-Fi).
   - **API Backend:** `http://localhost:4000/health`

### Opción 2: Desarrollo Local Directo (npm)

1. **Configurar base de datos** en `.env` (o usar contenedor PostgreSQL).
2. **Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 👥 Usuarios de Prueba Iniciales (Seed)

| Usuario | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMINISTRADOR` | Acceso total, configuración, gestión de usuarios y catálogo |
| `auxiliar` | `auxiliar123` | `AUXILIAR_CONTABLE` | Compras, proveedores, caja, gastos y cartera |
| `vendedor` | `vendedor123` | `OPERADOR_VENTAS` | Registro de ventas contado/crédito y consulta de clientes |

---

## 📄 Reglas Clave del Negocio

1. **Unidad Operativa en Bultos:** El inventario se controla en bultos fraccionados (ej. `0.25`, `1.50` bultos). El peso estándar de 50 Kg/bulto es solo para cálculo informativo de kilogramos.
2. **Absorción de Merma en Clasificación:** En el proceso de selección y clasificación (Sección 9), la merma o pérdida es absorbida por el producto principal (*Capira Primera*), protegiendo la rentabilidad bruta.
3. **Control de Caja y Auditoría:** Los movimientos financieros son inmutables; cualquier modificación de valores requiere supervisión de administración.