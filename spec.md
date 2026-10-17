**PapApp - Spec.md v1.2**

Estado: Aprobado para diseño e implementación

Versión: 1.2

Fecha: Octubre 2026

# **1. Resumen**
PapApp es un sistema web interno de gestión comercial, inventario, cartera, proveedores, caja y reportes para una empresa dedicada a la compra y venta de bultos de papa.

El sistema permitirá controlar inventario, compras, ventas de contado y crédito, pagos, recaudos, gastos operativos, préstamos y cierre diario de caja.

PapApp funcionará como sistema operativo interno del negocio y no reemplazará el sistema contable oficial (SIGO).

# **2. Objetivos del Negocio**
## **OBJ-01**
Conocer el inventario real disponible en cualquier momento.
## **OBJ-02**
Controlar las cuentas por cobrar derivadas de ventas a crédito.
## **OBJ-03**
Controlar las cuentas por pagar a proveedores.
## **OBJ-04**
Controlar el flujo de caja diario.
## **OBJ-05**
Calcular la rentabilidad real del negocio.
## **OBJ-06**
Reducir errores operativos.
## **OBJ-07**
Mantener trazabilidad completa de todas las operaciones.
## **OBJ-08**
Centralizar la información comercial y financiera del negocio.

# **3. Fuera de Alcance**
No forman parte de la versión 1.x:

- Facturación electrónica DIAN.

- Nómina formal.

- Declaraciones tributarias.

- Contabilidad oficial.

- Integración automática con SIGO.

- Integración bancaria.

- Multiempresa.

- Múltiples sucursales.

- Aplicación móvil nativa.

- Lectores de código de barras.

- Gestión documental avanzada.

# **4. Contexto Operativo**
## **Operación actual**
- Una empresa.

- Una bodega.

- Un punto de venta.

- Un administrador (dueño).

- Una auxiliar contable.

- Posibles vendedores.
## **Conectividad**
El sistema debe operar completamente sin Internet.
## **Acceso**
- Navegador web.

- Computador principal.

- Tablet.

- Smartphone mediante interfaz responsive.

# **5. Usuarios y Roles**
## **Administrador**
Permisos:

- Gestión de usuarios.

- Configuración del sistema.

- Gestión de productos.

- Ajustes de inventario.

- Anulación de movimientos.

- Correcciones.

- Gestión de préstamos.

- Gestión financiera.

- Apertura y cierre de caja.

- Consulta de todos los reportes.

## **Auxiliar Contable**
Permisos:

- Compras.

- Proveedores.

- Registro de pagos.

- Registro de ingresos.

- Registro de egresos.

- Gestión de cartera.

- Cierre diario de caja.

## **Operador de Ventas**
Permisos:

- Registrar ventas (contado y crédito).

- Consultar clientes.

- Modificar datos no monetarios de ventas del día (ej. notas, datos del cliente).

Restricciones:

- No puede modificar precios, cantidades o valores de ventas ya registradas sin autorización del Administrador (para no descuadrar caja ni inventario).

- No puede anular movimientos financieros.

- No puede realizar ajustes de inventario.

- No puede modificar cierres de caja.

# **6. Catálogo de Productos**
## **Regla General**
Cada clasificación comercial de papa se maneja como un producto independiente.
## **Productos Iniciales**
- Capira Primera

- Capira Tronco

- Capira Medio Pollo

- Capira Menuda

- Capira Peladora

- Capira Rechazo

- Capira Sobras
## **Productos Futuros**
El sistema debe permitir agregar sin intervención técnica:

- Nevada

- Roja

- Pastusa

- Puracé

- Otras variedades
## **Datos de Producto**
`Nombre` `Descripción` `Peso estándar por bulto (50 Kg por defecto)` `Activo/Inactivo` `Observaciones`

# 7. Reglas de Medición
## Unidad Operativa Oficial
La unidad oficial de operación del negocio es:

| 1     `Bulto`2      |
| --- |
Todos los movimientos deben almacenarse en bultos.

## Cantidades Decimales
Se permiten cantidades fraccionadas.

Ejemplos:

| 1     `0.25 Bultos`2     `0.50 Bultos`3     `1.50 Bultos`4     `10.75 Bultos` |
| --- |
## Conversión Informativa
Para fines informativos:

