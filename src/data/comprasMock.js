/** Datos de demostración para el módulo de compras */
export const COMPRAS_MOCK = [
  {
    id: "CMP-00000001",
    no: 1,
    fechaPedido: "2025-03-05",
    fechaRecepcion: "2025-03-10",
    proveedor: { nombre: "Distribuidora Amelisa", iniciales: "DA" },
    comprobante: "#00000001",
    total: 3000,
    estado: "Recibido",
    tipoComprobante: "Factura Electrónica",
    notasProveedor:
      "Entrega realizada en bodega central. Productos verificados contra inventario.",
    items: [
      {
        descripcion: "Falda de Lona",
        color: "Azul",
        talla: "M",
        sku: "VF-001-AZ-M",
        codigoBarras: "7400123456789",
        cantidad: 10,
        precioUnitario: 150,
      },
      {
        descripcion: "Blusa de Seda Elegante",
        color: "Blanco",
        talla: "S",
        sku: "VF-002-BL-S",
        codigoBarras: "7400123456790",
        cantidad: 10,
        precioUnitario: 150,
      },
    ],
  },
  {
    id: "CMP-00000002",
    no: 2,
    fechaPedido: "2025-03-12",
    fechaRecepcion: null,
    proveedor: { nombre: "Textiles del Norte", iniciales: "TN" },
    comprobante: "#00000002",
    total: 2150,
    estado: "En Proceso",
    tipoComprobante: "Factura Electrónica",
    notasProveedor: "",
    items: [],
  },
];

export const CATALOGO_COMPRA_MOCK = [
  {
    id: "p1",
    nombre: "Falda de Lona",
    detalle: "Azul · M",
    sku: "VF-001-AZ-M",
    costo: 150,
  },
  {
    id: "p2",
    nombre: "Blusa de Seda Elegante",
    detalle: "Blanco · S",
    sku: "VF-002-BL-S",
    costo: 215,
  },
  {
    id: "p3",
    nombre: "Chaqueta Ligera",
    detalle: "Negro · L",
    sku: "VF-003-NG-L",
    costo: 189.5,
  },
];
