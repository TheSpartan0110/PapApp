const API_URL = import.meta.env.VITE_API_URL || "";

export interface UserSession {
  id: string;
  nombre: string;
  username: string;
  rol: "ADMINISTRADOR" | "AUXILIAR_CONTABLE" | "OPERADOR_VENTAS";
}

export interface ItemCompraInput {
  productoId: string;
  cantidadBultos: number;
  precioUnitario: number;
}

export interface CreateCompraInput {
  proveedorId: string;
  formaPago: "CONTADO" | "CREDITO";
  observaciones?: string;
  items: ItemCompraInput[];
}

export interface DestinoClasificacionInput {
  productoDestinoId: string;
  cantidadDestino: number;
  costoAsignado?: number;
}

export interface CreateClasificacionInput {
  productoOrigenId: string;
  cantidadOrigen: number;
  cantidadPerdida: number;
  observaciones?: string;
  destinos: DestinoClasificacionInput[];
}

export interface CreateMermaInput {
  productoId: string;
  cantidadBultos: number;
  motivo: "DANO" | "DESCOMPOSICION" | "ERROR_OPERATIVO" | "AJUSTE_AUTORIZADO" | "OTROS";
  observaciones?: string;
}

export interface ItemVentaInput {
  productoId: string;
  cantidadBultos: number;
  precioUnitario: number;
  descuento?: number;
}

export interface CreateVentaInput {
  clienteId: string;
  formaPago: "CONTADO" | "CREDITO";
  descuento?: number;
  observaciones?: string;
  items: ItemVentaInput[];
}

export interface CreateAbonoInput {
  clienteId: string;
  valor: number;
  observaciones?: string;
}

let currentToken: string | null = localStorage.getItem("papapp_token");

export const api = {
  setToken(token: string | null) {
    currentToken = token;
    if (token) {
      localStorage.setItem("papapp_token", token);
    } else {
      localStorage.removeItem("papapp_token");
    }
  },

  getToken() {
    return currentToken;
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Error ${res.status}`);
    }

    return res.json();
  },

  // Auth
  async login(username: string, password: string) {
    const res = await this.request<{ token: string; user: UserSession }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.token);
    return res;
  },

  async me() {
    return this.request<{ user: UserSession }>("/api/auth/me");
  },

  // Productos
  async getProductos(soloActivos = false) {
    return this.request<{ productos: any[] }>(`/api/productos?soloActivos=${soloActivos}`);
  },

  async createProducto(data: { nombre: string; descripcion?: string; pesoBultoKg?: number }) {
    return this.request<{ producto: any }>("/api/productos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Clientes
  async getClientes() {
    return this.request<{ clientes: any[] }>("/api/clientes");
  },

  async createCliente(data: { nombre: string; telefono?: string; direccion?: string; nivelRiesgo: string }) {
    return this.request<{ cliente: any }>("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Proveedores
  async getProveedores() {
    return this.request<{ proveedores: any[] }>("/api/proveedores");
  },

  async createProveedor(data: { nombre: string; telefono?: string; direccion?: string; observaciones?: string }) {
    return this.request<{ proveedor: any }>("/api/proveedores", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Compras (Fase 2)
  async getCompras() {
    return this.request<{ compras: any[] }>("/api/compras");
  },

  async createCompra(data: CreateCompraInput) {
    return this.request<{ compra: any }>("/api/compras", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Inventario & Kardex (Fase 2)
  async getKardex(params?: { productoId?: string; tipo?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.productoId) query.append("productoId", params.productoId);
    if (params?.tipo) query.append("tipo", params.tipo);
    if (params?.limit) query.append("limit", params.limit.toString());
    return this.request<{ kardex: any[] }>(`/api/inventario/kardex?${query.toString()}`);
  },

  async getResumenInventario() {
    return this.request<{ resumen: any }>("/api/inventario/resumen");
  },

  async ajusteInventario(data: {
    productoId: string;
    tipoAjuste: "INCREMENTO" | "DECREMENTO";
    cantidadBultos: number;
    motivo: string;
  }) {
    return this.request<{ ajuste: any }>("/api/inventario/ajuste", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Clasificaciones (Fase 2)
  async getClasificaciones() {
    return this.request<{ clasificaciones: any[] }>("/api/clasificaciones");
  },

  async createClasificacion(data: CreateClasificacionInput) {
    return this.request<{ clasificacion: any }>("/api/clasificaciones", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Mermas (Fase 2)
  async getMermas(params?: { productoId?: string; motivo?: string }) {
    const query = new URLSearchParams();
    if (params?.productoId) query.append("productoId", params.productoId);
    if (params?.motivo) query.append("motivo", params.motivo);
    return this.request<{ mermas: any[] }>(`/api/mermas?${query.toString()}`);
  },

  async createMerma(data: CreateMermaInput) {
    return this.request<{ merma: any }>("/api/mermas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Ventas (Fase 3)
  async getVentas(params?: { clienteId?: string; formaPago?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.clienteId) query.append("clienteId", params.clienteId);
    if (params?.formaPago) query.append("formaPago", params.formaPago);
    if (params?.limit) query.append("limit", params.limit.toString());
    return this.request<{ ventas: any[] }>(`/api/ventas?${query.toString()}`);
  },

  async getVenta(id: string) {
    return this.request<{ venta: any }>(`/api/ventas/${id}`);
  },

  async createVenta(data: CreateVentaInput) {
    return this.request<{ venta: any }>("/api/ventas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async anularVenta(id: string, motivo: string) {
    return this.request<{ ventaAnulada: any }>(`/api/ventas/${id}/anular`, {
      method: "POST",
      body: JSON.stringify({ motivo }),
    });
  },

  // Abonos (Fase 3)
  async getAbonos(clienteId?: string) {
    const query = clienteId ? `?clienteId=${clienteId}` : "";
    return this.request<{ abonos: any[] }>(`/api/abonos${query}`);
  },

  async createAbono(data: CreateAbonoInput) {
    return this.request<{ reciboAbono: any }>("/api/abonos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
