/** Usuario reservado del backend; no se muestra en listados del frontend. */
export const ID_USUARIO_SISTEMA = 1;

export function esUsuarioVisibleEnFrontend(usuario) {
  const id = Number(usuario?.idUsuario ?? usuario?.IdUsuario);
  return id !== ID_USUARIO_SISTEMA;
}

export function filtrarUsuariosVisibles(usuarios) {
  return (usuarios ?? []).filter(esUsuarioVisibleEnFrontend);
}