| 1     `1 Bulto = 50 Kg` |
| --- |
La equivalencia en kilogramos será calculada automáticamente únicamente para visualización y reportes.

El sistema NO utilizará kilogramos como unidad principal de inventario.

# 8. Gestión de Inventario
## Objetivos
Controlar:

- Existencias.

- Entradas.

- Salidas.

- Clasificaciones.

- Mermas.

- Ajustes.

## Inventario Negativo
Prohibido.

El sistema no permitirá registrar movimientos que produzcan inventario negativo.

## Gestión sin Lotes
Decisión adoptada:

| 1     `No se manejarán lotes.` |
| --- |
El sistema mantendrá únicamente existencias acumuladas por producto.

# 9. Clasificación de Inventario
## Descripción
El negocio realiza clasificación de papa.

Durante este proceso un producto puede transformarse en otros productos.

Además, la clasificación puede generar pérdidas.

## Ejemplo
Entrada:

| 1     `20 bultos Capira Primera` |
| --- |
Resultado:

| 1     `15 bultos Capira Primera`2     `3 bultos Capira Menuda`3     `1 bulto Capira Rechazo`4     `0.5 bultos Capira Sobras`5     `0.5 bultos Pérdida` |
| --- |
## Regla de Balance de Masa
La suma de productos generados más la pérdida debe ser igual a la cantidad clasificada.

| 1     `Inventario Clasificado`2     3     `=`4     5     `Productos Generados`6     7     `+`8     9     `Pérdida` |
| --- |

## Regla de Valoración de Costos en Clasificación
- **Absorción de Pérdida:** El producto principal clasificado (ej. Capira Primera) absorbe el costo monetario de la merma/pérdida, lo cual eleva su costo unitario útil real.
- **Subproductos:** Los subproductos derivados (Menuda, Rechazo, Sobras) ingresan al inventario a un costo base de referencia proporcional o menor acorde a su valor comercial estimado.

## Datos de Clasificación


| 1     `Fecha`2     `Producto origen`3     `Cantidad origen`4     `Productos destino`5     `Cantidades destino`6     `Cantidad perdida`7     `Observaciones`8     `Usuario` |
| --- |
# 10. Compras
## Objetivo
Registrar entradas de inventario.

**Nota:** El precio de compra de la papa sucia registrado aquí NO es el costo final de inventario. El costo unitario real de entrada se calcula mediante el Costo Integral de Adquisición (ver Sección 18).

## Datos Mínimos


| 1     `Fecha`2     `Proveedor`3     `Producto`4     `Cantidad (Bultos)`5     `Precio Unitario por Bulto`6     `Valor Total`7     `Forma de Pago`8     `Observaciones` |
| --- |
## Modalidades
### Compra de Contado
Genera:

| 1     `Entrada Inventario`2     `+`3     `Salida de Caja` |
| --- |
### Compra a Crédito
Genera:

| 1     `Entrada Inventario`2     `+`3     `Cuenta por Pagar` |
| --- |
# 11. Ventas
## Modalidades
### Venta de Contado
Genera:

| 1     `Salida Inventario`2     `+`3     `Ingreso Caja` |
| --- |
### Venta a Crédito
Genera:

| 1     `Salida Inventario`2     `+`3     `Cuenta por Cobrar` |
| --- |
## Estructura de Transacción
Toda venta (y compra) es **Multi-ítem**: un encabezado de transacción (cliente, fecha, forma de pago, total) con $N$ líneas de detalle (producto, cantidad en bultos, precio unitario pactado, descuento, subtotal).

## Política de Precios
No existe lista fija de precios.

El precio es negociado según:

- Cliente.

- Cantidad.

- Condiciones de mercado.

- Competencia.

- Decisión del vendedor.

## Datos de Venta


| 1     `Fecha`2     `Cliente`3     `Detalle Productos`4     `Total Transacción`5     `Forma de Pago`6     `Observaciones`7     `Vendedor` |
| --- |
# 12. Clientes
## Datos


| 1     `Nombre`2     `Teléfono`3     `Dirección`4     `Observaciones`5     `Nivel de Riesgo` |
| --- |
## Niveles de Riesgo


| 1     `Excelente`2     `Bueno`3     `Regular`4     `Restringido`5     `Bloqueado` |
| --- |
## Operaciones
- Crear cliente.

