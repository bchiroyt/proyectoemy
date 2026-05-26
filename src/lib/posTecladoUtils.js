export function digitoDesdeTecla(e) {
  if (e.key.length === 1 && /^[0-9]$/.test(e.key)) return e.key;
  if (e.code && /^Numpad[0-9]$/.test(e.code)) return e.code.slice(6);
  return null;
}

export function esTeclaBorrar(e) {
  return e.key === "Backspace" || e.key === "Delete";
}

export function esTeclaEnter(e) {
  return e.key === "Enter" || e.key === "NumpadEnter";
}
