import { roundVenta } from "@/lib/ventaMappers";

/** Construye una línea de pago hacia el API */
export function crearLineaPago(metodo, montoRecibido, deudaRestante) {
  const montoAplicado = roundVenta(Math.min(montoRecibido, Math.max(0, deudaRestante)));
  const recibido = metodo.permiteCambio
    ? roundVenta(montoRecibido)
    : montoAplicado;
  const cambio = roundVenta(Math.max(0, recibido - montoAplicado));

  return {
    clave: metodo.clave,
    idMetodoPago: metodo.idMetodoPago,
    nombre: metodo.nombre,
    montoAplicado,
    montoRecibido: recibido,
    cambio,
  };
}

/** Vista en vivo: deuda, cambio y si el monto tecleado (+ pagos previos) cubre la venta */
export function calcularVistaCobro({ deudaTotal, pagos, metodo, montoDigitando }) {
  const totalAplicado = roundVenta(pagos.reduce((acc, p) => acc + p.montoAplicado, 0));
  const deudaRestante = roundVenta(Math.max(0, deudaTotal - totalAplicado));

  const cambioConfirmado = roundVenta(
    pagos.reduce((acc, p) => acc + Math.max(0, p.montoRecibido - p.montoAplicado), 0)
  );

  let aplicadoBorrador = 0;
  let cambioBorrador = 0;

  if (metodo && montoDigitando > 0 && deudaRestante > 0) {
    aplicadoBorrador = roundVenta(Math.min(montoDigitando, deudaRestante));
    cambioBorrador = metodo.permiteCambio
      ? roundVenta(Math.max(0, montoDigitando - aplicadoBorrador))
      : 0;
  } else if (metodo && montoDigitando > 0 && deudaRestante <= 0 && metodo.permiteCambio) {
    cambioBorrador = roundVenta(montoDigitando);
  }

  const deudaRestanteVista = roundVenta(
    Math.max(0, deudaTotal - totalAplicado - aplicadoBorrador)
  );
  const cambioVista = roundVenta(cambioConfirmado + cambioBorrador);
  const cubreDeuda = deudaRestanteVista <= 0.005;
  const excedeDeuda = montoDigitando > 0 && deudaRestanteVista <= 0.005;

  return {
    totalAplicado,
    deudaRestante,
    deudaRestanteVista,
    aplicadoBorrador,
    cambioVista,
    cambioConfirmado,
    cubreDeuda,
    excedeDeuda,
    falta: deudaRestanteVista,
  };
}

/** Pagos a enviar al API: confirmados + monto actual en pantalla */
export function construirPagosFinales(pagos, metodoActivo, montoDigitando, metodos, deudaTotal) {
  const lista = [...pagos];
  if (!metodoActivo || montoDigitando <= 0) return lista;

  const metodo = metodos.find((m) => m.clave === metodoActivo);
  if (!metodo) return lista;

  const aplicadoPrevio = roundVenta(lista.reduce((acc, p) => acc + p.montoAplicado, 0));
  const deudaRest = roundVenta(Math.max(0, deudaTotal - aplicadoPrevio));

  lista.push(crearLineaPago(metodo, montoDigitando, deudaRest));
  return lista;
}
