import { useState } from "react";
import {
  Boxes,
  Users,
  Truck,
  Layers,
  Wallet,
  ShieldCheck,
  WifiOff,
  AlertTriangle,
  PlusCircle,
  X,
  ShoppingCart,
  ClipboardList,
  Trash2,
  Receipt,
  BadgeDollarSign,
  Printer,
  Ban,
} from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  stockBultos: number;
  costoPromedio: number;
  pesoBultoKg: number;
  activo: boolean;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  nivelRiesgo: "Excelente" | "Bueno" | "Regular" | "Restringido" | "Bloqueado";
  saldoDeuda: number;
}

interface Proveedor {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  saldoPendiente: number;
}

interface MovimientoKardex {
  id: string;
  fecha: string;
  productoNombre: string;
  tipo: "COMPRA" | "VENTA" | "CLASIFICACION_SALIDA" | "CLASIFICACION_ENTRADA" | "MERMA" | "AJUSTE";
  cantidadBultos: number;
  saldoResultante: number;
  costoUnitario: number;
  observaciones: string;
}

interface ItemVentaForm {
  productoId: string;
  cantidadBultos: number;
  precioUnitario: number;
}

interface VentaRegistrada {
  id: string;
  numero: number;
  fecha: string;
  clienteNombre: string;
  formaPago: "CONTADO" | "CREDITO";
  total: number;
  utilidadEstimada: number;
  itemsCount: number;
  anulada: boolean;
  detalles: {
    productoNombre: string;
    cantidadBultos: number;
    precioUnitario: number;
    costoUnitario: number;
    subtotal: number;
  }[];
}

interface ReciboAbono {
  numero: number;
  fecha: string;
  clienteNombre: string;
  valor: number;
  saldoAnterior: number;
  saldoActual: number;
  observaciones?: string;
}

const PRODUCTOS_INICIALES: Producto[] = [
  { id: "p1", nombre: "Capira Primera", stockBultos: 145.5, costoPromedio: 92400, pesoBultoKg: 50, activo: true },
  { id: "p2", nombre: "Capira Tronco", stockBultos: 48.0, costoPromedio: 78000, pesoBultoKg: 50, activo: true },
  { id: "p3", nombre: "Capira Medio Pollo", stockBultos: 62.25, costoPromedio: 65000, pesoBultoKg: 50, activo: true },
  { id: "p4", nombre: "Capira Menuda", stockBultos: 34.0, costoPromedio: 42000, pesoBultoKg: 50, activo: true },
  { id: "p5", nombre: "Capira Peladora", stockBultos: 20.0, costoPromedio: 50000, pesoBultoKg: 50, activo: true },
  { id: "p6", nombre: "Capira Rechazo", stockBultos: 12.5, costoPromedio: 25000, pesoBultoKg: 50, activo: true },
  { id: "p7", nombre: "Capira Sobras", stockBultos: 5.0, costoPromedio: 15000, pesoBultoKg: 50, activo: true },
];

const CLIENTES_INICIALES: Cliente[] = [
  { id: "c1", nombre: "Restaurante Don Pedro", telefono: "310 456 7890", nivelRiesgo: "Excelente", saldoDeuda: 0 },
  { id: "c2", nombre: "Supermercado La 70", telefono: "312 987 6543", nivelRiesgo: "Bueno", saldoDeuda: 2450000 },
  { id: "c3", nombre: "Frutería El Campesino", telefono: "315 222 3344", nivelRiesgo: "Regular", saldoDeuda: 1120000 },
  { id: "c4", nombre: "Comercializadora Los Paisas", telefono: "318 444 5566", nivelRiesgo: "Restringido", saldoDeuda: 6800000 },
  { id: "c5", nombre: "Puesto Plaza 4 (Bloqueado)", telefono: "316 777 8899", nivelRiesgo: "Bloqueado", saldoDeuda: 4500000 },
];

const PROVEEDORES_INICIALES: Proveedor[] = [
  { id: "pr1", nombre: "Agropecuaria Sonsón (Campesino)", tipo: "Papa Sucia", telefono: "311 111 2233", saldoPendiente: 12500000 },
  { id: "pr2", nombre: "Transportes El Páramo (Flete)", tipo: "Transporte / Flete", telefono: "314 555 6677", saldoPendiente: 850000 },
  { id: "pr3", nombre: "Lavadero Las Delicias", tipo: "Lavada", telefono: "317 888 9900", saldoPendiente: 600000 },
  { id: "pr4", nombre: "Cuadrilla Coteros Central", tipo: "Descargue / Cargue", telefono: "319 000 1122", saldoPendiente: 320000 },
];

const VENTAS_INICIALES: VentaRegistrada[] = [
  {
    id: "v1",
    numero: 1001,
    fecha: "2026-10-17 10:15",
    clienteNombre: "Restaurante Don Pedro",
    formaPago: "CONTADO",
    total: 1050000,
    utilidadEstimada: 126000,
    itemsCount: 1,
    anulada: false,
    detalles: [
      { productoNombre: "Capira Primera", cantidadBultos: 10, precioUnitario: 105000, costoUnitario: 92400, subtotal: 1050000 },
    ],
  },
  {
    id: "v2",
    numero: 1002,
    fecha: "2026-10-17 11:30",
    clienteNombre: "Supermercado La 70",
    formaPago: "CREDITO",
    total: 2450000,
    utilidadEstimada: 310000,
    itemsCount: 2,
    anulada: false,
    detalles: [
      { productoNombre: "Capira Primera", cantidadBultos: 20, precioUnitario: 102000, costoUnitario: 92400, subtotal: 2040000 },
      { productoNombre: "Capira Menuda", cantidadBultos: 8, precioUnitario: 51250, costoUnitario: 42000, subtotal: 410000 },
    ],
  },
];

