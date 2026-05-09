import { useState, useEffect } from "react";
import { X, ArrowLeft, Plus } from "lucide-react";

import ModalNuevaMarca from "./ModalNuevaMarca";
import ModalAgregarSimple from "./ModalAgregarSimple";

import { obtenerMarcas } from "@/services/marcas";
import { obtenerCategorias } from "@/services/categorias";
import { obtenerPresentaciones } from "@/services/presentaciones";
import { obtenerTallas } from "@/services/tallas";
import { obtenerUbicaciones } from "@/services/ubicaciones";

import { crearProducto } from "@/services/productos";

const ModalNuevoProducto = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);

  // DATOS GENERALES
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // CATEGORÍAS
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");

  // MARCAS
  const [marcas, setMarcas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [openMarcaModal, setOpenMarcaModal] = useState(false);

  // PRESENTACIONES
  const [presentaciones, setPresentaciones] = useState([]);
  const [presentacionSeleccionada, setPresentacionSeleccionada] = useState("");
  const [openPresentacionModal, setOpenPresentacionModal] = useState(false);

  // TALLAS
  const [tallas, setTallas] = useState([]);
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [openTallaModal, setOpenTallaModal] = useState(false);

  // COLOR MANUAL
  const [color, setColor] = useState("");

  // UBICACIONES
  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("");
  const [openUbicacionModal, setOpenUbicacionModal] = useState(false);

  // VARIANTE
  const [precioVenta, setPrecioVenta] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");

  // CARGAR DATOS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          marcasData,
          categoriasData,
          presentacionesData,
          tallasData,
          ubicacionesData,
        ] = await Promise.all([
          obtenerMarcas({
            Activo: true,
            Page: 1,
            PageSize: 100,
          }),

          obtenerCategorias({
            Activo: true,
            Page: 1,
            PageSize: 100,
          }),

          obtenerPresentaciones({
            Activo: true,
            Page: 1,
            PageSize: 100,
          }),

          obtenerTallas({
            Activo: true,
            Page: 1,
            PageSize: 100,
          }),

          obtenerUbicaciones({
            Activo: true,
            Page: 1,
            PageSize: 100,
          }),
        ]);

        setMarcas(marcasData.items || []);
        setCategorias(categoriasData.items || []);
        setPresentaciones(presentacionesData.items || []);
        setTallas(tallasData.items || []);
        setUbicaciones(ubicacionesData.items || []);
      } catch (error) {
        console.error(error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // RESET
  const resetForm = () => {
    setStep(1);

    setNombre("");
    setDescripcion("");

    setCategoriaSeleccionada("");
    setMarcaSeleccionada("");

    setPresentacionSeleccionada("");
    setTallaSeleccionada("");

    setColor("");

    setUbicacionSeleccionada("");

    setPrecioVenta("");
    setCodigoBarras("");
  };

  // CERRAR
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // REGISTRAR
  const handleRegistrar = async () => {
    try {
      if (!nombre.trim()) {
        alert("Debes ingresar un nombre.");
        return;
      }

      if (!categoriaSeleccionada) {
        alert("Debes seleccionar una categoría.");
        return;
      }

      if (!marcaSeleccionada) {
        alert("Debes seleccionar una marca.");
        return;
      }

      if (
        !tallaSeleccionada &&
        !presentacionSeleccionada &&
        !color.trim()
      ) {
        alert(
          "Debes ingresar al menos talla, presentación o color."
        );
        return;
      }

      setLoading(true);

      const payload = {
        nombre,
        descripcion,
        categoria: Number(categoriaSeleccionada),
        marca: Number(marcaSeleccionada),
        estadoCatalogo: "BORRADOR",

        variantes: [
          {
            talla: tallaSeleccionada
              ? Number(tallaSeleccionada)
              : null,

            presentacion: presentacionSeleccionada
              ? Number(presentacionSeleccionada)
              : null,

            color: color || null,

            precioVenta: precioVenta
              ? Number(precioVenta)
              : null,

            codigosExternos: codigoBarras
              ? [
                  {
                    codigo: codigoBarras,
                    esPrincipal: true,
                  },
                ]
              : [],
          },
        ],
      };

      await crearProducto(payload);

      alert("Producto creado correctamente.");

      if (onSuccess) {
        onSuccess();
      }

      handleClose();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.mensaje ||
          "Error al crear producto."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-lg p-6 border-t-4 border-(--color-pagina)">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          {step === 2 ? (
            <button onClick={() => setStep(1)}>
              <ArrowLeft />
            </button>
          ) : (
            <div />
          )}

          <h2 className="text-lg font-semibold">
            Nuevo Producto
          </h2>

          <button onClick={handleClose}>
            <X />
          </button>
        </div>

        {/* STEPS */}
        <div className="flex justify-center gap-4 mb-6">
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              step === 1
                ? "bg-(--color-pagina) text-white"
                : "bg-gray-200"
            }`}
          >
            1
          </div>

          <div className="w-16 h-1 bg-gray-200 rounded">
            <div
              className={`h-1 ${
                step === 2
                  ? "bg-(--color-pagina) w-full"
                  : "bg-(--color-pagina) w-1/2"
              }`}
            />
          </div>

          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              step === 2
                ? "bg-(--color-pagina) text-white"
                : "bg-gray-200"
            }`}
          >
            2
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold">
              Información General
            </h3>

            {/* CATEGORÍA */}
            <select
              value={categoriaSeleccionada}
              onChange={(e) =>
                setCategoriaSeleccionada(e.target.value)
              }
              className="w-full p-3 border rounded-lg"
            >
              <option value="">
                Seleccionar categoría
              </option>

              {categorias.map((c) => (
                <option
                  key={c.idCategoria}
                  value={c.idCategoria}
                >
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* MARCAS */}
            <div className="flex gap-2">
              <select
                value={marcaSeleccionada}
                onChange={(e) =>
                  setMarcaSeleccionada(e.target.value)
                }
                className="flex-1 p-3 border rounded-lg"
              >
                <option value="">
                  Seleccionar marca
                </option>

                {marcas.map((m) => (
                  <option
                    key={m.idMarca}
                    value={m.idMarca}
                  >
                    {m.nombre}
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  setOpenMarcaModal(true)
                }
                className="px-3 bg-(--color-pagina-2) text-white rounded-lg"
              >
                <Plus />
              </button>
            </div>

            {/* NOMBRE */}
            <input
              value={nombre}
              onChange={(e) =>
                setNombre(e.target.value)
              }
              placeholder="Nombre del producto"
              className="w-full border p-3 rounded-lg"
            />

            {/* DESCRIPCIÓN */}
            <textarea
              value={descripcion}
              onChange={(e) =>
                setDescripcion(e.target.value)
              }
              placeholder="Descripción"
              className="w-full border p-3 rounded-lg"
            />

            <button
              onClick={() => setStep(2)}
              className="w-full bg-(--color-pagina) text-white py-3 rounded-xl"
            >
              Siguiente paso
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-semibold">
              Detalles y Variantes
            </h3>

            {/* PRESENTACIÓN */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <div className="flex gap-2">
                <select
                  value={presentacionSeleccionada}
                  onChange={(e) =>
                    setPresentacionSeleccionada(
                      e.target.value
                    )
                  }
                  className="flex-1 p-3 border rounded-lg"
                >
                  <option value="">
                    Presentación
                  </option>

                  {presentaciones.map((p) => (
                    <option
                      key={p.idPresentacion}
                      value={p.idPresentacion}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    setOpenPresentacionModal(true)
                  }
                  className="px-3 bg-(--color-pagina-2) text-white rounded-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* VARIANTE */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={precioVenta}
                  onChange={(e) =>
                    setPrecioVenta(e.target.value)
                  }
                  placeholder="Precio Venta"
                  className="border p-3 rounded-lg"
                />

                <input
                  value={codigoBarras}
                  onChange={(e) =>
                    setCodigoBarras(e.target.value)
                  }
                  placeholder="Código de barras"
                  className="border p-3 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* TALLA */}
                <div className="flex gap-2">
                  <select
                    value={tallaSeleccionada}
                    onChange={(e) =>
                      setTallaSeleccionada(
                        e.target.value
                      )
                    }
                    className="flex-1 border p-3 rounded-lg"
                  >
                    <option value="">
                      Talla
                    </option>

                    {tallas.map((t) => (
                      <option
                        key={t.idTalla}
                        value={t.idTalla}
                      >
                        {t.nombre}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      setOpenTallaModal(true)
                    }
                    className="px-2 bg-(--color-pagina-2) text-white rounded"
                  >
                    +
                  </button>
                </div>

                {/* COLOR MANUAL */}
                <input
                  value={color}
                  onChange={(e) =>
                    setColor(e.target.value)
                  }
                  placeholder="Color"
                  className="border p-3 rounded-lg"
                />

                {/* UBICACIÓN */}
                <div className="flex gap-2">
                  <select
                    value={ubicacionSeleccionada}
                    onChange={(e) =>
                      setUbicacionSeleccionada(
                        e.target.value
                      )
                    }
                    className="flex-1 border p-3 rounded-lg"
                  >
                    <option value="">
                      Ubicación
                    </option>

                    {ubicaciones.map((u) => (
                      <option
                        key={u.idUbicacion}
                        value={u.idUbicacion}
                      >
                        {u.nombre}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      setOpenUbicacionModal(true)
                    }
                    className="px-2 bg-(--color-pagina-2) text-white rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="border px-6 py-2 rounded-xl"
              >
                Anterior
              </button>

              <button
                onClick={handleRegistrar}
                disabled={loading}
                className="bg-(--color-pagina-2) text-white px-6 py-3 rounded-xl disabled:opacity-50"
              >
                {loading
                  ? "Registrando..."
                  : "Registrar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MARCA */}
      <ModalNuevaMarca
        open={openMarcaModal}
        onClose={() =>
          setOpenMarcaModal(false)
        }
        onSave={(nuevaMarca) => {
          setMarcas((prev) => [
            ...prev,
            nuevaMarca,
          ]);

          setMarcaSeleccionada(
            nuevaMarca.idMarca
          );
        }}
      />

      {/* MODAL PRESENTACIÓN */}
      <ModalAgregarSimple
        open={openPresentacionModal}
        onClose={() =>
          setOpenPresentacionModal(false)
        }
        titulo="Nueva Presentación"
        placeholder="Ej: Caja"
        onSave={(v) => {
          setPresentaciones((prev) => [
            ...prev,
            v,
          ]);

          setPresentacionSeleccionada(
            v.idPresentacion
          );
        }}
      />

      {/* MODAL TALLA */}
      <ModalAgregarSimple
        open={openTallaModal}
        onClose={() =>
          setOpenTallaModal(false)
        }
        titulo="Nueva Talla"
        placeholder="Ej: M"
        onSave={(v) => {
          setTallas((prev) => [...prev, v]);

          setTallaSeleccionada(v.idTalla);
        }}
      />

      {/* MODAL UBICACIÓN */}
      <ModalAgregarSimple
        open={openUbicacionModal}
        onClose={() =>
          setOpenUbicacionModal(false)
        }
        titulo="Nueva Ubicación"
        placeholder="Ej: Estante 1"
        onSave={(v) => {
          setUbicaciones((prev) => [
            ...prev,
            v,
          ]);

          setUbicacionSeleccionada(
            v.idUbicacion
          );
        }}
      />
    </div>
  );
};

export default ModalNuevoProducto;