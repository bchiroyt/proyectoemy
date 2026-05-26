import { useState, useEffect } from "react";
import { X, ArrowLeft, Plus, Trash2, Search, CheckCircle, AlertCircle } from "lucide-react";

import ModalNuevaMarca from "./ModalNuevaMarca";
import ModalCategoria from "./ModalCategoria"; 
import ModalAgregarSimple from "./ModalAgregarSimple";

import { obtenerMarcas } from "@/services/marcas";
// IMPORTAMOS crearCategoria PARA SOLUCIONAR EL GUARDADO EN BD
import { obtenerCategorias, crearCategoria } from "@/services/categorias";
import { obtenerPresentaciones } from "@/services/presentaciones";
import { obtenerTallas } from "@/services/tallas";
import { obtenerUbicaciones } from "@/services/ubicaciones";

import { crearProducto } from "@/services/productos";

const ModalNuevoProducto = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ESTADO PARA AVISOS/NOTIFICACIONES PERSONALIZADAS
  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  // DATOS GENERALES
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");

  // ESTADOS PARA LOS BUSCADORES DE STEP 1
  const [busquedaCat, setBusquedaCat] = useState("");
  const [openCatDropdown, setOpenCatDropdown] = useState(false);
  const [busquedaMarca, setBusquedaMarca] = useState("");
  const [openMarcaDropdown, setOpenMarcaDropdown] = useState(false);

  // LISTAS DE LA BASE DE DATOS
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  // ARRAY DINÁMICO DE VARIANTES
  const [variantes, setVariantes] = useState([
    {
      talla: "",
      busquedaTalla: "",
      openTallaDropdown: false,
      
      presentacion: "",
      busquedaPres: "",
      openPresDropdown: false,
      
      color: "",
      precioVenta: "",
      codigoBarras: "",
      
      ubicacion: "",
      busquedaUbic: "",
      openUbicDropdown: false,
    },
  ]);

  // MODALES AUXILIARES
  const [openMarcaModal, setOpenMarcaModal] = useState(false);
  const [openCategoriaModal, setOpenCategoriaModal] = useState(false);
  const [openPresentacionModal, setOpenPresentacionModal] = useState(false);
  const [openTallaModal, setOpenTallaModal] = useState(false);
  const [openUbicacionModal, setOpenUbicacionModal] = useState(false);

  // FUNCIÓN PARA MOSTRAR AVISOS
  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

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
          obtenerMarcas({ Activo: true, Page: 1, PageSize: 500 }),
          obtenerCategorias({ Activo: true, Page: 1, PageSize: 500 }),
          obtenerPresentaciones({ Activo: true, Page: 1, PageSize: 500 }),
          obtenerTallas({ Activo: true, Page: 1, PageSize: 500 }),
          obtenerUbicaciones({ Activo: true, Page: 1, PageSize: 500 }),
        ]);

        setMarcas(marcasData?.items || []);
        setCategorias(categoriasData?.items || []);
        setPresentaciones(presentacionesData?.items || []);
        setTallas(tallasData?.items || []);
        setUbicaciones(ubicacionesData?.items || []);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // MANEJO DE VARIANTES DINÁMICAS
  const handleAgregarVariante = () => {
    setVariantes([
      ...variantes,
      {
        talla: "",
        busquedaTalla: "",
        openTallaDropdown: false,
        presentacion: "",
        busquedaPres: "",
        openPresDropdown: false,
        color: "",
        precioVenta: "",
        codigoBarras: "",
        ubicacion: "",
        busquedaUbic: "",
        openUbicDropdown: false,
      },
    ]);
  };

  const handleEliminarVariante = (index) => {
    if (variantes.length > 1) {
      setVariantes(variantes.filter((_, i) => i !== index));
    }
  };

  const handleCambioVariante = (index, campo, valor) => {
    const nuevasVariantes = [...variantes];
    nuevasVariantes[index][campo] = valor;
    setVariantes(nuevasVariantes);
  };

  // RESET
  const resetForm = () => {
    setStep(1);
    setNombre("");
    setDescripcion("");
    setCategoriaSeleccionada("");
    setMarcaSeleccionada("");
    setBusquedaCat("");
    setBusquedaMarca("");
    setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
    setVariantes([
      {
        talla: "",
        busquedaTalla: "",
        openTallaDropdown: false,
        presentacion: "",
        busquedaPres: "",
        openPresDropdown: false,
        color: "",
        precioVenta: "",
        codigoBarras: "",
        ubicacion: "",
        busquedaUbic: "",
        openUbicDropdown: false,
      },
    ]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // REGISTRAR PRODUCTO FINAL
  const handleRegistrar = async () => {
    try {
      if (!nombre.trim()) return mostrarAviso("error", "Debes ingresar un nombre para el producto.");
      if (!categoriaSeleccionada) return mostrarAviso("error", "Debes seleccionar una categoría.");
      if (!marcaSeleccionada) return mostrarAviso("error", "Debes seleccionar una marca.");

      for (let i = 0; i < variantes.length; i++) {
        const v = variantes[i];
        if (!v.talla && !v.presentacion && !v.color.trim()) {
          return mostrarAviso("error", ` En la variante #${i + 1}, debes ingresar al menos talla, presentación o color.`);
        }
      }

      setLoading(true);

      const payload = {
        nombre,
        descripcion,
        categoria: Number(categoriaSeleccionada),
        marca: Number(marcaSeleccionada),
        estadoCatalogo: "BORRADOR",
        variantes: variantes.map((v) => ({
          talla: v.talla ? Number(v.talla) : null,
          presentacion: v.presentacion ? Number(v.presentacion) : null,
          color: v.color || null,
          precioVenta: v.precioVenta ? Number(v.precioVenta) : null,
          codigosExternos: v.codigoBarras
            ? [
                {
                  codigo: v.codigoBarras,
                  esPrincipal: true,
                },
              ]
            : [],
        })),
      };

      await crearProducto(payload);
      
      mostrarAviso("exito", "¡Producto creado correctamente en el catálogo!");
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
      setTimeout(() => handleClose(), 1500);

    } catch (error) {
      console.error(error);
      const msgError = error?.response?.data?.mensaje || "Error interno al intentar crear el producto.";
      mostrarAviso("error", msgError);
    } finally {
      setLoading(false);
    }
  };

  // FILTRADOS STEP 1
  const categoriasFiltradas = (categorias || []).filter((c) =>
    c?.nombre?.toLowerCase().includes((busquedaCat || "").toLowerCase())
  );

  const marcasFiltradas = (marcas || []).filter((m) =>
    m?.nombre?.toLowerCase().includes((busquedaMarca || "").toLowerCase())
  );

  const nombreCategoriaActual = (categorias || []).find((c) => String(c?.idCategoria) === String(categoriaSeleccionada))?.nombre || "Seleccionar categoría";
  const nombreMarcaActual = (marcas || []).find((m) => String(m?.idMarca) === String(marcaSeleccionada))?.nombre || "Seleccionar marca";

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">
        
        {/* TOAST INTERNO */}
        {notificacion.mostrar && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all max-w-md w-11/12 animate-bounce ${
            notificacion.tipo === "exito" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {notificacion.tipo === "exito" ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span className="flex-1">{notificacion.mensaje}</span>
            <button onClick={() => setNotificacion({ mostrar: false, tipo: "", mensaje: "" })} className="text-gray-400 hover:text-gray-600 ml-2 p-0.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 cursor-pointer">
              <ArrowLeft />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <h2 className="text-lg font-semibold text-gray-800">Nuevo Producto</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800 cursor-pointer">
            <X />
          </button>
        </div>

        {/* STEPS */}
        <div className="flex justify-center gap-4 py-4 bg-gray-50 border-b">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step === 1 ? "bg-(--color-pagina) text-white" : "bg-gray-200 text-gray-600"}`}>1</div>
          <div className="w-16 h-1 bg-gray-200 self-center rounded">
            <div className={`h-1 transition-all duration-300 ${step === 2 ? "bg-(--color-pagina) w-full" : "bg-(--color-pagina) w-1/2"}`} />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step === 2 ? "bg-(--color-pagina) text-white" : "bg-gray-200 text-gray-600"}`}>2</div>
        </div>

        {/* CONTENIDO */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: GENERAL */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-gray-700">Información General</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Nombre del Producto</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Escribe el nombre del producto"
                  className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                />
              </div>

              {/* BUSCADOR CATEGORÍA */}
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-gray-600 block">Categoría</label>
                <div className="flex gap-2">
                  <div
                    onClick={() => setOpenCatDropdown(!openCatDropdown)}
                    className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    <span>{nombreCategoriaActual}</span>
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCategoriaModal(true)}
                    className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {openCatDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar categoría..."
                      value={busquedaCat}
                      onChange={(e) => setBusquedaCat(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:border-gray-400"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {categoriasFiltradas.map((c) => (
                        <div
                          key={c?.idCategoria}
                          onClick={() => {
                            setCategoriaSeleccionada(c?.idCategoria);
                            setOpenCatDropdown(false);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700 transition-colors"
                        >
                          {c?.nombre}
                        </div>
                      ))}
                      {categoriasFiltradas.length === 0 && (
                        <div className="p-2 text-xs text-gray-400 text-center cursor-default">No se encontraron resultados</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* BUSCADOR MARCA */}
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-gray-600 block">Marca</label>
                <div className="flex gap-2">
                  <div
                    onClick={() => setOpenMarcaDropdown(!openMarcaDropdown)}
                    className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    <span>{nombreMarcaActual}</span>
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenMarcaModal(true)}
                    className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {openMarcaDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar marca..."
                      value={busquedaMarca}
                      onChange={(e) => setBusquedaMarca(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm outline-none focus:border-gray-400"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {marcasFiltradas.map((m) => (
                        <div
                          key={m?.idMarca}
                          onClick={() => {
                            setMarcaSeleccionada(m?.idMarca);
                            setOpenMarcaDropdown(false);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700 transition-colors"
                        >
                          {m?.nombre}
                        </div>
                      ))}
                      {marcasFiltradas.length === 0 && (
                        <div className="p-2 text-xs text-gray-400 text-center cursor-default">No se encontraron resultados</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre el producto"
                  className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors min-h-[80px]"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-(--color-pagina) text-white py-3 rounded-xl font-medium tracking-wide mt-4 hover:brightness-95 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
              >
                Siguiente paso
              </button>
            </div>
          )}

          {/* STEP 2: MULTI-VARIANTES */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-semibold text-gray-700">Detalles y Variantes</h3>
                <button
                  type="button"
                  onClick={handleAgregarVariante}
                  className="flex items-center gap-1 bg-(--color-pagina-2) text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:brightness-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Añadir variante
                </button>
              </div>

              <div className="space-y-6">
                {variantes.map((v, index) => {
                  const presentacionesFiltradas = (presentaciones || []).filter((p) =>
                    p?.nombre?.toLowerCase().includes((v.busquedaPres || "").toLowerCase())
                  );
                  const tallasFiltradas = (tallas || []).filter((t) =>
                    t?.nombre?.toLowerCase().includes((v.busquedaTalla || "").toLowerCase())
                  );
                  const ubicacionesFiltradas = (ubicaciones || []).filter((u) =>
                    u?.nombre?.toLowerCase().includes((v.busquedaUbic || "").toLowerCase())
                  );

                  const nombrePresActual = (presentaciones || []).find((p) => String(p?.idPresentacion) === String(v.presentacion))?.nombre || "Seleccionar presentación";
                  const nombreTallaActual = (tallas || []).find((t) => String(t?.idTalla) === String(v.talla))?.nombre || "Talla";
                  const nombreUbicActual = (ubicaciones || []).find((u) => String(u?.idUbicacion) === String(v.ubicacion))?.nombre || "Ubicación";

                  return (
                    <div key={index} className="bg-gray-50 p-5 rounded-xl border border-gray-200 relative space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      
                      {variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleEliminarVariante(index)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-full z-10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="text-xs font-bold text-gray-500 uppercase cursor-default">
                        Variante #{index + 1}
                      </div>

                      {/* PRESENTACIÓN */}
                      <div className="space-y-1 relative">
                        <label className="text-xs font-semibold text-gray-600 block">Presentación</label>
                        <div className="flex gap-2">
                          <div
                            onClick={() => handleCambioVariante(index, "openPresDropdown", !v.openPresDropdown)}
                            className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                          >
                            <span>{nombrePresActual}</span>
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenPresentacionModal(true)}
                            className="px-3.5 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer font-bold text-lg"
                          >
                            +
                          </button>
                        </div>

                        {v.openPresDropdown && (
                          <div className="absolute z-40 w-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                            <input
                              type="text"
                              placeholder="Buscar presentación..."
                              value={v.busquedaPres}
                              onChange={(e) => handleCambioVariante(index, "busquedaPres", e.target.value)}
                              className="w-full p-2 border rounded-md text-sm outline-none focus:border-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="max-h-32 overflow-y-auto">
                              {presentacionesFiltradas.map((p) => (
                                <div
                                  key={p?.idPresentacion}
                                  onClick={() => {
                                    handleCambioVariante(index, "presentacion", p?.idPresentacion);
                                    handleCambioVariante(index, "openPresDropdown", false);
                                  }}
                                  className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700 transition-colors"
                                >
                                  {p?.nombre}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PRECIO Y CÓDIGO */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Precio Venta</label>
                          <input
                            type="number"
                            value={v.precioVenta}
                            onChange={(e) => handleCambioVariante(index, "precioVenta", e.target.value)}
                            placeholder="Precio Venta"
                            className="w-full border p-3 rounded-lg bg-white outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Código de barras</label>
                          <input
                            value={v.codigoBarras}
                            onChange={(e) => handleCambioVariante(index, "codigoBarras", e.target.value)}
                            placeholder="Código de barras"
                            className="w-full border p-3 rounded-lg bg-white outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                          />
                        </div>
                      </div>

                      {/* TALLA, COLOR, UBICACIÓN */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* TALLA */}
                        <div className="space-y-1 relative">
                          <label className="text-xs font-semibold text-gray-600 block">Talla</label>
                          <div className="flex gap-1">
                            <div
                              onClick={() => handleCambioVariante(index, "openTallaDropdown", !v.openTallaDropdown)}
                              className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 text-sm overflow-hidden whitespace-nowrap text-ellipsis hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                              <span>{nombreTallaActual}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOpenTallaModal(true)}
                              className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>

                          {v.openTallaDropdown && (
                            <div className="absolute z-30 w-56 mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Buscar..."
                                value={v.busquedaTalla}
                                onChange={(e) => handleCambioVariante(index, "busquedaTalla", e.target.value)}
                                className="w-full p-1.5 border rounded text-xs outline-none focus:border-gray-400"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="max-h-28 overflow-y-auto">
                                {tallasFiltradas.map((t) => (
                                  <div
                                    key={t?.idTalla}
                                    onClick={() => {
                                      handleCambioVariante(index, "talla", t?.idTalla);
                                      handleCambioVariante(index, "openTallaDropdown", false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-xs text-gray-700 transition-colors"
                                  >
                                    {t?.nombre}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* COLOR */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Color</label>
                          <input
                            value={v.color}
                            onChange={(e) => handleCambioVariante(index, "color", e.target.value)}
                            placeholder="Color"
                            className="w-full border p-3 rounded-lg bg-white outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                          />
                        </div>

                        {/* UBICACIÓN */}
                        <div className="space-y-1 relative">
                          <label className="text-xs font-semibold text-gray-600 block">Ubicación</label>
                          <div className="flex gap-1">
                            <div
                              onClick={() => handleCambioVariante(index, "openUbicDropdown", !v.openUbicDropdown)}
                              className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 text-sm overflow-hidden whitespace-nowrap text-ellipsis hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                              <span>{nombreUbicActual}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOpenUbicacionModal(true)}
                              className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>

                          {v.openUbicDropdown && (
                            <div className="absolute z-30 w-56 right-0 mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Buscar..."
                                value={v.busquedaUbic}
                                onChange={(e) => handleCambioVariante(index, "busquedaUbic", e.target.value)}
                                className="w-full p-1.5 border rounded text-xs outline-none focus:border-gray-400"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="max-h-28 overflow-y-auto">
                                {ubicacionesFiltradas.map((u) => (
                                  <div
                                    key={u?.idUbicacion}
                                    onClick={() => {
                                      handleCambioVariante(index, "ubicacion", u?.idUbicacion);
                                      handleCambioVariante(index, "openUbicDropdown", false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-xs text-gray-700 transition-colors"
                                  >
                                    {u?.nombre}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BOTONES DE PASO */}
              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-all cursor-pointer"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={handleRegistrar}
                  disabled={loading}
                  className="bg-(--color-pagina-2) text-white px-6 py-3 rounded-xl disabled:opacity-50 font-medium hover:brightness-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {loading ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          MODALES AUXILIARES INTERCEPTADOS
         ========================================== */}

      {/* 1. MARCAS: Como onSave no envía argumentos, refrescamos la lista y buscamos el nuevo ID por texto */}
      <ModalNuevaMarca
        open={openMarcaModal}
        onClose={() => setOpenMarcaModal(false)}
        onSave={async () => {
          try {
            // Traemos las marcas actualizadas desde la BD
            const marcasData = await obtenerMarcas({ Activo: true, Page: 1, PageSize: 500 });
            const listaActualizada = marcasData?.items || [];
            setMarcas(listaActualizada);

            // Vinculamos de inmediato buscando por el texto que el usuario ingresó
            const marcaReciente = listaActualizada.find(
              (m) => m?.nombre?.toLowerCase() === busquedaMarca.trim().toLowerCase()
            );

            if (marcaReciente) {
              setMarcaSeleccionada(marcaReciente.idMarca);
            }
          } catch (error) {
            console.error("Error al refrescar marcas en el producto:", error);
          }
          setBusquedaMarca(""); // Limpiamos para evitar problemas con filtros
          setOpenMarcaModal(false);
        }}
      />

      {/* 2. CATEGORÍAS: Interceptamos el form local, guardamos en la BD y asignamos el ID al dropdown */}
      <ModalCategoria
        open={openCategoriaModal}
        onClose={() => setOpenCategoriaModal(false)}
        onSave={async (formLocal) => {
          try {
            // 1. Guardamos realmente en la base de datos
            const payload = {
              nombre: formLocal.nombre,
              descripcion: formLocal.descripcion,
              estado: formLocal.estado,
            };
            
            const respuestaApi = await crearCategoria(payload);
            const dataReal = respuestaApi?.data || respuestaApi;
            
            // 2. Extraemos el ID generado por el servidor
            const idFinal = dataReal?.idCategoria || dataReal?.id || Date.now();

            const categoriaFormateada = {
              idCategoria: idFinal,
              nombre: formLocal.nombre,
              descripcion: formLocal.descripcion,
              estado: formLocal.estado
            };

            // 3. Impactamos el estado local del dropdown
            setCategorias((prev) => [...prev, categoriaFormateada]);
            setCategoriaSeleccionada(idFinal);
            setBusquedaCat(""); 
            
          } catch (error) {
            console.error("Error al guardar categoría en BD desde el producto:", error);
            alert("No se pudo registrar la categoría en el servidor.");
          } finally {
            setOpenCategoriaModal(false);
          }
        }}
      />

      {/* 3. PRESENTACIÓN */}
      <ModalAgregarSimple
        open={openPresentacionModal}
        onClose={() => setOpenPresentacionModal(false)}
        titulo="Nueva Presentación"
        placeholder="Ej: Caja"
        onSave={(v) => {
          if (v) setPresentaciones((prev) => [...prev, v]);
        }}
      />

      {/* 4. TALLA */}
      <ModalAgregarSimple
        open={openTallaModal}
        onClose={() => setOpenTallaModal(false)}
        titulo="Nueva Talla"
        placeholder="Ej: M"
        onSave={(v) => {
          if (v) setTallas((prev) => [...prev, v]);
        }}
      />

      {/* 5. UBICACIÓN */}
      <ModalAgregarSimple
        open={openUbicacionModal}
        onClose={() => setOpenUbicacionModal(false)}
        titulo="Nueva Ubicación"
        placeholder="Ej: Estante 1"
        onSave={(v) => {
          if (v) setUbicaciones((prev) => [...prev, v]);
        }}
      />
    </div>
  );
};

export default ModalNuevoProducto;