- Actualizar cliente.

- Consultar deuda.

- Consultar historial.

- Registrar abonos.

- Consultar cartera.

# 13. Proveedores
## Operaciones
- Crear proveedor.

- Registrar compra.

- Consultar saldo.

- Registrar pago parcial.

- Registrar pago total.

- Consultar historial.

# 14. Caja
## Apertura Diaria
La apertura utilizará:

| 1     `Saldo Final del Día Anterior` |
| --- |
## Ingresos
Categorías iniciales:

| 1     `Venta Contado`2     `Abono Ventas`3     `Préstamo Recibido`4     `Descuento`5     `Ajuste Contable`6     `Otros` |
| --- |
## Egresos
Categorías iniciales:

| 1     `Pago Proveedor`2     `Pago Cargue y Descargue`3     `Flete`4     `Lavada`5     `Préstamo`6     `Cafetería`7     `Costales`8     `Papelería`9     `Propina`10     `Pasada`11     `Seguro`12     `Coomerca`13     `Subsidio`14     `Gastos Banco`15     `Ajuste Contable`16     `Descuento`17     `Salario`18     `Servicios Públicos`19     `Otros` |
| --- |
# 15. Gestión de Préstamos
## Préstamo al Propietario
Cuando el dueño retira dinero de caja:

| 1     `Caja`2     `↓`3     `Préstamo al Propietario` |
| --- |
Genera:

| 1     `Egreso`2     `Cuenta Pendiente` |
| --- |
Cuando devuelve el dinero:

| 1     `Ingreso`2     `Disminución de Deuda` |
| --- |
## Préstamos Externos
Permite registrar obligaciones con:

- Bancos.

- Prestamistas.

- Socios.

- Terceros.

Operaciones:

- Crear obligación.

- Consultar saldo.

- Registrar pagos.

- Consultar historial.

# 16. Mermas
## Motivos Permitidos


| 1     `Daño`2     `Descomposición`3     `Error Operativo`4     `Ajuste Autorizado`5     `Otros`6      |
| --- |
## Efectos


| 1     `Reduce Inventario`2     `Genera Auditoría`3     `No Genera Venta`4     `No Genera Ingreso` |
| --- |
# 17. Cierre de Caja
## Objetivo
Conciliar ingresos, egresos y saldo final.

## Información Calculada


| 1     `Ventas Contado`2     3     `+`4     5     `Abonos Recibidos`6     7     `+`8     9     `Otros Ingresos`10     11     `=`12     13     `Total Entradas` |
| --- |


| 1     `Pagos Proveedores`2     3     `+`4     5     `Gastos`6     7     `+`8     9     `Préstamos`10     11     `=`12     13     `Total Salidas` |
| --- |


| 1     `Saldo Inicial`2     3     `+`4     5     `Entradas`6     7     `-`8     9     `Salidas`10     11     `=`12     13     `Saldo Esperado` |
| --- |
## Datos de Cierre


| 1     `Fecha`2     `Saldo Inicial`3     `Entradas`4     `Salidas`5     `Saldo Esperado`6     `Saldo Real`7     `Diferencia`8     `Observaciones`9     `Usuario` |
| --- |
# 18. Método de Costeo
## Costo Integral de Adquisición
El costo unitario de inventario NO es únicamente el precio de compra de la papa sucia.

El costo real de entrada al inventario es el **Costo Integral de Adquisición**, que incluye todos los costos necesarios para tener la papa lista para venta:

### Componentes del Costo Integral

| Componente | Descripción |
| --- | --- |
| Costo Papa Sucia | Precio de compra al proveedor |
| Lavada | Costo del proceso de lavado |
| Flete | Costo de transporte |
| Descargue | Costo de cargue y descargue |

### Fórmula del Costo Unitario de Entrada

```
Costo Unitario de Entrada (Papa Lavada)
=
(Costo Papa Sucia + Lavada + Flete + Descargue)
/
Cantidad de Bultos Procesados
```

### Ejemplo
Se compran 100 bultos de Capira Primera:

| Concepto | Valor |
| --- | --- |
| Costo Papa Sucia (100 bultos × $80.000) | $8.000.000 |
| Lavada | $500.000 |
| Flete | $300.000 |
| Descargue | $200.000 |
| **Total Costo Integral** | **$9.000.000** |
| **Costo Unitario de Entrada** | **$90.000 / bulto** |

