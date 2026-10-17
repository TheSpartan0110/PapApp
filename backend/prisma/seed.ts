import { PrismaClient, Rol, NivelRiesgo } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Iniciando carga de datos iniciales...");

  // 1. Usuarios Iniciales
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordAuxiliar = await bcrypt.hash("auxiliar123", 10);
  const passwordVendedor = await bcrypt.hash("vendedor123", 10);

  const admin = await prisma.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nombre: "Administrador General",
      username: "admin",
      passwordHash: passwordAdmin,
      rol: Rol.ADMINISTRADOR,
    },
  });

  await prisma.usuario.upsert({
    where: { username: "auxiliar" },
    update: {},
    create: {
      nombre: "Auxiliar Contable",
      username: "auxiliar",
      passwordHash: passwordAuxiliar,
      rol: Rol.AUXILIAR_CONTABLE,
    },
  });

  await prisma.usuario.upsert({
    where: { username: "vendedor" },
    update: {},
    create: {
      nombre: "Operador de Ventas",
      username: "vendedor",
      passwordHash: passwordVendedor,
      rol: Rol.OPERADOR_VENTAS,
    },
  });

  console.log(`[Seed] Usuarios creados: admin, auxiliar, vendedor`);

  // 2. Catálogo de Productos Iniciales (Sección 6)
  const productosIniciales = [
    { nombre: "Capira Primera", descripcion: "Papa capira de primera calidad y calibre grande", stock: 145.5, costo: 92400 },
    { nombre: "Capira Tronco", descripcion: "Papa capira tamaño intermedio grueso", stock: 48.0, costo: 78000 },
    { nombre: "Capira Medio Pollo", descripcion: "Papa capira tamaño mediano", stock: 62.25, costo: 65000 },
    { nombre: "Capira Menuda", descripcion: "Papa capira de menor calibre", stock: 34.0, costo: 42000 },
    { nombre: "Capira Peladora", descripcion: "Papa óptima para pelado industrial o restaurantes", stock: 20.0, costo: 50000 },
    { nombre: "Capira Rechazo", descripcion: "Papa con defectos superficiales o golpeada", stock: 12.5, costo: 25000 },
    { nombre: "Capira Sobras", descripcion: "Subproducto residual de clasificación", stock: 5.0, costo: 15000 },
  ];

  for (const p of productosIniciales) {
    await prisma.producto.upsert({
      where: { nombre: p.nombre },
      update: {},
      create: {
        nombre: p.nombre,
        descripcion: p.descripcion,
        pesoBultoKg: 50.0,
        activo: true,
        stockActual: p.stock,
        costoPromedio: p.costo,
      },
    });
  }
  console.log(`[Seed] ${productosIniciales.length} productos del catálogo inicial registrados`);

  // 3. Clientes Iniciales con Niveles de Riesgo
  const clientesIniciales = [
    { nombre: "Restaurante Don Pedro", telefono: "310 456 7890", direccion: "Calle 10 # 43-20", nivelRiesgo: NivelRiesgo.EXCELENTE, saldo: 0 },
    { nombre: "Supermercado La 70", telefono: "312 987 6543", direccion: "Cra 70 # 32-15", nivelRiesgo: NivelRiesgo.BUENO, saldo: 2450000 },
    { nombre: "Frutería El Campesino", telefono: "315 222 3344", direccion: "Plaza Central Local 4", nivelRiesgo: NivelRiesgo.REGULAR, saldo: 1120000 },
    { nombre: "Comercializadora Los Paisas", telefono: "318 444 5566", direccion: "Bodega 12 Central", nivelRiesgo: NivelRiesgo.RESTRINGIDO, saldo: 6800000 },
  ];

  for (const c of clientesIniciales) {
    const existing = await prisma.cliente.findFirst({ where: { nombre: c.nombre } });
    if (!existing) {
      await prisma.cliente.create({
        data: {
          nombre: c.nombre,
          telefono: c.telefono,
          direccion: c.direccion,
          nivelRiesgo: c.nivelRiesgo,
          saldoActual: c.saldo,
        },
      });
    }
  }
  console.log(`[Seed] Clientes iniciales registrados`);

  // 4. Proveedores Iniciales
  const proveedoresIniciales = [
    { nombre: "Agropecuaria Sonsón (Campesino)", telefono: "311 111 2233", direccion: "Vereda El Alto", saldo: 12500000, observaciones: "Proveedor principal de papa sucia" },
    { nombre: "Transportes El Páramo (Flete)", telefono: "314 555 6677", direccion: "Terminal de Carga", saldo: 850000, observaciones: "Transporte de camión pesado" },
    { nombre: "Lavadero Las Delicias", telefono: "317 888 9900", direccion: "Sector La Frontera", saldo: 600000, observaciones: "Servicio de lavada por bulto" },
    { nombre: "Cuadrilla Coteros Central", telefono: "319 000 1122", direccion: "Bodega de Descargue", saldo: 320000, observaciones: "Mano de obra descargue y cargue" },
  ];

  for (const prov of proveedoresIniciales) {
    const existing = await prisma.proveedor.findFirst({ where: { nombre: prov.nombre } });
    if (!existing) {
      await prisma.proveedor.create({
        data: {
          nombre: prov.nombre,
          telefono: prov.telefono,
          direccion: prov.direccion,
          saldoActual: prov.saldo,
          observaciones: prov.observaciones,
        },
      });
    }
  }
  console.log(`[Seed] Proveedores iniciales registrados`);

  console.log("[Seed] Carga inicial completada con éxito.");
}

main()
  .catch((e) => {
    console.error("[Seed Error]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