const KARDEX_INICIAL: MovimientoKardex[] = [
  { id: "k1", fecha: "2026-10-17 08:30", productoNombre: "Capira Primera", tipo: "COMPRA", cantidadBultos: 100, saldoResultante: 145.5, costoUnitario: 90000, observaciones: "Entrada por compra proveedor" },
  { id: "k2", fecha: "2026-10-17 09:15", productoNombre: "Capira Tronco", tipo: "COMPRA", cantidadBultos: 48, saldoResultante: 48.0, costoUnitario: 78000, observaciones: "Entrada viaje #12" },
  { id: "k3", fecha: "2026-10-17 10:15", productoNombre: "Capira Primera", tipo: "VENTA", cantidadBultos: -10, saldoResultante: 135.5, costoUnitario: 92400, observaciones: "Venta #1001 a Restaurante Don Pedro" },
  { id: "k4", fecha: "2026-10-17 11:00", productoNombre: "Capira Primera", tipo: "CLASIFICACION_SALIDA", cantidadBultos: -20, saldoResultante: 115.5, costoUnitario: 90000, observaciones: "Salida a clasificación de bultos" },
  { id: "k5", fecha: "2026-10-17 11:45", productoNombre: "Capira Menuda", tipo: "CLASIFICACION_ENTRADA", cantidadBultos: 3, saldoResultante: 34.0, costoUnitario: 42000, observaciones: "Subproducto de clasificación" },
  { id: "k6", fecha: "2026-10-17 14:00", productoNombre: "Capira Rechazo", tipo: "MERMA", cantidadBultos: -2.5, saldoResultante: 12.5, costoUnitario: 25000, observaciones: "Merma por descomposición natural" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "inventario" | "ventas" | "compras" | "clasificacion" | "kardex" | "clientes" | "proveedores" | "caja"
  >("ventas");
  const [currentRole, setCurrentRole] = useState<"ADMIN" | "AUXILIAR" | "VENDEDOR">("VENDEDOR");

  // Domain states
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_INICIALES);
  const [proveedores, setProveedores] = useState<Proveedor[]>(PROVEEDORES_INICIALES);
  const [ventas, setVentas] = useState<VentaRegistrada[]>(VENTAS_INICIALES);
  const [kardex, setKardex] = useState<MovimientoKardex[]>(KARDEX_INICIAL);
  const [saldoCaja, setSaldoCaja] = useState<number>(3950000);

  // Modals state
  const [showModalProducto, setShowModalProducto] = useState(false);
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalAbono, setShowModalAbono] = useState(false);
  const [comprobanteActivo, setComprobanteActivo] = useState<VentaRegistrada | null>(null);
  const [reciboAbonoActivo, setReciboAbonoActivo] = useState<ReciboAbono | null>(null);

  // POS Venta State
  const [posClienteId, setPosClienteId] = useState<string>("c1");
  const [posFormaPago, setPosFormaPago] = useState<"CONTADO" | "CREDITO">("CONTADO");
  const [posObservaciones, setPosObservaciones] = useState<string>("");
  const [posItems, setPosItems] = useState<ItemVentaForm[]>([
    { productoId: "p1", cantidadBultos: 5, precioUnitario: 104000 },
  ]);

  // Abono Form State
  const [abonoClienteId, setAbonoClienteId] = useState<string>("c2");
  const [abonoValor, setAbonoValor] = useState<number>(500000);
  const [abonoObs, setAbonoObs] = useState<string>("Pago en efectivo");

  // New item form states
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState("");
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoClienteTel, setNuevoClienteTel] = useState("");
  const [nuevoClienteRiesgo, setNuevoClienteRiesgo] = useState<Cliente["nivelRiesgo"]>("Bueno");
  const [nuevoProveedorNombre, setNuevoProveedorNombre] = useState("");
  const [nuevoProveedorTipo, setNuevoProveedorTipo] = useState("Papa Sucia");
  const [nuevoProveedorTel, setNuevoProveedorTel] = useState("");

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  const totalBultosInventario = productos.reduce((acc, p) => acc + p.stockBultos, 0);
  const valorTotalInventario = productos.reduce((acc, p) => acc + p.stockBultos * p.costoPromedio, 0);
  const totalCartera = clientes.reduce((acc, c) => acc + c.saldoDeuda, 0);
  const totalCxP = proveedores.reduce((acc, p) => acc + p.saldoPendiente, 0);

  // Cliente seleccionado en el POS
  const clienteSeleccionado = clientes.find((c) => c.id === posClienteId) || clientes[0];
  const esClienteBloqueado = clienteSeleccionado?.nivelRiesgo === "Bloqueado";

  // POS Handlers
  const handleAddItemPos = () => {
    setPosItems([
      ...posItems,
      { productoId: productos[0]?.id || "p1", cantidadBultos: 1, precioUnitario: 95000 },
    ]);
  };

  const handleRemoveItemPos = (index: number) => {
    if (posItems.length <= 1) return;
    setPosItems(posItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemPos = (index: number, field: keyof ItemVentaForm, value: any) => {
    const updated = [...posItems];
    updated[index] = { ...updated[index], [field]: value };
    setPosItems(updated);
  };

  const totalVentaCalculado = posItems.reduce(
    (acc, item) => acc + item.cantidadBultos * item.precioUnitario,
    0
  );

  const totalBultosVenta = posItems.reduce((acc, item) => acc + item.cantidadBultos, 0);

  // Ejecución de Venta (POS)
  const handleEjecutarVenta = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar regla de crédito vs riesgo
    if (posFormaPago === "CREDITO" && esClienteBloqueado) {
      alert("Operación denegada: Este cliente está BLOQUEADO para ventas a crédito. Solo puede venderse de contado.");
      return;
    }

    // 2. Validar stock disponible de cada producto (Inventario Negativo Prohibido)
    for (const item of posItems) {
      const prod = productos.find((p) => p.id === item.productoId);
      if (!prod) continue;
      if (prod.stockBultos < item.cantidadBultos) {
        alert(
          `Inventario insuficiente para ${prod.nombre}: solicitados ${item.cantidadBultos} bultos, pero solo hay ${prod.stockBultos.toFixed(
            2
          )} disponibles.`
        );
        return;
      }
    }

    // 3. Procesar venta atómica
    const nuevosProductos = [...productos];
    const nuevosKardex: MovimientoKardex[] = [];
    const detallesVenta: VentaRegistrada["detalles"] = [];
    let costoVentaTotal = 0;
    const nuevoNumero = ventas.length > 0 ? Math.max(...ventas.map((v) => v.numero)) + 1 : 1001;
    const fechaActual = new Date().toISOString().replace("T", " ").substring(0, 16);

    posItems.forEach((item) => {
      const idx = nuevosProductos.findIndex((p) => p.id === item.productoId);
      if (idx !== -1) {
        const prod = nuevosProductos[idx];
        const stockPrevio = prod.stockBultos;
        const nuevoStock = stockPrevio - item.cantidadBultos;
        const subtotal = item.cantidadBultos * item.precioUnitario;
        costoVentaTotal += item.cantidadBultos * prod.costoPromedio;

        nuevosProductos[idx] = { ...prod, stockBultos: nuevoStock };

        detallesVenta.push({
          productoNombre: prod.nombre,
          cantidadBultos: item.cantidadBultos,
          precioUnitario: item.precioUnitario,
          costoUnitario: prod.costoPromedio,
          subtotal,
        });

        nuevosKardex.push({
          id: "k_" + Date.now() + Math.random(),
          fecha: fechaActual,
          productoNombre: prod.nombre,
          tipo: "VENTA",
          cantidadBultos: -item.cantidadBultos,
          saldoResultante: nuevoStock,
          costoUnitario: prod.costoPromedio,
          observaciones: `Venta #${nuevoNumero} a ${clienteSeleccionado.nombre} (${posFormaPago})`,
        });
      }
    });

    const nuevaVenta: VentaRegistrada = {
      id: "v_" + Date.now(),
      numero: nuevoNumero,
      fecha: fechaActual,
      clienteNombre: clienteSeleccionado.nombre,
      formaPago: posFormaPago,
      total: totalVentaCalculado,
      utilidadEstimada: totalVentaCalculado - costoVentaTotal,
      itemsCount: posItems.length,
      anulada: false,
      detalles: detallesVenta,
    };

    setProductos(nuevosProductos);
    setKardex([...nuevosKardex, ...kardex]);
    setVentas([nuevaVenta, ...ventas]);

    // 4. Impacto Financiero
    if (posFormaPago === "CONTADO") {
      setSaldoCaja((prev) => prev + totalVentaCalculado);
    } else {
      setClientes((prev) =>
        prev.map((c) =>
          c.id === posClienteId ? { ...c, saldoDeuda: c.saldoDeuda + totalVentaCalculado } : c
        )
      );
    }

    // Reiniciar formulario y mostrar comprobante
    setPosItems([{ productoId: productos[0]?.id || "p1", cantidadBultos: 1, precioUnitario: 95000 }]);
    setPosObservaciones("");
    setComprobanteActivo(nuevaVenta);
  };

  // Anulación de Venta (Solo Admin)
  const handleAnularVenta = (ventaId: string) => {
    if (currentRole !== "ADMIN") {
      alert("Solo el Administrador puede anular ventas (Sección 5).");
      return;
    }

    const motivo = prompt("Ingrese el motivo justificado de la anulación:");
    if (!motivo || motivo.trim().length < 4) {
      alert("Debe especificar un motivo válido.");
      return;
    }

    const v = ventas.find((venta) => venta.id === ventaId);
    if (!v || v.anulada) return;

    // Reingresar stock
    const nuevosProductos = [...productos];
    const nuevosKardex: MovimientoKardex[] = [];
    const fechaActual = new Date().toISOString().replace("T", " ").substring(0, 16);

    v.detalles.forEach((det) => {
      const idx = nuevosProductos.findIndex((p) => p.nombre === det.productoNombre);
      if (idx !== -1) {
        const prod = nuevosProductos[idx];
        const nuevoStock = prod.stockBultos + det.cantidadBultos;
        nuevosProductos[idx] = { ...prod, stockBultos: nuevoStock };

        nuevosKardex.push({
          id: "k_" + Date.now() + Math.random(),
          fecha: fechaActual,
          productoNombre: prod.nombre,
          tipo: "AJUSTE",
          cantidadBultos: det.cantidadBultos,
          saldoResultante: nuevoStock,
          costoUnitario: prod.costoPromedio,
          observaciones: `Reingreso por anulación de Venta #${v.numero}: ${motivo}`,
        });
      }
    });

    // Revertir financiero
    if (v.formaPago === "CONTADO") {
      setSaldoCaja((prev) => prev - v.total);
    } else {
      setClientes((prev) =>
        prev.map((c) =>
          c.nombre === v.clienteNombre ? { ...c, saldoDeuda: Math.max(0, c.saldoDeuda - v.total) } : c
        )
      );
    }

    setProductos(nuevosProductos);
    setKardex([...nuevosKardex, ...kardex]);
    setVentas(ventas.map((venta) => (venta.id === ventaId ? { ...venta, anulada: true } : venta)));
  };

  // Ejecución de Abono de Cliente
  const handleEjecutarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === abonoClienteId);
    if (!cliente) return;

    if (cliente.saldoDeuda <= 0) {
      alert(`El cliente ${cliente.nombre} no presenta saldo pendiente.`);
      return;
    }

    if (abonoValor > cliente.saldoDeuda) {
      alert(`El abono ($${abonoValor.toLocaleString()}) no puede exceder la deuda ($${cliente.saldoDeuda.toLocaleString()}).`);
      return;
    }

    const saldoAnterior = cliente.saldoDeuda;
    const nuevoSaldo = saldoAnterior - abonoValor;

    // Actualizar cliente
    setClientes(
      clientes.map((c) => (c.id === abonoClienteId ? { ...c, saldoDeuda: nuevoSaldo } : c))
    );

    // Ingresar dinero a caja
    setSaldoCaja((prev) => prev + abonoValor);

    // Generar recibo
    const recibo: ReciboAbono = {
      numero: Math.floor(100 + Math.random() * 900),
      fecha: new Date().toISOString().replace("T", " ").substring(0, 16),
      clienteNombre: cliente.nombre,
      valor: abonoValor,
      saldoAnterior,
      saldoActual: nuevoSaldo,
      observaciones: abonoObs,
    };

    setShowModalAbono(false);
    setReciboAbonoActivo(recibo);
  };

  const handleCrearProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProductoNombre.trim()) return;
    const nuevo: Producto = {
      id: "p_" + Date.now(),
      nombre: nuevoProductoNombre.trim(),
      stockBultos: 0,
      costoPromedio: 0,
      pesoBultoKg: 50,
      activo: true,
    };
    setProductos([...productos, nuevo]);
    setNuevoProductoNombre("");
    setShowModalProducto(false);
  };

  const handleCrearCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoClienteNombre.trim()) return;
    const nuevo: Cliente = {
      id: "c_" + Date.now(),
      nombre: nuevoClienteNombre.trim(),
      telefono: nuevoClienteTel.trim() || "N/A",
      nivelRiesgo: nuevoClienteRiesgo,
      saldoDeuda: 0,
    };
    setClientes([...clientes, nuevo]);
    setNuevoClienteNombre("");
    setNuevoClienteTel("");
    setShowModalCliente(false);
  };

  const handleCrearProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProveedorNombre.trim()) return;
    const nuevo: Proveedor = {
      id: "pr_" + Date.now(),
      nombre: nuevoProveedorNombre.trim(),
      tipo: nuevoProveedorTipo,
      telefono: nuevoProveedorTel.trim() || "N/A",
      saldoPendiente: 0,
    };
    setProveedores([...proveedores, nuevo]);
    setNuevoProveedorNombre("");
    setNuevoProveedorTel("");
    setShowModalProveedor(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Offline LAN Banner */}
      <header className="bg-stone-900 text-stone-100 px-4 py-3 border-b border-stone-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600 text-white p-2 rounded-lg font-black text-xl tracking-wider shadow-inner flex items-center gap-1.5">
              <span>🥔</span>
              <span>PapApp</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Sistema Operativo de Bodega y Comercialización
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-900/80 text-emerald-300 rounded-full border border-emerald-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Fase 3 Activa: POS & Cartera
                </span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <WifiOff className="w-3 h-3" />
                  Red Local LAN (100% Offline)
                </span>
                <span>•</span>
                <span>Servidor Local: 192.168.1.100</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-stone-800 rounded-lg p-1 border border-stone-700">
              <span className="text-xs text-stone-400 px-2">Rol activo:</span>
              <button
                onClick={() => setCurrentRole("ADMIN")}
                className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                  currentRole === "ADMIN" ? "bg-amber-600 text-white shadow" : "text-stone-300 hover:text-white"
                }`}
              >
                Administrador
              </button>
              <button
                onClick={() => setCurrentRole("AUXILIAR")}
                className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                  currentRole === "AUXILIAR" ? "bg-amber-600 text-white shadow" : "text-stone-300 hover:text-white"
                }`}
              >
                Auxiliar
              </button>
              <button
                onClick={() => setCurrentRole("VENDEDOR")}
                className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                  currentRole === "VENDEDOR" ? "bg-amber-600 text-white shadow" : "text-stone-300 hover:text-white"
                }`}
              >
                Ventas
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Metric Quick Stats */}
      <div className="bg-white border-b border-stone-200 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3">
            <div className="text-xs text-stone-700 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Inventario Disponible</span>
              <Boxes className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1 text-xl font-black text-stone-800">
              {totalBultosInventario.toFixed(2)} <span className="text-xs font-normal text-stone-700">bultos</span>
            </div>
            <div className="text-xs text-stone-700 font-medium">
              Equiv: {(totalBultosInventario * 50).toLocaleString("es-CO")} Kg • {formatCOP(valorTotalInventario)}
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3">
            <div className="text-xs text-stone-700 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Efectivo en Caja</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 text-xl font-black text-emerald-700">
              {formatCOP(saldoCaja)}
            </div>
            <div className="text-xs text-stone-700 font-medium">Apertura + Contado + Abonos</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3">
            <div className="text-xs text-stone-700 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Cartera por Cobrar</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1 text-xl font-black text-blue-700">
              {formatCOP(totalCartera)}
            </div>
            <div className="text-xs text-stone-700 font-medium">{clientes.length} clientes en seguimiento</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-3">
            <div className="text-xs text-stone-700 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Cuentas por Pagar</span>
              <Truck className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-1 text-xl font-black text-rose-700">
              {formatCOP(totalCxP)}
            </div>
            <div className="text-xs text-stone-700 font-medium">Papa sucia, fletes, lavada</div>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <nav className="flex space-x-2 border-b border-stone-300 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ventas")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "ventas"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <BadgeDollarSign className="w-4 h-4" />
            Punto de Venta (POS) & Ventas
          </button>
          <button
            onClick={() => setActiveTab("inventario")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "inventario"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <Boxes className="w-4 h-4" />
            Catálogo de Existencias
          </button>
          <button
            onClick={() => setActiveTab("clientes")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "clientes"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Cartera & Abonos
          </button>
          {currentRole !== "VENDEDOR" && (
            <button
              onClick={() => setActiveTab("compras")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === "compras"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Compras (Entradas)
            </button>
          )}
          <button
            onClick={() => setActiveTab("clasificacion")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "clasificacion"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Clasificación (Secc. 9)
          </button>
          <button
            onClick={() => setActiveTab("kardex")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "kardex"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Kardex
          </button>
          <button
            onClick={() => setActiveTab("proveedores")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "proveedores"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            Proveedores
          </button>
          <button
            onClick={() => setActiveTab("caja")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "caja"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Caja Diaria
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* TAB 1: VENTAS & POS */}
        {activeTab === "ventas" && (
          <div className="space-y-6">
            {/* POS Grid: Formulario de Venta a la izquierda / Resumen y Ventas del Día a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario POS (2 Columnas) */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-xs p-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                  <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
                    <BadgeDollarSign className="w-5 h-5 text-amber-600" />
                    Registrar Venta de Papa (Contado / Crédito)
                  </h2>
                  <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-md border border-amber-200">
                    Precios Negociables
                  </span>
                </div>

                <form onSubmit={handleEjecutarVenta} className="space-y-4">
                  {/* Fila Cliente & Forma de Pago */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Cliente</label>
                      <select
                        value={posClienteId}
                        onChange={(e) => setPosClienteId(e.target.value)}
                        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold"
                      >
                        {clientes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.nivelRiesgo} • Deuda: {formatCOP(c.saldoDeuda)})
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 flex items-center gap-2 text-2xs">
                        <span className="text-stone-500">Riesgo:</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            clienteSeleccionado?.nivelRiesgo === "Excelente"
                              ? "bg-emerald-100 text-emerald-800"
                              : clienteSeleccionado?.nivelRiesgo === "Bueno"
                              ? "bg-blue-100 text-blue-800"
                              : clienteSeleccionado?.nivelRiesgo === "Regular"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {clienteSeleccionado?.nivelRiesgo}
                        </span>
                        {esClienteBloqueado && (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Solo Contado
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Forma de Pago</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPosFormaPago("CONTADO")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                            posFormaPago === "CONTADO"
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                              : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
                          }`}
                        >
                          💵 Contado (Caja)
                        </button>
                        <button
                          type="button"
                          disabled={esClienteBloqueado}
                          onClick={() => setPosFormaPago("CREDITO")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                            posFormaPago === "CREDITO"
                              ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                              : esClienteBloqueado
                              ? "bg-stone-200 text-stone-400 border-stone-200 cursor-not-allowed"
                              : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
                          }`}
                        >
                          📋 Crédito (Cartera)
                        </button>
                      </div>
                      <span className="text-2xs text-stone-500 mt-1 block">
                        {posFormaPago === "CONTADO"
                          ? "Suma directamente al saldo físico de caja."
                          : "Aumenta la cuenta por cobrar del cliente."}
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Productos a Vender */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-stone-700">Variedades y Cantidades ({posItems.length})</label>
                      <button
                        type="button"
                        onClick={handleAddItemPos}
                        className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        + Agregar otra variedad
                      </button>
                    </div>

                    <div className="space-y-2 border border-stone-200 rounded-xl p-3 bg-stone-50 max-h-72 overflow-y-auto">
                      {posItems.map((item, idx) => {
                        const prod = productos.find((p) => p.id === item.productoId);
                        const costoRef = prod?.costoPromedio || 0;
                        const esBajoCosto = item.precioUnitario > 0 && item.precioUnitario < costoRef;
                        const stockInsuficiente = prod ? item.cantidadBultos > prod.stockBultos : false;

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs bg-white transition ${
                              stockInsuficiente
                                ? "border-rose-400 bg-rose-50/50"
                                : "border-stone-200"
                            }`}
                          >
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <div className="flex-1 min-w-[150px]">
                                <select
                                  value={item.productoId}
                                  onChange={(e) => handleUpdateItemPos(idx, "productoId", e.target.value)}
                                  className="w-full border border-stone-300 rounded px-2 py-1.5 font-semibold"
                                >
                                  {productos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nombre} (Disp: {p.stockBultos.toFixed(2)} btos)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="w-24">
                                <input
                                  type="number"
                                  step="0.25"
                                  placeholder="Bultos"
                                  value={item.cantidadBultos}
                                  onChange={(e) =>
                                    handleUpdateItemPos(idx, "cantidadBultos", parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full border border-stone-300 rounded px-2 py-1.5 text-right font-bold"
                                />
                              </div>
                              <span className="text-stone-400">btos</span>

                              <div className="w-32">
                                <input
                                  type="number"
                                  step="500"
                                  placeholder="Precio Negociado"
                                  value={item.precioUnitario}
                                  onChange={(e) =>
                                    handleUpdateItemPos(idx, "precioUnitario", parseFloat(e.target.value) || 0)
                                  }
                                  className={`w-full border rounded px-2 py-1.5 text-right font-bold ${
                                    esBajoCosto ? "border-rose-400 bg-rose-50 text-rose-800" : "border-stone-300"
                                  }`}
                                />
                              </div>

                              <div className="w-28 text-right font-black text-stone-800">
                                {formatCOP(item.cantidadBultos * item.precioUnitario)}
                              </div>

                              {posItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemPos(idx)}
                                  className="text-stone-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Alertas informativas por línea */}
                            <div className="flex items-center justify-between mt-1 text-2xs text-stone-500">
                              <span>
                                Equiv: {(item.cantidadBultos * (prod?.pesoBultoKg || 50)).toFixed(1)} Kg • Costo ref:{" "}
                                {formatCOP(costoRef)}/bto
                              </span>
                              {esBajoCosto && (
                                <span className="text-amber-700 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  ¡Precio bajo el costo promedio!
                                </span>
                              )}
                              {stockInsuficiente && (
                                <span className="text-rose-700 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Stock insuficiente (solo {prod?.stockBultos} disponibles)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Observaciones / Notas del Cliente</label>
                    <input
                      type="text"
                      placeholder="Placa del vehículo, detalles de empaque o notas..."
                      value={posObservaciones}
                      onChange={(e) => setPosObservaciones(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Resumen Total y Botón de Venta */}
                  <div className="bg-stone-900 text-white p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs text-stone-400">Total a Pagar ({totalBultosVenta.toFixed(2)} bultos):</div>
                      <div className="text-2xl font-black text-amber-400">{formatCOP(totalVentaCalculado)}</div>
                    </div>
                    <button
                      type="submit"
                      disabled={posItems.length === 0 || totalVentaCalculado <= 0}
                      className="bg-amber-600 hover:bg-amber-700 disabled:bg-stone-700 text-white font-black text-sm px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
                    >
                      <Receipt className="w-5 h-5" />
                      Emitir Venta
                    </button>
                  </div>
                </form>
              </div>

              {/* Historial de Ventas Recientes (1 Columna) */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
                  <h3 className="font-bold text-sm text-stone-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Ventas del Día ({ventas.length})
                  </h3>
                  <span className="text-2xs text-stone-500">Últimas transacciones</span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[460px] flex-1 pr-1">
                  {ventas.map((v) => (
                    <div
                      key={v.id}
                      className={`p-3 rounded-lg border text-xs transition ${
                        v.anulada
                          ? "bg-stone-100 border-stone-300 opacity-60"
                          : "bg-stone-50 border-stone-200 hover:bg-amber-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-stone-700">#{v.numero}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-2xs ${
                              v.formaPago === "CONTADO"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {v.formaPago}
                          </span>
                          {v.anulada && (
                            <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-2xs">
                              ANULADA
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="font-bold text-stone-800 text-sm truncate">{v.clienteNombre}</div>
                      <div className="text-stone-500 text-2xs mt-0.5">{v.fecha}</div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/80">
                        <div>
                          <div className="font-black text-stone-900 text-sm">{formatCOP(v.total)}</div>
                          <div className="text-2xs text-emerald-700 font-semibold">
                            Utilidad: +{formatCOP(v.utilidadEstimada)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setComprobanteActivo(v)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded hover:bg-stone-100"
                            title="Ver Comprobante"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {currentRole === "ADMIN" && !v.anulada && (
                            <button
                              onClick={() => handleAnularVenta(v.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-white border border-rose-200 rounded hover:bg-rose-50"
                              title="Anular Venta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTARIO */}
        {activeTab === "inventario" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Existencias Actuales por Clasificación</h2>
                <p className="text-xs text-stone-700">
                  Unidad operativa oficial: <span className="font-semibold text-amber-700">Bultos fraccionados</span> (1 Bulto = 50 Kg)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentRole === "ADMIN" && (
                  <button
                    onClick={() => setShowModalProducto(true)}
                    className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Nueva Variedad
                  </button>
                )}
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Inventario Negativo Prohibido
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Clasificación / Variedad</th>
                    <th className="py-3 px-4 text-right">Existencia (Bultos)</th>
                    <th className="py-3 px-4 text-right">Equiv. Kilos</th>
                    <th className="py-3 px-4 text-right">Costo Promedio / Bto</th>
                    <th className="py-3 px-4 text-right">Valor Total Stock</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {productos.map((prod) => (
                    <tr key={prod.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3 px-4 font-semibold text-stone-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {prod.nombre}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-stone-900">
                        {prod.stockBultos.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-stone-700">bultos</span>
                      </td>
                      <td className="py-3 px-4 text-right text-stone-700">
                        {(prod.stockBultos * prod.pesoBultoKg).toLocaleString("es-CO")} kg
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-stone-700">
                        {formatCOP(prod.costoPromedio)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCOP(prod.stockBultos * prod.costoPromedio)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CLIENTES & ABONOS */}
        {activeTab === "clientes" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Directorio de Clientes & Gestión de Cartera</h2>
                <p className="text-xs text-stone-700">Seguimiento de crédito, abonos de cartera y semáforo de riesgo.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowModalAbono(true)}
                  className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition"
                >
                  <Receipt className="w-4 h-4" />
                  Registrar Abono
                </button>
                <button
                  onClick={() => setShowModalCliente(true)}
                  className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  Registrar Cliente
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4 text-center">Nivel de Riesgo</th>
                    <th className="py-3 px-4 text-right">Saldo Deuda Actual</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {clientes.map((cli) => (
                    <tr key={cli.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-bold text-stone-800">{cli.nombre}</td>
                      <td className="py-3 px-4 text-stone-700 font-mono text-xs">{cli.telefono}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            cli.nivelRiesgo === "Excelente"
                              ? "bg-emerald-100 text-emerald-800"
                              : cli.nivelRiesgo === "Bueno"
                              ? "bg-blue-100 text-blue-800"
                              : cli.nivelRiesgo === "Regular"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {cli.nivelRiesgo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-stone-900">
                        {formatCOP(cli.saldoDeuda)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cli.saldoDeuda > 0 && (
                          <button
                            onClick={() => {
                              setAbonoClienteId(cli.id);
                              setAbonoValor(Math.min(500000, cli.saldoDeuda));
                              setShowModalAbono(true);
                            }}
                            className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold px-2 py-1 rounded transition"
                          >
                            Abonar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: COMPRAS */}
        {activeTab === "compras" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-6 text-center space-y-3">
              <h2 className="text-lg font-bold text-stone-800">Entradas de Inventario & Compras Multi-ítem</h2>
              <p className="text-xs text-stone-600">
                Las compras afectan directamente el inventario físico y recalculan el costo promedio ponderado de adquisición.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: CLASIFICACION */}
        {activeTab === "clasificacion" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-600" />
                    Proceso de Clasificación y Transformación con Mermas
                  </h2>
                  <p className="text-xs text-stone-700 mt-0.5">
                    Sección 9: La merma es absorbida por el producto principal (*Capira Primera*) para proteger el margen de rentabilidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: KARDEX */}
        {activeTab === "kardex" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-700" />
                  Kardex Oficial de Movimientos de Inventario
                </h2>
                <p className="text-xs text-stone-700">Trazabilidad inmutable de ventas, compras, clasificaciones y mermas.</p>
              </div>
              <span className="text-xs bg-stone-100 text-stone-700 font-bold px-3 py-1 rounded-md border border-stone-300">
                {kardex.length} registros auditados
              </span>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4 text-center">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-right">Bultos</th>
                    <th className="py-3 px-4 text-right">Saldo Resultante</th>
                    <th className="py-3 px-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {kardex.map((mov) => (
                    <tr key={mov.id} className="hover:bg-amber-50/30 transition text-xs">
                      <td className="py-3 px-4 font-mono text-stone-500 whitespace-nowrap">{mov.fecha}</td>
                      <td className="py-3 px-4 font-bold text-stone-800">{mov.productoNombre}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-2xs ${
                            mov.tipo === "VENTA"
                              ? "bg-amber-100 text-amber-900"
                              : mov.tipo === "COMPRA"
                              ? "bg-emerald-100 text-emerald-800"
                              : mov.tipo === "MERMA"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {mov.tipo}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black ${
                          mov.cantidadBultos > 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {mov.cantidadBultos > 0 ? `+${mov.cantidadBultos.toFixed(2)}` : mov.cantidadBultos.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900">
                        {mov.saldoResultante.toFixed(2)} bto
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">{mov.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PROVEEDORES */}
        {activeTab === "proveedores" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Proveedores & Cuentas por Pagar (CxP)</h2>
                <p className="text-xs text-stone-700">Control de compras a campesinos, fletes, lavaderos y descargadores.</p>
              </div>
              <button
                onClick={() => setShowModalProveedor(true)}
                className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar Proveedor
              </button>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Proveedor / Tercero</th>
                    <th className="py-3 px-4">Categoría de Costo</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {proveedores.map((prov) => (
                    <tr key={prov.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-bold text-stone-800">{prov.nombre}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300">
                          {prov.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-700 font-mono text-xs">{prov.telefono}</td>
                      <td className="py-3 px-4 text-right font-black text-rose-700">
                        {formatCOP(prov.saldoPendiente)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: CAJA */}
        {activeTab === "caja" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Flujo de Caja Diario & Arqueo
              </h2>
              <p className="text-xs text-stone-700 mb-4">
                El saldo de caja se alimenta automáticamente con cada venta de contado y abono recibido.
              </p>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900 uppercase">Saldo Actual en Caja Física</div>
                  <div className="text-3xl font-black text-amber-950 mt-1">{formatCOP(saldoCaja)}</div>
                </div>
                <button
                  onClick={() => setShowModalAbono(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Registrar Recaudo / Abono
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL COMPROBANTE DE VENTA (SECCIÓN 20) */}
      {comprobanteActivo && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-stone-300">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-amber-600" />
                <h3 className="font-bold text-base text-stone-900">
                  Comprobante de Venta #{comprobanteActivo.numero}
                </h3>
              </div>
              <button onClick={() => setComprobanteActivo(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Fecha y Hora:</span>
                <span className="font-bold text-stone-800">{comprobanteActivo.fecha}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Cliente:</span>
                <span className="font-bold text-stone-900">{comprobanteActivo.clienteNombre}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Forma de Pago:</span>
                <span className="font-bold text-emerald-700">{comprobanteActivo.formaPago}</span>
              </div>

              {/* Renglones de Productos */}
              <div className="mt-3">
                <div className="font-bold text-stone-700 mb-1.5 uppercase text-2xs">Productos Despachados:</div>
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-2xs">
                    <thead className="bg-stone-50 border-b border-stone-200 font-bold text-stone-600">
                      <tr>
                        <th className="py-2 px-2.5">Variedad</th>
                        <th className="py-2 px-2 text-right">Bultos</th>
                        <th className="py-2 px-2 text-right">Precio/Bto</th>
                        <th className="py-2 px-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {comprobanteActivo.detalles.map((d, i) => (
                        <tr key={i}>
                          <td className="py-2 px-2.5 font-bold text-stone-800">{d.productoNombre}</td>
                          <td className="py-2 px-2 text-right">{d.cantidadBultos.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right">{formatCOP(d.precioUnitario)}</td>
                          <td className="py-2 px-2.5 text-right font-black">{formatCOP(d.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 mt-3 flex items-center justify-between text-sm">
                <span className="font-bold text-stone-700">Total Liquidado:</span>
                <span className="text-lg font-black text-amber-700">{formatCOP(comprobanteActivo.total)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                Imprimir Recibo
              </button>
              <button
                onClick={() => setComprobanteActivo(null)}
                className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ABONO */}
      {showModalAbono && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-stone-300">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-base text-emerald-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Registrar Abono a Cartera
              </h3>
              <button onClick={() => setShowModalAbono(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEjecutarAbono} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Cliente Deudor</label>
                <select
                  value={abonoClienteId}
                  onChange={(e) => {
                    setAbonoClienteId(e.target.value);
                    const c = clientes.find((cli) => cli.id === e.target.value);
                    if (c) setAbonoValor(Math.min(500000, c.saldoDeuda));
                  }}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Deuda: {formatCOP(c.saldoDeuda)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Monto Abonado (Efectivo)</label>
                <input
                  type="number"
                  step="5000"
                  min="1000"
                  value={abonoValor}
                  onChange={(e) => setAbonoValor(parseFloat(e.target.value) || 0)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-black text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={abonoObs}
                  onChange={(e) => setAbonoObs(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Detalle o número de referencia..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalAbono(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECIBO DE ABONO OFICIAL (SECCIÓN 20) */}
      {reciboAbonoActivo && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-stone-300">
            <div className="text-center pb-3 border-b border-stone-200 mb-4">
              <span className="text-2xl">🥔</span>
              <h3 className="font-black text-base text-stone-900">PapApp - Recibo de Abono</h3>
              <div className="text-xs text-stone-500 font-mono">Recibo #{reciboAbonoActivo.numero}</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Fecha:</span>
                <span className="font-bold">{reciboAbonoActivo.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Cliente:</span>
                <span className="font-bold">{reciboAbonoActivo.clienteNombre}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-stone-500">Saldo Anterior:</span>
                <span>{formatCOP(reciboAbonoActivo.saldoAnterior)}</span>
              </div>
              <div className="flex justify-between font-black text-emerald-700 text-sm">
                <span>Valor Abonado:</span>
                <span>+{formatCOP(reciboAbonoActivo.valor)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-stone-900">
                <span>Saldo Actual Deudor:</span>
                <span>{formatCOP(reciboAbonoActivo.saldoActual)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setReciboAbonoActivo(null)}
                className="w-full text-xs font-bold text-white bg-stone-800 hover:bg-stone-900 py-2 rounded-lg"
              >
                Cerrar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA VARIEDAD / PRODUCTO */}
      {showModalProducto && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-stone-300">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-base text-stone-800">Agregar Variedad / Producto</h3>
              <button onClick={() => setShowModalProducto(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearProducto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Comercial de la Variedad</label>
                <input
                  type="text"
                  placeholder="Ej: Pastusa, Puracé, Nevada, Roja..."
                  value={nuevoProductoNombre}
                  onChange={(e) => setNuevoProductoNombre(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalProducto(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR CLIENTE */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-stone-300">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-base text-stone-800">Registrar Nuevo Cliente</h3>
              <button onClick={() => setShowModalCliente(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearCliente} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Comercial o Persona</label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora La Central"
                  value={nuevoClienteNombre}
                  onChange={(e) => setNuevoClienteNombre(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="300 123 4567"
                  value={nuevoClienteTel}
                  onChange={(e) => setNuevoClienteTel(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nivel de Riesgo Crediticio</label>
                <select
                  value={nuevoClienteRiesgo}
                  onChange={(e) => setNuevoClienteRiesgo(e.target.value as Cliente["nivelRiesgo"])}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                >
                  <option value="Excelente">Excelente (Pago puntual)</option>
                  <option value="Bueno">Bueno (Estándar)</option>
                  <option value="Regular">Regular (Plazo controlado)</option>
                  <option value="Restringido">Restringido (Solo con abono)</option>
                  <option value="Bloqueado">Bloqueado (Solo contado)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalCliente(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PROVEEDOR */}
      {showModalProveedor && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-stone-300">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-base text-stone-800">Registrar Proveedor o Servicio</h3>
              <button onClick={() => setShowModalProveedor(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearProveedor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre o Empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Fletes Don Carlos, Campesino Pedro..."
                  value={nuevoProveedorNombre}
                  onChange={(e) => setNuevoProveedorNombre(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Categoría de Costo</label>
                <select
                  value={nuevoProveedorTipo}
                  onChange={(e) => setNuevoProveedorTipo(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                >
                  <option value="Papa Sucia">Papa Sucia (Campesino / Productor)</option>
                  <option value="Transporte / Flete">Transporte / Flete de Camión</option>
                  <option value="Lavada">Lavadero de Papa</option>
                  <option value="Descargue / Cargue">Descargue y Cargue (Coteros)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="310 999 8877"
                  value={nuevoProveedorTel}
                  onChange={(e) => setNuevoProveedorTel(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-amber-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalProveedor(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 text-center py-3 text-xs text-stone-700">
        PapApp v1.2 • Fase 3 Operativa: POS, Ventas Contado, Ventas Crédito & Abonos • LAN Offline
      </footer>
    </div>
  );
}
