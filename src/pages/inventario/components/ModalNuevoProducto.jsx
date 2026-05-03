import { useState, useEffect } from "react";
import { X, ArrowLeft, Plus } from "lucide-react";
import ModalNuevaMarca from "./ModalNuevaMarca";
import ModalAgregarSimple from "./ModalAgregarSimple";
import { obtenerMarcas } from "@/services/marcas";

const ModalNuevoProducto = ({ open, onClose }) => {
  const [step, setStep] = useState(1);

  // 🔥 MARCAS (BACKEND)
  const [marcas, setMarcas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [openMarcaModal, setOpenMarcaModal] = useState(false);

  // STEP 2
  const [presentaciones, setPresentaciones] = useState([]);
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState("");

  const [tallas, setTallas] = useState([]);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");

  const [colores, setColores] = useState([]);
  const [colorSeleccionado, setColorSeleccionado] = useState("");

  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");

  // MODALES
  const [openPresentacionModal, setOpenPresentacionModal] = useState(false);
  const [openTallaModal, setOpenTallaModal] = useState(false);
  const [openColorModal, setOpenColorModal] = useState(false);
  const [openUbicacionModal, setOpenUbicacionModal] = useState(false);

  // 🔥 CARGAR MARCAS DESDE BACKEND
  useEffect(() => {
    const fetchMarcas = async () => {
      try {
        const res = await obtenerMarcas();
        setMarcas(res.data?.items || []);
      } catch (error) {
        console.error(error);
      }
    };

    if (open) fetchMarcas();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-lg p-6 border-t-4 border-(--color-pagina)">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          {step === 2 ? (
            <button onClick={() => setStep(1)}>
              <ArrowLeft />
            </button>
          ) : <div />}

          <h2 className="text-lg font-semibold">Nuevo Producto</h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* STEPS */}
        <div className="flex justify-center gap-4 mb-6">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${step === 1 ? "bg-(--color-pagina) text-white" : "bg-gray-200"}`}>1</div>
          <div className="w-16 h-1 bg-gray-200 rounded">
            <div className={`h-1 ${step === 2 ? "bg-(--color-pagina) w-full" : "bg-(--color-pagina) w-1/2"}`} />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${step === 2 ? "bg-(--color-pagina) text-white" : "bg-gray-200"}`}>2</div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">

            <h3 className="font-semibold">Información General</h3>

            <select className="w-full p-3 border rounded-lg">
              <option>Seleccionar categoría</option>
            </select>

            {/* 🔥 MARCAS DINÁMICAS */}
            <div className="flex gap-2">
              <select
                value={marcaSeleccionada}
                onChange={(e) => setMarcaSeleccionada(e.target.value)}
                className="flex-1 p-3 border rounded-lg"
              >
                <option value="">Seleccionar marca</option>

                {marcas.map((m) => (
                  <option key={m.idMarca} value={m.idMarca}>
                    {m.nombre}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOpenMarcaModal(true)}
                className="px-3 bg-(--color-pagina-2) text-white rounded-lg"
              >
                <Plus />
              </button>
            </div>

            <input placeholder="Nombre del producto" className="w-full border p-3 rounded-lg" />
            <textarea placeholder="Descripción" className="w-full border p-3 rounded-lg" />

            <button
              onClick={() => setStep(2)}
              className="w-full bg-(--color-pagina) text-white py-3 rounded-xl"
            >
              Siguiente paso →
            </button>

          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">

            <h3 className="font-semibold">Detalles y Variantes</h3>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="border p-3 rounded-lg" />
                <input placeholder="SKU Base" className="border p-3 rounded-lg" />
              </div>

              <div className="flex gap-2">
                <select
                  value={presentacionSeleccionada}
                  onChange={(e) => setPresentacionSeleccionada(e.target.value)}
                  className="flex-1 p-3 border rounded-lg"
                >
                  <option value="">Presentación</option>
                  {presentaciones.map((p, i) => (
                    <option key={i}>{p}</option>
                  ))}
                </select>

                <button
                  onClick={() => setOpenPresentacionModal(true)}
                  className="px-3 bg-(--color-pagina-2) text-white rounded-lg"
                >
                  +
                </button>
              </div>

            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-4">

              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Costo" className="border p-3 rounded-lg" />
                <input placeholder="Precio Venta" className="border p-3 rounded-lg" />
                <input placeholder="Código de barras" className="border p-3 rounded-lg" />
              </div>

              <div className="grid grid-cols-4 gap-4">

                <input placeholder="Stock inicial" className="border p-3 rounded-lg" />

                {/* TALLA */}
                <div className="flex gap-2">
                  <select value={tallaSeleccionada} onChange={(e) => setTallaSeleccionada(e.target.value)} className="flex-1 border p-3 rounded-lg">
                    <option value="">Talla</option>
                    {tallas.map((t, i) => <option key={i}>{t}</option>)}
                  </select>
                  <button onClick={() => setOpenTallaModal(true)} className="px-2 bg-(--color-pagina-2) text-white rounded">+</button>
                </div>

                {/* COLOR */}
                <div className="flex gap-2">
                  <select value={colorSeleccionado} onChange={(e) => setColorSeleccionado(e.target.value)} className="flex-1 border p-3 rounded-lg">
                    <option value="">Color</option>
                    {colores.map((c, i) => <option key={i}>{c}</option>)}
                  </select>
                  <button onClick={() => setOpenColorModal(true)} className="px-2 bg-(--color-pagina-2) text-white rounded">+</button>
                </div>

                {/* UBICACIÓN */}
                <div className="flex gap-2">
                  <select value={ubicacionSeleccionada} onChange={(e) => setUbicacionSeleccionada(e.target.value)} className="flex-1 border p-3 rounded-lg">
                    <option value="">Ubicación</option>
                    {ubicaciones.map((u, i) => <option key={i}>{u}</option>)}
                  </select>
                  <button onClick={() => setOpenUbicacionModal(true)} className="px-2 bg-(--color-pagina-2) text-white rounded">+</button>
                </div>

              </div>

            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="border px-6 py-2 rounded-xl">
                ← Anterior
              </button>

              <button className="bg-(--color-pagina-2) text-white px-6 py-3 rounded-xl">
                Registrar
              </button>
            </div>

          </div>
        )}

      </div>

      {/* 🔥 MODAL MARCA CON BACKEND */}
      <ModalNuevaMarca
        open={openMarcaModal}
        onClose={() => setOpenMarcaModal(false)}
        onSave={(nuevaMarca) => {
          setMarcas([...marcas, nuevaMarca]);
          setMarcaSeleccionada(nuevaMarca.idMarca);
        }}
      />

      {/* DEMÁS MODALES */}
      <ModalAgregarSimple
        open={openPresentacionModal}
        onClose={() => setOpenPresentacionModal(false)}
        titulo="Nueva Presentación"
        placeholder="Ej: Caja"
        onSave={(v) => {
          setPresentaciones([...presentaciones, v]);
          setPresentacionSeleccionada(v);
        }}
      />

      <ModalAgregarSimple
        open={openTallaModal}
        onClose={() => setOpenTallaModal(false)}
        titulo="Nueva Talla"
        placeholder="Ej: M"
        onSave={(v) => {
          setTallas([...tallas, v]);
          setTallaSeleccionada(v);
        }}
      />

      <ModalAgregarSimple
        open={openColorModal}
        onClose={() => setOpenColorModal(false)}
        titulo="Nuevo Color"
        placeholder="Ej: Rojo"
        onSave={(v) => {
          setColores([...colores, v]);
          setColorSeleccionado(v);
        }}
      />

      <ModalAgregarSimple
        open={openUbicacionModal}
        onClose={() => setOpenUbicacionModal(false)}
        titulo="Nueva Ubicación"
        placeholder="Ej: Estante 1"
        onSave={(v) => {
          setUbicaciones([...ubicaciones, v]);
          setUbicacionSeleccionada(v);
        }}
      />

    </div>
  );
};

export default ModalNuevoProducto;