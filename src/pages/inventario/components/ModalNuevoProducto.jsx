import { useState } from "react";
import { X, ArrowLeft, Plus, Trash2, Search, CheckCircle, AlertCircle } from "lucide-react";

import ModalCatalogoInventario from "./ModalCatalogoInventario";

import { obtenerMarcas, crearMarca } from "@/services/marcas";
import { obtenerCategorias, crearCategoria } from "@/services/categorias";
import { obtenerPresentaciones, crearPresentacion } from "@/services/presentaciones";
import { obtenerTallas, crearTalla } from "@/services/tallas";
import { obtenerUbicaciones, crearUbicacion } from "@/services/ubicaciones";

import { crearProducto } from "@/services/productos";

const ModalNuevoProducto = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estado para avisos flotantes de éxito/error
  const [notificacion, setNotificacion] = useState({ mostrar: false, tipo: "", mensaje: "" });

  // Estado para controlar la apertura del modal personalizado de confirmación de salida
  const [openConfirmarSalida, setOpenConfirmarSalida] = useState(false);

  // Datos del formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");

  const [busquedaCat, setBusquedaCat] = useState("");
  const [openCatDropdown, setOpenCatDropdown] = useState(false);
  const [busquedaMarca, setBusquedaMarca] = useState("");
  const [openMarcaDropdown, setOpenMarcaDropdown] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

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
      precioCompra: "",
      codigoBarras: "",
      
      ubicacion: "",
      busquedaUbic: "",
      openUbicDropdown: false,
    },
  ]);

  const [openMarcaModal, setOpenMarcaModal] = useState(false);
  const [openCategoriaModal, setOpenCategoriaModal] = useState(false);
  const [openPresentacionModal, setOpenPresentacionModal] = useState(false);
  const [openTallaModal, setOpenTallaModal] = useState(false);
  const [openUbicacionModal, setOpenUbicacionModal] = useState(false);

  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

  const toggleCategoriasDropdown = async () => {
    const nuevoEstado = !openCatDropdown;
    setOpenCatDropdown(nuevoEstado);
    if (nuevoEstado) {
      try {
        const data = await obtenerCategorias({ Activo: true, Page: 1, PageSize: 500 });
        setCategorias(data?.items || []);
      } catch (error) {
        console.error("Error al cargar categorías en demanda:", error);
      }
    }
  };

  const toggleMarcasDropdown = async () => {
    const nuevoEstado = !openMarcaDropdown;
    setOpenMarcaDropdown(nuevoEstado);
    if (nuevoEstado) {
      try {
        const data = await obtenerMarcas({ Activo: true, Page: 1, PageSize: 500 });
        setMarcas(data?.items || []);
      } catch (error) {
        console.error("Error al cargar marcas en demanda:", error);
      }
    }
  };

  const togglePresentacionesDropdown = async (index) => {
    const nuevasVariantes = [...variantes];
    const nuevoEstado = !nuevasVariantes[index].openPresDropdown;
    
    variantes.forEach((_, i) => {
      if (i !== index) nuevasVariantes[i].openPresDropdown = false;
      nuevasVariantes[i].openTallaDropdown = false;
      nuevasVariantes[i].openUbicDropdown = false;
    });

    nuevasVariantes[index].openPresDropdown = nuevoEstado;
    setVariantes(nuevasVariantes);

    if (nuevoEstado) {
      try {
        const data = await obtenerPresentaciones({ Activo: true, Page: 1, PageSize: 500 });
        setPresentaciones(data?.items || []);
      } catch (error) {
        console.error("Error al cargar presentaciones en demanda:", error);
      }
    }
  };

  const toggleTallasDropdown = async (index) => {
    const nuevasVariantes = [...variantes];
    const nuevoEstado = !nuevasVariantes[index].openTallaDropdown;
    
    variantes.forEach((_, i) => {
      nuevasVariantes[i].openPresDropdown = false;
      if (i !== index) nuevasVariantes[i].openTallaDropdown = false;
      nuevasVariantes[i].openUbicDropdown = false;
    });

    nuevasVariantes[index].openTallaDropdown = nuevoEstado;
    setVariantes(nuevasVariantes);

    if (nuevoEstado) {
      try {
        const data = await obtenerTallas({ Activo: true, Page: 1, PageSize: 500 });
        setTallas(data?.items || []);
      } catch (error) {
        console.error("Error al cargar tallas en demanda:", error);
      }
    }
  };

  const toggleUbicacionesDropdown = async (index) => {
    const nuevasVariantes = [...variantes];
    const nuevoEstado = !nuevasVariantes[index].openUbicDropdown;
    
    variantes.forEach((_, i) => {
      nuevasVariantes[i].openPresDropdown = false;
      nuevasVariantes[i].openTallaDropdown = false;
      if (i !== index) nuevasVariantes[i].openUbicDropdown = false;
    });

    nuevasVariantes[index].openUbicDropdown = nuevoEstado;
    setVariantes(nuevasVariantes);

    if (nuevoEstado) {
      try {
        const data = await obtenerUbicaciones({ Activo: true, Page: 1, PageSize: 500 });
        setUbicaciones(data?.items || []);
      } catch (error) {
        console.error("Error al cargar ubicaciones en demanda:", error);
      }
    }
  };

  const formularioTieneDatos = () => {
    if (nombre.trim() || descripcion.trim() || categoriaSeleccionada || marcaSeleccionada) {
      return true;
    }
    const algunaVarianteModificada = variantes.some((v) => 
      v.talla || v.presentacion || v.color.trim() || v.precioVenta || v.precioCompra || v.codigoBarras || v.ubicacion
    );
    return algunaVarianteModificada || variantes.length > 1;
  };

  const handleIntentoCierre = () => {
    if (formularioTieneDatos()) {
      setOpenConfirmarSalida(true);
    } else {
      handleClose();
    }
  };

  const formularioInvalido = () => {
    if (!nombre.trim() || !categoriaSeleccionada || !marcaSeleccionada) {
      return true; 
    }

    const tieneVariantesInvalidas = variantes.some((v) => {
      const tieneEspecificacion = !!v.talla || !!v.presentacion || !!v.color.trim();
      const precioInvalido = v.precioVenta !== "" && Number(v.precioVenta) < 0;
      const costoInvalido = v.precioCompra !== "" && Number(v.precioCompra) < 0;
      return !tieneEspecificacion || precioInvalido || costoInvalido;
    });

    return tieneVariantesInvalidas;
  };

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
        precioCompra: "",
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

  const resetForm = () => {
    setStep(1);
    setNombre("");
    setDescripcion("");
    setCategoriaSeleccionada("");
    setMarcaSeleccionada("");
    setBusquedaCat("");
    setBusquedaMarca("");
    setCategorias([]);
    setMarcas([]);
    setPresentaciones([]);
    setTallas([]);
    setUbicaciones([]);
    setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
    setOpenConfirmarSalida(false);
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
        precioCompra: "",
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

  const handleRegistrar = async () => {
    if (formularioInvalido()) return;

    try {
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
          precioCompra: v.precioCompra ? Number(v.precioCompra) : null,
          idUbicacionDefault: v.ubicacion ? Number(v.ubicacion) : null,
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

        <div className="flex justify-between items-center p-6 border-b">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 cursor-pointer group">
              <ArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <h2 className="text-lg font-semibold text-gray-800">Nuevo Producto</h2>
          <button onClick={handleIntentoCierre} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800 cursor-pointer group">
            <X className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <div className="flex justify-center gap-4 py-4 bg-gray-50 border-b">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step === 1 ? "bg-(--color-pagina) text-white" : "bg-gray-200 text-gray-600"}`}>1</div>
          <div className="w-16 h-1 bg-gray-200 self-center rounded">
            <div className={`h-1 transition-all duration-300 ${step === 2 ? "bg-(--color-pagina) w-full" : "bg-(--color-pagina) w-1/2"}`} />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step === 2 ? "bg-(--color-pagina) text-white" : "bg-gray-200 text-gray-600"}`}>2</div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-gray-700">Información General</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Nombre del Producto *</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Escribe el nombre del producto"
                  className="w-full border p-3 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-gray-600 block">Categoría *</label>
                <div className="flex gap-2">
                  <div
                    onClick={toggleCategoriasDropdown}
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

              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-gray-600 block">Marca *</label>
                <div className="flex gap-2">
                  <div
                    onClick={toggleMarcasDropdown}
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
                disabled={!nombre.trim() || !categoriaSeleccionada || !marcaSeleccionada}
                className="w-full bg-(--color-pagina) text-white py-3 rounded-xl font-medium tracking-wide mt-4 hover:brightness-95 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
              >
                Siguiente paso
              </button>
            </div>
          )}

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
                  const nombreTallaActual = (tallas || []).find((t) => String(t?.idTalla) === String(v.talla))?.nombre || "Seleccionar talla";
                  const nombreUbicActual = (ubicaciones || []).find((u) => String(u?.idUbicacion) === String(v.ubicacion))?.nombre || "Seleccionar ubicación";

                  return (
                    <div key={index} className="bg-gray-50 p-5 rounded-xl border border-gray-200 relative space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      
                      {variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleEliminarVariante(index)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-full z-10 transition-all cursor-pointer flex items-center justify-center group"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      <div className="text-xs font-bold text-gray-500 uppercase cursor-default flex justify-between">
                        <span>Variante #{index + 1}</span>
                        {(!v.talla && !v.presentacion && !v.color.trim()) && (
                          <span className="text-red-500 normal-case font-normal text-xs animate-pulse">
                            * Requiere al menos Talla, Presentación o Color
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 relative">
                        <label className="text-xs font-semibold text-gray-600 block">Presentación</label>
                        <div className="flex gap-2">
                          <div
                            onClick={() => togglePresentacionesDropdown(index)}
                            className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                          >
                            <span>{nombrePresActual}</span>
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenPresentacionModal(true)}
                            className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {v.openPresDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                            <input
                              type="text"
                              placeholder="Buscar presentación..."
                              value={v.busquedaPres}
                              onChange={(e) => handleCambioVariante(index, "busquedaPres", e.target.value)}
                              className="w-full p-2 border rounded-md text-sm outline-none focus:border-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="max-h-40 overflow-y-auto">
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
                              {presentacionesFiltradas.length === 0 && (
                                <div className="p-2 text-xs text-gray-400 text-center cursor-default">No se encontraron resultados</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Precio venta</label>
                          <input
                            type="number"
                            value={v.precioVenta}
                            onChange={(e) => handleCambioVariante(index, "precioVenta", e.target.value)}
                            placeholder="Precio venta"
                            className={`w-full border p-3 rounded-lg bg-white outline-none transition-colors ${
                              v.precioVenta !== "" && Number(v.precioVenta) < 0 ? "border-red-400 bg-red-50" : "focus:border-gray-400 hover:border-gray-300"
                            }`}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Precio costo</label>
                          <input
                            type="number"
                            value={v.precioCompra}
                            onChange={(e) => handleCambioVariante(index, "precioCompra", e.target.value)}
                            placeholder="Precio costo"
                            className={`w-full border p-3 rounded-lg bg-white outline-none transition-colors ${
                              v.precioCompra !== "" && Number(v.precioCompra) < 0 ? "border-red-400 bg-red-50" : "focus:border-gray-400 hover:border-gray-300"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <div className="space-y-1 relative">
                          <label className="text-xs font-semibold text-gray-600 block">Talla</label>
                          <div className="flex gap-2">
                            <div
                              onClick={() => toggleTallasDropdown(index)}
                              className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 text-sm overflow-hidden whitespace-nowrap text-ellipsis hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                              <span>{nombreTallaActual}</span>
                              <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setOpenTallaModal(true)}
                              className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>

                          {v.openTallaDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Buscar talla..."
                                value={v.busquedaTalla}
                                onChange={(e) => handleCambioVariante(index, "busquedaTalla", e.target.value)}
                                className="w-full p-2 border rounded-md text-sm outline-none focus:border-gray-400"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="max-h-40 overflow-y-auto">
                                {tallasFiltradas.map((t) => (
                                  <div
                                    key={t?.idTalla}
                                    onClick={() => {
                                      handleCambioVariante(index, "talla", t?.idTalla);
                                      handleCambioVariante(index, "openTallaDropdown", false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700 transition-colors"
                                  >
                                    {t?.nombre}
                                  </div>
                                ))}
                                {tallasFiltradas.length === 0 && (
                                  <div className="p-2 text-xs text-gray-400 text-center cursor-default">No se encontraron resultados</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Color</label>
                          <input
                            value={v.color}
                            onChange={(e) => handleCambioVariante(index, "color", e.target.value)}
                            placeholder="Color"
                            className="w-full border p-3 rounded-lg bg-white outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                          />
                        </div>

                        <div className="space-y-1 relative">
                          <label className="text-xs font-semibold text-gray-600 block">Ubicación</label>
                          <div className="flex gap-2">
                            <div
                              onClick={() => toggleUbicacionesDropdown(index)}
                              className="flex-1 p-3 border rounded-lg bg-white cursor-pointer flex justify-between items-center text-gray-700 text-sm overflow-hidden whitespace-nowrap text-ellipsis hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                              <span>{nombreUbicActual}</span>
                              <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setOpenUbicacionModal(true)}
                              className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>

                          {v.openUbicDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Buscar ubicación..."
                                value={v.busquedaUbic}
                                onChange={(e) => handleCambioVariante(index, "busquedaUbic", e.target.value)}
                                className="w-full p-2 border rounded-md text-sm outline-none focus:border-gray-400"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="max-h-40 overflow-y-auto">
                                {ubicacionesFiltradas.map((u) => (
                                  <div
                                    key={u?.idUbicacion}
                                    onClick={() => {
                                      handleCambioVariante(index, "ubicacion", u?.idUbicacion);
                                      handleCambioVariante(index, "openUbicDropdown", false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm text-gray-700 transition-colors"
                                  >
                                    {u?.nombre}
                                  </div>
                                ))}
                                {ubicacionesFiltradas.length === 0 && (
                                  <div className="p-2 text-xs text-gray-400 text-center cursor-default">No se encontraron resultados</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium transition-all cursor-pointer group flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Anterior
                </button>

                <button
                  type="button"
                  onClick={handleRegistrar}
                  disabled={loading || formularioInvalido()}
                  className="bg-(--color-pagina-2) text-white px-6 py-3 rounded-xl font-medium hover:brightness-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  {loading ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-modal Personalizado de Confirmación de Salida */}
      {openConfirmarSalida && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col border-t-4 border-(--color-pagina) p-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-800 text-center">¿Estás seguro de salir?</h4>
            <p className="text-sm text-gray-500 text-center">No se guardarán los cambios</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-red-500 text-white py-2.5 rounded-xl font-medium hover:bg-red-600 active:scale-[0.99] transition-all cursor-pointer text-sm"
              >
                Sí, Cerrar
              </button>
              <button
                type="button"
                onClick={() => setOpenConfirmarSalida(false)}
                className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-sm"
              >
                No, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales Secundarios de Creación en BD */}
      <ModalCatalogoInventario
        open={openMarcaModal}
        onClose={() => setOpenMarcaModal(false)}
        onSave={async (form) => {
          try {
            await crearMarca(form);

            const marcasData = await obtenerMarcas({ Activo: true, Page: 1, PageSize: 500 });
            const listaActualizada = marcasData?.items || [];
            setMarcas(listaActualizada);

            const marcaReciente = listaActualizada.find(
              (m) => m?.nombre?.toLowerCase() === form.nombre.trim().toLowerCase()
            );

            if (marcaReciente) {
              setMarcaSeleccionada(marcaReciente.idMarca);
            }
          } catch (error) {
            console.error("Error al guardar marca:", error);
          } finally {
            setBusquedaMarca("");
            setOpenMarcaModal(false);
          }
        }}
        tituloNuevo="Nueva Marca"
      />

      <ModalCatalogoInventario
        open={openCategoriaModal}
        onClose={() => setOpenCategoriaModal(false)}
        onSave={async (form) => {
          try {
            const payload = {
              nombre: form.nombre,
              descripcion: form.descripcion,
              estado: form.activo,
            };

            const respuestaApi = await crearCategoria(payload);
            const dataReal = respuestaApi?.data || respuestaApi;
            const idFinal = dataReal?.idCategoria || dataReal?.id || Date.now();

            const categoriaFormateada = {
              idCategoria: idFinal,
              nombre: form.nombre,
              descripcion: form.descripcion,
              estado: form.activo,
            };

            setCategorias((prev) => [...prev, categoriaFormateada]);
            setCategoriaSeleccionada(idFinal);
            setBusquedaCat("");
          } catch (error) {
            console.error("Error al guardar categoría:", error);
          } finally {
            setOpenCategoriaModal(false);
          }
        }}
        tituloNuevo="Nueva Categoría"
      />

      <ModalCatalogoInventario
        open={openPresentacionModal}
        onClose={() => setOpenPresentacionModal(false)}
        onSave={async (form) => {
          try {
            const payload = {
              nombre: form.nombre,
              descripcion: form.descripcion,
              estado: form.activo,
            };
            const respuestaApi = await crearPresentacion(payload);
            const dataReal = respuestaApi?.data || respuestaApi;
            const idFinal = dataReal?.idPresentacion || dataReal?.id;

            const res = await obtenerPresentaciones({ Activo: true, Page: 1, PageSize: 500 });
            const listaActualizada = res?.items || [];
            setPresentaciones(listaActualizada);

            if (idFinal) {
              const deLista = listaActualizada.find(p => Number(p.idPresentacion) === Number(idFinal));
              if (deLista) {
                const nuevasVariantes = [...variantes];
                const indexUltimaAbierta = nuevasVariantes.findIndex(v => v.openPresDropdown === true);
                if (indexUltimaAbierta !== -1) {
                  nuevasVariantes[indexUltimaAbierta].presentacion = idFinal;
                }
                setVariantes(nuevasVariantes);
              }
            }
          } catch (error) {
            console.error("Error al guardar presentación:", error);
          } finally {
            setOpenPresentacionModal(false);
          }
        }}
        tituloNuevo="Nueva Presentación"
      />

      <ModalCatalogoInventario
        open={openTallaModal}
        onClose={() => setOpenTallaModal(false)}
        onSave={async (form) => {
          try {
            const payload = {
              nombre: form.nombre,
              descripcion: form.descripcion,
              activo: form.activo,
            };
            const respuestaApi = await crearTalla(payload);
            const dataReal = respuestaApi?.data || respuestaApi;
            const idFinal = dataReal?.idTalla || dataReal?.id;

            const res = await obtenerTallas({ Activo: true, Page: 1, PageSize: 500 });
            const listaActualizada = res?.items || [];
            setTallas(listaActualizada);

            if (idFinal) {
              const deLista = listaActualizada.find(t => Number(t.idTalla) === Number(idFinal));
              if (deLista) {
                const nuevasVariantes = [...variantes];
                const indexUltimaAbierta = nuevasVariantes.findIndex(v => v.openTallaDropdown === true);
                if (indexUltimaAbierta !== -1) {
                  nuevasVariantes[indexUltimaAbierta].talla = idFinal;
                }
                setVariantes(nuevasVariantes);
              }
            }
          } catch (error) {
            console.error("Error al guardar talla:", error);
          } finally {
            setOpenTallaModal(false);
          }
        }}
        tituloNuevo="Nueva Talla"
        nombrePlaceholder="Nombre (Ej: M, L, XL)"
      />

      <ModalCatalogoInventario
        open={openUbicacionModal}
        onClose={() => setOpenUbicacionModal(false)}
        onSave={async (form) => {
          try {
            const payload = {
              nombre: form.nombre,
              descripcion: form.descripcion,
              activo: form.activo,
            };
            const respuestaApi = await crearUbicacion(payload);
            const dataReal = respuestaApi?.data || respuestaApi;
            const idFinal = dataReal?.idUbicacion || dataReal?.id;

            const res = await obtenerUbicaciones({ Activo: true, Page: 1, PageSize: 500 });
            const listaActualizada = res?.items || [];
            setUbicaciones(listaActualizada);

            if (idFinal) {
              const deLista = listaActualizada.find(u => Number(u.idUbicacion) === Number(idFinal));
              if (deLista) {
                const nuevasVariantes = [...variantes];
                const indexUltimaAbierta = nuevasVariantes.findIndex(v => v.openUbicDropdown === true);
                if (indexUltimaAbierta !== -1) {
                  nuevasVariantes[indexUltimaAbierta].ubicacion = idFinal;
                }
                setVariantes(nuevasVariantes);
              }
            }
          } catch (error) {
            console.error("Error al guardar ubicación:", error);
          } finally {
            setOpenUbicacionModal(false);
          }
        }}
        tituloNuevo="Nueva Ubicación"
      />
    </div>
  );
};

export default ModalNuevoProducto;