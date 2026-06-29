const ADMIN_KEYWORDS = ["admin", "administrador"];

const normalizarTexto = (valor) => String(valor ?? "").trim().toLowerCase();

const contieneAdmin = (valor) => {
  const texto = normalizarTexto(valor);
  return texto ? ADMIN_KEYWORDS.some((keyword) => texto.includes(keyword)) : false;
};

export function esUsuarioAdmin(usuario) {
  if (!usuario || typeof usuario !== "object") return false;

  if (
    contieneAdmin(usuario.nombreRol) ||
    contieneAdmin(usuario.nombreTipoUsuario) ||
    contieneAdmin(usuario.rolesEtiqueta)
  ) {
    return true;
  }

  if (!Array.isArray(usuario.roles)) return false;

  return usuario.roles.some(
    (rol) => contieneAdmin(rol?.nombre) || contieneAdmin(rol?.codigo)
  );
}
