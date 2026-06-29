export function permKey(idModulo, idSubmodulo, idAccion) {
  return `${idModulo}|${idSubmodulo ?? "null"}|${idAccion}`;
}

export function permisosMapsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
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

/** Payload de permisos concedidos de un rol (solo los que tienen permitido: true). */
export function buildPermisosRolPayload(rows, localMap) {
  return rows
    .map((row) => ({
      idModulo: row.idModulo,
      idSubmodulo: row.idSubmodulo,
      idAccion: row.idAccion,
      permitido: Boolean(localMap.get(permKey(row.idModulo, row.idSubmodulo, row.idAccion))),
    }))
    .filter((p) => p.permitido);
}

/** Compara listas de permisos de rol sin importar el orden. */
export function permisosRolPayloadEqual(a, b) {
  const firma = (list) =>
    [...(list ?? [])]
      .map(
        (p) =>
          `${p.idModulo}:${p.idSubmodulo ?? "null"}:${p.idAccion}:${p.permitido ? 1 : 0}`
      )
      .sort()
      .join("|");
  return firma(a) === firma(b);
}

/**
 * Permisos excepcionales por usuario (API .NET: solo módulo + acción, sin submódulo).
 */
export function buildUsuarioExcepcionRows(modulos, acciones) {
  const rows = [];
  for (const m of modulos) {
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
  return rows;
}

export function permisosMapFromUsuarioExcepciones(list) {
  const m = new Map();
  for (const p of list) {
    m.set(permKey(p.idModulo, null, p.idAccion), Boolean(p.permitido));
  }
  return m;
}

/**
 * Une permisos de uno o más roles a nivel módulo×acción.
 * Si el rol tiene permiso en cualquier submódulo, cuenta como permitido en el módulo.
 */
export function permisosMapFromRoles(rolPermisosLists) {
  const m = new Map();
  const lists = Array.isArray(rolPermisosLists) ? rolPermisosLists : [];

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      if (!p?.permitido) continue;
      const key = permKey(p.idModulo, null, p.idAccion);
      m.set(key, true);
    }
  }

  return m;
}

/**
 * Solo envía excepciones que difieren del permiso efectivo del rol (evita negar todo el rol al guardar).
 */
export function buildPermisosExcepcionalesPayload(rows, localMap, rolBaseMap) {
  const payload = [];

  for (const row of rows) {
    const key = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
    const deseado = Boolean(localMap.get(key));
    const desdeRol = Boolean(rolBaseMap.get(key));

    if (deseado !== desdeRol) {
      payload.push({
        idModulo: row.idModulo,
        idAccion: row.idAccion,
        permitido: deseado,
      });
    }
  }

  return payload;
}

/** Compara listas de excepciones (idModulo, idAccion, permitido) sin importar el orden. */
export function permisosExcepcionalesPayloadEqual(a, b) {
  const firma = (list) =>
    [...(list ?? [])]
      .map((p) => `${p.idModulo}:${p.idAccion}:${p.permitido ? 1 : 0}`)
      .sort()
      .join("|");
  return firma(a) === firma(b);
}

/** Claves explícitas guardadas en usuario_permiso_accion (no heredadas del rol). */
export function excepcionKeysFromUsuario(list) {
  const keys = new Set();
  for (const p of list ?? []) {
    keys.add(permKey(p.idModulo, null, p.idAccion));
  }
  return keys;
}