### Regla
El sistema debe tomar la suma total de los costos asociados a una entrada de inventario (compra + lavada + flete + descargue), dividirla entre la cantidad de bultos procesados, y el valor resultante es el costo unitario de entrada que se utilizará para calcular el Costo de Ventas y la Utilidad.

## Método Oficial de Valoración


| 1     `Promedio Ponderado` |
| --- |

Una vez calculado el Costo Unitario de Entrada (papa lavada), este valor alimenta el cálculo de Promedio Ponderado del inventario.

## Fórmula del Promedio Ponderado


```
Costo Promedio
=
(Valor Inventario Existente + Valor Nueva Entrada)
/
(Cantidad Existente + Cantidad Nueva Entrada)
```

Donde **Valor Nueva Entrada** = Costo Unitario de Entrada (papa lavada) × Cantidad de bultos ingresados.

## Aplicaciones
- Valoración de inventario.

- Costo de Ventas.

- Utilidad bruta.

- Rentabilidad por producto, cliente y período.

- Reportes financieros.

# 19. Reportes
## Inventario
- Existencias actuales.

- Kardex.

- Movimientos.

- Clasificaciones.

- Mermas.

- Ajustes.

## Ventas
- Por fecha.

- Por cliente.

- Por producto.

- Por vendedor.

## Clientes
- Estado de cuenta.

- Cartera vencida.

- Cartera general.

- Historial de pagos.

## Proveedores
- Estado de cuenta.

- Historial de pagos.

- Saldos pendientes.

## Caja
- Flujo de caja.

- Ingresos.

- Egresos.

- Cierre diario.

## Utilidad
- Utilidad por período.

- Utilidad por producto.

- Utilidad por cliente.

## Analítica
- Top clientes.

- Top productos.

- Ranking de ventas.

# 20. Impresión y PDFs
Todos los documentos se generarán como PDF descargable.

## Comprobante de Venta
Contenido mínimo:

| 1     `Número`2     `Fecha`3     `Cliente`4     `Productos`5     `Cantidades`6     `Precios`7     `Total`8     `Forma de Pago` |
| --- |
## Recibo de Abono
Contenido mínimo:

| 1     `Número`2     `Fecha`3     `Cliente`4     `Valor Abonado`5     `Saldo Anterior`6     `Saldo Actual` |
| --- |
## Comprobante de Pago a Proveedor
Contenido mínimo:

| 1     `Número`2     `Fecha`3     `Proveedor`4     `Valor Pagado`5     `Saldo Pendiente` |
| --- |
# 21. Auditoría
## Regla General
Los movimientos financieros no podrán eliminarse físicamente.

## Acciones Permitidas


| 1     `Anular`2     `Corregir`3     `Revertir`4      |
| --- |
## Registro Obligatorio
Toda modificación almacenará:

| 1     `Usuario`2     `Fecha`3     `Hora`4     `Acción`5     `Valor Anterior`6     `Valor Nuevo`7     `Motivo` |
| --- |
# 22. Requisitos No Funcionales
## RNF-01 Operación Offline
El sistema debe funcionar completamente sin conexión a Internet.

## RNF-02 Seguridad
- Inicio de sesión obligatorio.

- Roles y permisos.

- Contraseñas cifradas.

## RNF-03 Rendimiento
Transacciones comunes inferiores a 2 segundos.

## RNF-04 Respaldo
- Copias manuales.

- Copias automáticas.

- Recuperación ante fallos.

## RNF-05 Trazabilidad
Todos los movimientos deben ser auditables.

## RNF-06 Responsive
Compatible con:

- Escritorio.

- Tablet.

- Smartphone.

# 23. Modelo Conceptual


| 1     `Usuario`2     `├── id`3     `├── nombre`4     `├── rol`5     `└── estado`6     7     `Producto`8     `├── id`9     `├── nombre`10     `├── peso_bulto`11     `└── activo`12     13     `Cliente`14     `├── id`15     `├── nombre`16     `├── telefono`17     `├── nivel_riesgo`18     `└── saldo_actual`19     20     `Proveedor`21     `├── id`22     `├── nombre`23     `├── telefono`24     `└── saldo_actual`25     26     `Compra`27     `DetalleCompra`28     29     `Venta`30     `DetalleVenta`31     32     `AbonoCliente`33     34     `PagoProveedor`35     36     `Prestamo`37     38     `MovimientoInventario`39     40     `ClasificacionInventario`41     42     `Merma`43     44     `MovimientoCaja`45     46     `IngresoCaja`47     48     `EgresoCaja`49     50     `CierreCaja`51     52     `Auditoria` |
| --- |
# 24. Arquitectura Aprobada
## Estilo Arquitectónico


