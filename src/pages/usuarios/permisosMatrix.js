export function permKey(idModulo, idSubmodulo, idAccion) {
  return `${idModulo}|${idSubmodulo ?? "null"}|${idAccion}`;
}

export function sortAcciones(acciones) {
  const order = { CREATE: 0, READ: 1, UPDATE: 2, DELETE: 3 };
  return [...acciones].sort(
    (a, b) => (order[a.codigo?.toUpperCase?.()] ?? 99) - (order[b.codigo?.toUpperCase?.()] ?? 99)
  );
}

/**
 * Filas para UI + payload: combina módulos, submódulos (si existen) y acciones.
 */
export function buildPermisoRows(modulos, acciones) {
  const rows = [];
  for (const m of modulos) {
    if (m.submodulos?.length) {
      for (const s of m.submodulos) {
        for (const a of acciones) {
          rows.push({
            idModulo: m.idModulo,
            idSubmodulo: s.idSubmodulo,
            idAccion: a.idAccion,
            etiquetaModulo: m.nombre,
            etiquetaSub: s.nombre,
            etiquetaAccion: a.nombre,
            codigoAccion: a.codigo,
          });
        }
      }
    } else {
      for (const a of acciones) {
        rows.push({
          idModulo: m.idModulo,
          idSubmodulo: null,
          idAccion: a.idAccion,
          etiquetaModulo: m.nombre,
          etiquetaSub: null,
          etiquetaAccion: a.nombre,
          codigoAccion: a.codigo,
        });
      }
    }
  }
  return rows;
}

export function permisosMapFromServer(list) {
  const m = new Map();
  for (const p of list) {
    m.set(permKey(p.idModulo, p.idSubmodulo, p.idAccion), Boolean(p.permitido));
  }
  return m;
}
