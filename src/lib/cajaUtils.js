/** Inicializa cantidades en cero para cada denominación */
export function initCantidades(denominaciones = []) {
  return denominaciones.reduce(
    (acc, d) => ({ ...acc, [d.idDenominacion]: 0 }),
    {}
  );
}