| 1     `Monolito Modular` |
| --- |
## Componentes


| 1     `Frontend Web Responsive`2     `            │`3     `            ▼`4     `API Monolítica`5     `            │`6     `            ▼`7     `Base de Datos Relacional` |
| --- |
## Módulos


| 1     `Autenticación`2     `Inventario`3     `Ventas`4     `Clientes`5     `Proveedores`6     `Caja`7     `Préstamos`8     `Reportes`9     `Auditoría`10     `Configuración` |
| --- |
# ADR-001
## Arquitectura Monolítica Modular
Estado: Aceptado
### Contexto
- Un punto de venta.

- Una bodega.

- Baja concurrencia.

- Operación local.
### Decisión
Implementar monolito modular.
### Revisar Cuando
- Existan múltiples sedes.

- Más de 10 usuarios concurrentes.

- Integración futura con SIGO.

# ADR-002
## Operación Local On-Premises (LAN Offline)
Estado: Aceptado
### Decisión
La aplicación operará en red local privada (LAN) dentro de la bodega/punto de venta. No requiere acceso a Internet para ninguna de sus funciones operativas, contables ni de reportes.

# ADR-003
## Costeo por Promedio Ponderado
Estado: Aceptado
### Decisión
Utilizar costo promedio ponderado para utilidad e inventario.

# ADR-004
## Inventario Basado en Bultos
Estado: Aceptado
### Decisión
Toda la operación utilizará bultos como unidad principal.
### Regla


| 1     `1 Bulto = 50 Kg` |
| --- |
Los kilogramos tendrán carácter informativo únicamente.

# ADR-005
## Sin Gestión de Lotes en Ventas
Estado: Aceptado
### Decisión
Mantener existencias acumuladas por producto para efectos de venta y kardex general.

# ADR-006
## Stack Tecnológico Dockerizado
Estado: Aceptado
### Decisión
Implementar el sistema mediante contenedores Docker orquestados con **Docker Compose**:
- **Backend:** Node.js (TypeScript) con Fastify / Express (Monolito modular).
- **Frontend:** React + Vite + TailwindCSS (Web Responsive para PC, Tablet y Móvil).
- **Base de Datos:** PostgreSQL 16 con volumen persistente local.
- **ORM:** Prisma / Drizzle ORM con migraciones automáticas.
- **PDFs:** Generación nativa en servidor (PDFKit) sin internet.

# Criterios Globales de Aceptación
✅ Registrar compras de contado y crédito.

✅ Registrar ventas de contado y crédito.

✅ Registrar ventas fraccionadas de bultos.

✅ Registrar pagos a proveedores.

✅ Registrar abonos de clientes.

✅ Gestionar cartera.

✅ Gestionar cuentas por pagar.

✅ Gestionar préstamos.

✅ Registrar ingresos y egresos.

✅ Registrar clasificación con pérdidas.

✅ Generar comprobantes PDF.

✅ Generar cierre diario.

✅ Calcular utilidad por promedio ponderado.

✅ Impedir inventario negativo.

✅ Mantener auditoría completa.

✅ Funcionar sin Internet.

# Backlog Inicial (MVP)
## Fase 1
- Usuarios.

- Roles.

- Productos.

- Clientes.

- Proveedores.
## Fase 2
- Compras.

- Inventario.

- Clasificación.

- Mermas.
## Fase 3
- Ventas contado.

- Ventas crédito.

- Abonos.
## Fase 4
- Caja.

- Gastos.

- Préstamos.

- Cierre diario.
## Fase 5
- Reportes.

- PDFs.

- Auditoría.

# Estado Final
**PapApp Spec.md v1.1 aprobado para pasar a diseño técnico detallado (modelo relacional, casos de uso formales, APIs, UX/UI y ADRs de tecnología).**

| 1      |
| --- |

