/**
 * Impresión del ticket vía diálogo del navegador (Epson TM-T20IV u otra térmica 80 mm).
 * El logo guardado en Epson TM Utility (memoria NV) solo se usa con ESC/POS directo, no aquí.
 */

function esperarImagenesTicket() {
  const imgs = document.querySelectorAll(".ticket-print-area img");
  if (!imgs.length) return Promise.resolve();

  return Promise.all(
    [...imgs].map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const fin = () => resolve();
          img.addEventListener("load", fin, { once: true });
          img.addEventListener("error", fin, { once: true });
          window.setTimeout(fin, 800);
        })
    )
  );
}

/**
 * Abre el diálogo de impresión tras precargar el logo y marcar el documento para térmica.
 */
export async function imprimirTicket() {
  await esperarImagenesTicket();
  document.documentElement.classList.add("printing-ticket");
  const quitarClase = () => {
    document.documentElement.classList.remove("printing-ticket");
    window.removeEventListener("afterprint", quitarClase);
  };
  window.addEventListener("afterprint", quitarClase);
  window.print();
}
