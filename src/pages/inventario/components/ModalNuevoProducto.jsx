import { useState, useEffect, useMemo, useRef } from "react";
import { X, ArrowLeft, Plus, Trash2, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import ModalCatalogoInventario from "./ModalCatalogoInventario";
import BuscadorCombo from "./BuscadorCombo";

import { obtenerMarcas, crearMarca } from "@/services/marcas";
import { obtenerCategorias, crearCategoria } from "@/services/categorias";
import { obtenerPresentaciones, crearPresentacion } from "@/services/presentaciones";
import { obtenerTallas, crearTalla } from "@/services/tallas";

import { crearProducto } from "@/services/productos";
import { getApiErrorMessage } from "@/lib/apiClient";
import {
  getMensajeCombinacionVarianteDuplicada,
  getEstadoDiferencialesVariantes,
  getLabelCampoDiferencial,
  normalizarNombreVarianteParaComparar,
  parsearAtributosAdicionalesDesdeTexto,
  tieneNombreVarianteDuplicado,
} from "@/lib/varianteUtils";

function atributosAdicionalesSonValidos(texto) {
  if (!String(texto ?? "").trim()) return true;
  try {
    parsearAtributosAdicionalesDesdeTexto(texto);
    return true;
  } catch {
    return false;
  }
}

// Componente utilitario para simular classNames alternos si es necesario
const cn = (...classes) => classes.filter(Boolean).join(" ");

function BuscadorComboLocal({
  placeholder,
  value,
  onChange,
  items,
  idField,
  nameField,
  onLoadData,
  onAddNew,
  limit = 5,
}) {
  const selectedItem = useMemo(() => {
    return (items || []).find((item) => String(item?.[idField]) === String(value));
  }, [items, value, idField]);

  const selectedName = selectedItem ? selectedItem[nameField] : "";
  const [inputValor, setInputValor] = useState(selectedName);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const [prevSelectedName, setPrevSelectedName] = useState(selectedName);

  if (value !== prevValue || selectedName !== prevSelectedName) {
    setPrevValue(value);
    setPrevSelectedName(selectedName);
    setInputValor(selectedName);
  }

  const latestState = useRef({ inputValor, selectedName, onChange });
  useEffect(() => {
    latestState.current = { inputValor, selectedName, onChange };
  });

  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        const { inputValor: val, selectedName: name, onChange: changeFn } = latestState.current;
        if (val.trim() === "") {
          changeFn("");
          setInputValor("");
        } else {
          setInputValor(name);
        }
      }
    };
    document.addEventListener("mousedown", clickOutside);
    document.addEventListener("click", clickOutside);
    return () => {
      document.removeEventListener("mousedown", clickOutside);
      document.removeEventListener("click", clickOutside);
    };
  }, []);

  const query = inputValor.trim().toLowerCase();

  const matches = useMemo(() => {
    const isSelectedName = selectedItem && inputValor === selectedItem[nameField];
    const filterText = isSelectedName ? "" : query;

    const list = items || [];
    if (!filterText) {
      return list.slice(0, limit);
    }
    return list
      .filter((item) => item?.[nameField]?.toLowerCase().includes(filterText))
      .slice(0, limit);
  }, [items, query, selectedItem, nameField, inputValor, limit]);

  const handleSelect = (item) => {
    onChange(item[idField]);
    setInputValor(item[nameField]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (matches.length > 0) {
        handleSelect(matches[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      if (selectedItem) {
        setInputValor(selectedItem[nameField]);
      } else {
        setInputValor("");
      }
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      setIsOpen(false);
      if (inputValor.trim() === "") {
        onChange("");
        setInputValor("");
      } else {
        setInputValor(selectedName);
      }
    }
  };

  const handleFocus = (e) => {
    setIsOpen(true);
    e.target.select();
    if (onLoadData && (!items || items.length === 0)) {
      onLoadData();
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex gap-2">
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            value={inputValor}
            onChange={(e) => {
              setInputValor(e.target.value);
              setIsOpen(true);
            }}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full border p-3 pr-10 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors bg-white text-sm text-gray-700"
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400">
            {inputValor && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  onChange("");
                  setInputValor("");
                  setIsOpen(true);
                  inputRef.current?.focus();
                }}
                className="hover:text-gray-600 transition-colors p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 opacity-50 pointer-events-none" />
          </div>
        </div>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="px-3 bg-(--color-pagina-2) text-white rounded-lg hover:brightness-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 animate-in fade-in zoom-in duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400 italic">
              Sin開incidencias
            </div>
          ) : (
            <div className="py-1">
              {matches.map((item, idx) => {
                const isSelected = selectedItem && String(item[idField]) === String(selectedItem[idField]);
                return (
                  <div
                    key={`${idField}-${item[idField] ?? "sin-id"}-${idx}`}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm cursor-pointer select-none transition-colors",
                      isSelected
                        ? "bg-(--color-pagina)/10 text-(--color-pagina) font-semibold"
                        : "text-gray-700 hover:bg-gray-100",
                      idx === 0 && !isSelected ? "bg-gray-50 font-medium" : ""
                    )}
                  >
                    <span className="truncate pr-2">{item[nameField]}</span>
                    {idx === 0 && (
                      <span className="shrink-0 text-[10px] text-gray-400 font-normal border border-gray-200 px-1 rounded bg-white">
                        Enter
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const VARIANTE_VACIA = {
  talla: "",
  presentacion: "",
  color: "",
  nombreVariante: "",
  atributosAdicionales: "",
  precioVenta: "",
  precioVentaMayor: "",
  precioCompra: "",
  stockMinimo: "10",
  codigoBarras: "",
};

const CLASES_DIFERENCIAL_VARIANTE = {
  duplicado: {
    label: "text-red-700",
    input: "border-red-300 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-100 hover:border-red-400",
  },
  usado: {
    label: "text-emerald-700",
    input:
      "border-emerald-300 text-emerald-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 hover:border-emerald-400",
  },
  sugerido: {
    label: "text-amber-700",
    input:
      "border-amber-300 text-amber-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 hover:border-amber-400",
  },
  neutral: {
    label: "text-gray-600",
    input: "focus:border-gray-400 hover:border-gray-300",
  },
};

function getEstadoCampoDiferencial(estado, key) {
  if (estado?.duplicateKeys?.includes(key)) return "duplicado";
  if (estado?.isDuplicate && estado?.suggestedKeys?.includes(key)) return "sugerido";
  if (estado?.usedKeys?.includes(key)) return "usado";
  return "neutral";
}

function getClasesCampoDiferencial(estado, key) {
  return CLASES_DIFERENCIAL_VARIANTE[getEstadoCampoDiferencial(estado, key)];
}

const varianteTieneCambios = (variante) =>
  Object.keys(VARIANTE_VACIA).some((campo) => {
    const valorActual = String(variante?.[campo] ?? "").trim();
    const valorInicial = String(VARIANTE_VACIA[campo] ?? "").trim();
    return valorActual !== valorInicial;
  });

const CAMPOS_DIFERENCIALES_EDITABLES = new Set([
  "presentacion",
  "talla",
  "color",
  "nombreVariante",
  "atributosAdicionales",
]);

const campoAfectaDiferencialVariante = (campo) => CAMPOS_DIFERENCIALES_EDITABLES.has(campo);

const varianteTieneEspecificacionDiferencial = (variante) =>
  Boolean(
    variante?.talla ||
      variante?.presentacion ||
      String(variante?.nombreVariante ?? "").trim() ||
      String(variante?.color ?? "").trim() ||
      String(variante?.atributosAdicionales ?? "").trim()
  );

function getNombreVarianteNormalizado(variante) {
  return normalizarNombreVarianteParaComparar(variante?.nombreVariante);
}

function getInfoNombreVarianteDuplicadoVisible(variantes = [], ultimoIndex = null) {
  const getDuplicadasParaIndex = (index) => {
    const nombre = getNombreVarianteNormalizado(variantes[index]);
    if (!nombre) return [];

    return variantes
      .map((variante, idx) => (idx !== index && getNombreVarianteNormalizado(variante) === nombre ? idx : null))
      .filter((idx) => idx != null);
  };

  if (ultimoIndex != null && variantes[ultimoIndex]) {
    const duplicateIndices = getDuplicadasParaIndex(ultimoIndex);
    if (duplicateIndices.length) {
      return { index: ultimoIndex, duplicateIndices };
    }
  }

  for (let index = variantes.length - 1; index >= 0; index -= 1) {
    const duplicateIndices = getDuplicadasParaIndex(index);
    if (duplicateIndices.length) {
      return { index, duplicateIndices };
    }
  }

  return null;
}

function getIndiceVariantePendiente(variantes = [], estados = [], ultimoIndex = null, nombreDuplicadoInfo = null) {
  if (nombreDuplicadoInfo?.index != null) return nombreDuplicadoInfo.index;

  if (ultimoIndex != null && variantes[ultimoIndex]) {
    if (!varianteTieneEspecificacionDiferencial(variantes[ultimoIndex])) return ultimoIndex;
    if (estados[ultimoIndex]?.isDuplicate) return ultimoIndex;
  }

  for (let index = variantes.length - 1; index >= 0; index -= 1) {
    if (!varianteTieneEspecificacionDiferencial(variantes[index])) return index;
    if (estados[index]?.isDuplicate) return index;
  }

  return null;
}

function neutralizarEstadoDiferencialVariante(estado = {}) {
  return {
    ...estado,
    duplicateIndices: [],
    duplicateKeys: [],
    suggestedKeys: [],
    isDuplicate: false,
  };
}

function getIndiceVarianteDuplicadaVisible(estados = [], ultimoIndex = null) {
  if (ultimoIndex != null && estados[ultimoIndex]?.isDuplicate) {
    return ultimoIndex;
  }

  for (let index = estados.length - 1; index >= 0; index -= 1) {
    if (estados[index]?.isDuplicate) return index;
  }

  return null;
}

function aplicarDuplicadoNombreVarianteVisible(estados = [], nombreDuplicadoInfo = null) {
  if (nombreDuplicadoInfo?.index == null) return estados;

  return estados.map((estado, index) =>
    index === nombreDuplicadoInfo.index
      ? {
        ...neutralizarEstadoDiferencialVariante(estado),
        duplicateIndices: nombreDuplicadoInfo.duplicateIndices,
        duplicateKeys: ["nombreVariante"],
        suggestedKeys: [],
        isDuplicate: true,
      }
      : estado
  );
}

const formatFileSize = (bytes) => {
  const size = Number(bytes ?? 0);
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const [imagen, setImagen] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [variantes, setVariantes] = useState([{ ...VARIANTE_VACIA }]);
  const [ultimaVarianteEditadaIndex, setUltimaVarianteEditadaIndex] = useState(null);
  const bloqueoAgregarVarianteRef = useRef(false);

  const [openMarcaModal, setOpenMarcaModal] = useState(false);
  const [openCategoriaModal, setOpenCategoriaModal] = useState(false);
  const [openPresentacionModal, setOpenPresentacionModal] = useState(false);
  const [openTallaModal, setOpenTallaModal] = useState(false);
  const [activeVariantIndex, setActiveVariantIndex] = useState(null);
  const estadosDiferenciales = useMemo(
    () => getEstadoDiferencialesVariantes(variantes, { incluirNombreVariante: true }),
    [variantes]
  );
  const nombreVarianteDuplicadoVisible = useMemo(
    () => getInfoNombreVarianteDuplicadoVisible(variantes, ultimaVarianteEditadaIndex),
    [ultimaVarianteEditadaIndex, variantes]
  );
  const indiceVariantePendiente = useMemo(
    () =>
      getIndiceVariantePendiente(
        variantes,
        estadosDiferenciales,
        ultimaVarianteEditadaIndex,
        nombreVarianteDuplicadoVisible
      ),
    [estadosDiferenciales, nombreVarianteDuplicadoVisible, ultimaVarianteEditadaIndex, variantes]
  );
  const indiceVarianteDuplicadaVisible = useMemo(
    () =>
      nombreVarianteDuplicadoVisible?.index ??
      getIndiceVarianteDuplicadaVisible(estadosDiferenciales, ultimaVarianteEditadaIndex),
    [estadosDiferenciales, nombreVarianteDuplicadoVisible, ultimaVarianteEditadaIndex]
  );
  const estadosDiferencialesVisibles = useMemo(
    () => {
      const estadosVisibles = estadosDiferenciales.map((estado, index) =>
        index === indiceVarianteDuplicadaVisible
          ? estado
          : neutralizarEstadoDiferencialVariante(estado)
      );

      return aplicarDuplicadoNombreVarianteVisible(estadosVisibles, nombreVarianteDuplicadoVisible);
    },
    [estadosDiferenciales, indiceVarianteDuplicadaVisible, nombreVarianteDuplicadoVisible]
  );
  const agregarVarianteBloqueado = indiceVariantePendiente != null;

  useEffect(() => {
    bloqueoAgregarVarianteRef.current = agregarVarianteBloqueado;
  }, [agregarVarianteBloqueado]);

  const mostrarAviso = (tipo, mensaje) => {
    setNotificacion({ mostrar: true, tipo, mensaje });
    if (tipo === "exito") {
      setTimeout(() => {
        setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
      }, 3000);
    }
  };

  const cargarCategorias = async () => {
    try {
      const data = await obtenerCategorias({ Activo: true, Page: 1, PageSize: 500 });
      setCategorias(data?.items || []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const cargarMarcas = async () => {
    try {
      const data = await obtenerMarcas({ Activo: true, Page: 1, PageSize: 500 });
      setMarcas(data?.items || []);
    } catch (error) {
      console.error("Error al cargar marcas:", error);
    }
  };

  const cargarPresentaciones = async () => {
    try {
      const data = await obtenerPresentaciones({ Activo: true, Page: 1, PageSize: 500 });
      setPresentaciones(data?.items || []);
    } catch (error) {
      console.error("Error al cargar presentaciones:", error);
    }
  };

  const cargarTallas = async () => {
    try {
      const data = await obtenerTallas({ Activo: true, Page: 1, PageSize: 500 });
      setTallas(data?.items || []);
    } catch (error) {
      console.error("Error al cargar tallas:", error);
    }
  };

  const formularioTieneDatos = () => {
    if (nombre.trim() || descripcion.trim() || imagen || categoriaSeleccionada || marcaSeleccionada) {
      return true;
    }
    return variantes.length !== 1 || variantes.some(varianteTieneCambios);
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
      let atributosValidos = true;
      if (v.atributosAdicionales.trim()) {
        try {
          parsearAtributosAdicionalesDesdeTexto(v.atributosAdicionales);
        } catch {
          atributosValidos = false;
        }
      }
      const tieneEspecificacion =
        !!v.talla ||
        !!v.presentacion ||
        !!v.nombreVariante.trim() ||
        !!v.color.trim() ||
        !!v.atributosAdicionales.trim();
      const precioInvalido = v.precioVenta !== "" && Number(v.precioVenta) < 0;
      const costoInvalido = v.precioCompra !== "" && Number(v.precioCompra) < 0;
      const precioVentaMayorInvalido = v.precioVentaMayor !== "" && Number(v.precioVentaMayor) < 0;
      const stockMinimoInvalido =
        v.stockMinimo !== "" &&
        (!Number.isFinite(Number(v.stockMinimo)) || Number(v.stockMinimo) < 0);

      return !tieneEspecificacion || !atributosValidos || precioInvalido || costoInvalido || stockMinimoInvalido || precioVentaMayorInvalido;
    });

    return tieneVariantesInvalidas;
  };

  const getMensajeNombreVarianteDuplicado = () => {
    if (!tieneNombreVarianteDuplicado(variantes)) return "";
    const nombres = new Set();
    const duplicada = variantes.find((variante) => {
      const nombre = normalizarNombreVarianteParaComparar(variante.nombreVariante);
      if (!nombre) return false;
      if (nombres.has(nombre)) return true;
      nombres.add(nombre);
      return false;
    });
    const nombreMostrar = duplicada?.nombreVariante?.trim();
    return nombreMostrar
      ? `Ya existe una variante con el nombre "${nombreMostrar}". Usa otro nombre de variante.`
      : "No se permiten variantes con el mismo nombre. Usa nombres de variante diferentes.";
  };

  const getMensajeCombinacionVarianteDuplicadaLocal = () => {
    if (indiceVarianteDuplicadaVisible != null) {
      const mensajePendiente = getMensajeCombinacionVarianteDuplicada(
        variantes[indiceVarianteDuplicadaVisible],
        variantes,
        { incluirNombreVariante: true }
      );
      if (mensajePendiente) return mensajePendiente;
    }

    for (const variante of variantes) {
      const mensaje = getMensajeCombinacionVarianteDuplicada(variante, variantes, {
        incluirNombreVariante: true,
      });
      if (mensaje) return mensaje;
    }

    return "";
  };

  const handleAgregarVariante = () => {
    if (agregarVarianteBloqueado || bloqueoAgregarVarianteRef.current) return;

    bloqueoAgregarVarianteRef.current = true;
    const nuevoIndex = variantes.length;
    setVariantes((prev) => {
      const estadosActuales = getEstadoDiferencialesVariantes(prev, { incluirNombreVariante: true });
      const nombreDuplicadoActual = getInfoNombreVarianteDuplicadoVisible(
        prev,
        ultimaVarianteEditadaIndex
      );
      const pendienteActual = getIndiceVariantePendiente(
        prev,
        estadosActuales,
        ultimaVarianteEditadaIndex,
        nombreDuplicadoActual
      );

      if (pendienteActual != null) return prev;

      const primeraVariante = prev[0];
      if (primeraVariante) {
        return [
          ...prev,
          {
            ...VARIANTE_VACIA,
            talla: primeraVariante.talla,
            presentacion: primeraVariante.presentacion,
            precioVenta: primeraVariante.precioVenta,
            precioCompra: primeraVariante.precioCompra,
            stockMinimo: primeraVariante.stockMinimo,
            precioVentaMayor: primeraVariante.precioVentaMayor,
            color: "",
            codigoBarras: "",
          },
        ];
      }

      return [
        ...prev,
        {
          ...VARIANTE_VACIA,
        },
      ];
    });
    setUltimaVarianteEditadaIndex(nuevoIndex);
  };

  const handleEliminarVariante = (index) => {
    if (variantes.length > 1) {
      setVariantes(variantes.filter((_, i) => i !== index));
      setUltimaVarianteEditadaIndex((prev) => {
        if (prev == null) return prev;
        if (prev === index) return null;
        return prev > index ? prev - 1 : prev;
      });
    }
  };

  const handleCambioVariante = (index, campo, valor) => {
    const nuevasVariantes = [...variantes];
    nuevasVariantes[index][campo] = valor;
    setVariantes(nuevasVariantes);
    if (campoAfectaDiferencialVariante(campo)) {
      setUltimaVarianteEditadaIndex(index);
    }
  };

  const resetForm = () => {
    setStep(1);
    setNombre("");
    setDescripcion("");
    setImagen(null);
    setCategoriaSeleccionada("");
    setMarcaSeleccionada("");
    setCategorias([]);
    setMarcas([]);
    setPresentaciones([]);
    setTallas([]);
    setNotificacion({ mostrar: false, tipo: "", mensaje: "" });
    setOpenConfirmarSalida(false);
    setVariantes([{ ...VARIANTE_VACIA }]);
    setUltimaVarianteEditadaIndex(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRegistrar = async () => {
    if (formularioInvalido()) return;
    const mensajeDuplicado = getMensajeNombreVarianteDuplicado();
    if (mensajeDuplicado) {
      mostrarAviso("error", mensajeDuplicado);
      return;
    }

    const mensajeCombinacionDuplicada = getMensajeCombinacionVarianteDuplicadaLocal();
    if (mensajeCombinacionDuplicada) {
      mostrarAviso("error", mensajeCombinacionDuplicada);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("Nombre", nombre);
      formData.append("Descripcion", descripcion || "");
      formData.append("Categoria", Number(categoriaSeleccionada));
      formData.append("Marca", Number(marcaSeleccionada));
      formData.append("EstadoCatalogo", "BORRADOR");
      
      if (imagen) {
        formData.append("Imagen", imagen);
      }

      variantes.forEach((v, index) => {
        if (v.talla) formData.append(`Variantes[${index}].talla`, Number(v.talla));
        if (v.presentacion) formData.append(`Variantes[${index}].presentacion`, Number(v.presentacion));
        if (v.color) formData.append(`Variantes[${index}].color`, v.color);
        if (v.nombreVariante.trim()) {
          formData.append(`Variantes[${index}].nombreVariante`, v.nombreVariante.trim());
        }
        if (v.atributosAdicionales.trim()) {
          const atributos = parsearAtributosAdicionalesDesdeTexto(v.atributosAdicionales);
          formData.append(`Variantes[${index}].atributosAdicionales`, JSON.stringify(atributos));
        }
        if (v.precioVenta) formData.append(`Variantes[${index}].precioVenta`, Number(v.precioVenta));
        if (v.precioVentaMayor) formData.append(`Variantes[${index}].precioVentaMayor`, Number(v.precioVentaMayor));
        if (v.precioCompra) formData.append(`Variantes[${index}].precioCompra`, Number(v.precioCompra));
        if (v.stockMinimo !== "") formData.append(`Variantes[${index}].stockMinimo`, Number(v.stockMinimo));
        
        if (v.codigoBarras) {
          formData.append(`Variantes[${index}].codigosExternos[0].codigo`, v.codigoBarras);
          formData.append(`Variantes[${index}].codigosExternos[0].esPrincipal`, "true");
        }
      });

      await crearProducto(formData);

      mostrarAviso("exito", "¡Producto creado correctamente en el catálogo!");
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
      setTimeout(() => handleClose(), 1500);

    } catch (error) {
      console.error(error);
      const apiMessage = getApiErrorMessage(error, "Error interno al intentar crear el producto.");
      const msgError = apiMessage.toLowerCase().includes("misma combin")
        ? getMensajeCombinacionVarianteDuplicadaLocal() || apiMessage
        : apiMessage;
      mostrarAviso("error", msgError);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-(--color-blanco) w-full max-w-4xl rounded-2xl shadow-lg flex flex-col max-h-[90vh] border-t-4 border-(--color-pagina) relative">

        {notificacion.mostrar && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all max-w-md w-11/12 animate-bounce ${notificacion.tipo === "exito"
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

        {/* CONTENEDOR DE PASOS CORREGIDO: Ahora incluye de manera fija el botón de Añadir Variante */}
        <div className="relative flex justify-center items-center py-4 bg-gray-50 border-b px-6">
          <div className="flex gap-4 items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step === 1 ? "bg-(--color-pagina) text-white" : "bg-gray-200 text-gray-600"}`}>1</div>
            <div className="w-16 h-1 bg-gray-200 self-center rounded">
              <div className={`h-1 transition-all duration-300 ${step === 2 ? "bg-(--color-pagina) w-full" : "bg-(--color-pagina) w-1/2"}`} />
            </div>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${step === 2 ? "bg-(--color-pagina) text-white" : "bg-gray-200 text-gray-600"}`}>2</div>
          </div>

          {/* Botón flotante a la derecha de la barra de pasos (Solo visible en paso 2) */}
          {step === 2 && (
            <button
              type="button"
              onClick={handleAgregarVariante}
              disabled={agregarVarianteBloqueado}
              className="absolute right-6 flex items-center gap-1 bg-(--color-pagina-2) text-white px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-90 active:scale-95 transition-all cursor-pointer shadow-sm animate-in fade-in zoom-in duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
            >
              <Plus className="w-4 h-4" /> Añadir variante
            </button>
          )}
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 block">Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
                  className="w-full border p-2 rounded-lg outline-none focus:border-gray-400 hover:border-gray-300 transition-colors text-sm"
                />
                {imagen ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <span className="font-semibold">Imagen seleccionada:</span>
                    <span className="max-w-full truncate font-medium">{imagen.name}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-emerald-700">
                      {formatFileSize(imagen.size)}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-gray-600 block">Categoría *</label>
                  <BuscadorCombo
                    placeholder="Seleccionar categoría..."
                    value={categoriaSeleccionada}
                    onChange={setCategoriaSeleccionada}
                    items={categorias}
                    idField="idCategoria"
                    nameField="nombre"
                    onLoadData={cargarCategorias}
                    onAddNew={() => setOpenCategoriaModal(true)}
                  />
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-gray-600 block">Marca *</label>
                  <BuscadorCombo
                    placeholder="Seleccionar marca..."
                    value={marcaSeleccionada}
                    onChange={setMarcaSeleccionada}
                    items={marcas}
                    idField="idMarca"
                    nameField="nombre"
                    onLoadData={cargarMarcas}
                    onAddNew={() => setOpenMarcaModal(true)}
                  />
                </div>
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
              {/* Removido el sub-header antiguo que contenía el botón de añadir variante anterior */}
              <div className="space-y-6">
                {variantes.map((v, index) => {
                  const estadoDiferencial = estadosDiferencialesVisibles[index] || {};
                  const clasesPresentacion = getClasesCampoDiferencial(estadoDiferencial, "presentacion");
                  const clasesTalla = getClasesCampoDiferencial(estadoDiferencial, "talla");
                  const clasesColor = getClasesCampoDiferencial(estadoDiferencial, "color");
                  const clasesAtributos = getClasesCampoDiferencial(estadoDiferencial, "atributos");
                  const clasesNombreVariante = getClasesCampoDiferencial(estadoDiferencial, "nombreVariante");
                  const duplicadasTexto = (estadoDiferencial.duplicateIndices || [])
                    .map((idx) => `#${idx + 1}`)
                    .join(", ");
                  const sugerenciasTexto = (estadoDiferencial.suggestedKeys || [])
                    .map(getLabelCampoDiferencial)
                    .join(", ");
                  const nombreVarianteDuplicado = estadoDiferencial.duplicateKeys?.includes("nombreVariante");

                  return (
                    <div
                      key={index}
                      className="relative space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5 pr-12 shadow-sm transition-shadow hover:shadow-md"
                    >

                      {variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleEliminarVariante(index)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-full z-10 transition-all cursor-pointer flex items-center justify-center group"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      <div className="flex flex-wrap items-start justify-between gap-2 text-xs font-bold uppercase text-gray-500 cursor-default">
                        <span>Variante #{index + 1}</span>
                        {estadoDiferencial.isDuplicate ? (
                          <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold normal-case text-red-700">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            Duplicada con variante {duplicadasTexto}
                          </span>
                        ) : null}
                        {(!estadoDiferencial.isDuplicate && !v.talla && !v.presentacion && !v.nombreVariante.trim() && !v.color.trim() && !v.atributosAdicionales.trim()) && (
                          <span className="text-(--color-rojo) normal-case font-normal text-xs animate-pulse">
                            * Requiere Talla, Presentación, Nombre variante, Color o Atributos
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_6.5rem] gap-3">
                        <div className="space-y-1 md:min-w-0">
                          <label className={cn("block text-xs font-semibold", clasesNombreVariante.label)}>Nombre variante</label>
                          <input
                            value={v.nombreVariante}
                            onChange={(e) => handleCambioVariante(index, "nombreVariante", e.target.value)}
                            placeholder="Ej. Edición limitada"
                            className={cn(
                              "w-full rounded-lg border bg-(--color-blanco) p-3 outline-none transition-colors",
                              clasesNombreVariante.input
                            )}
                          />
                        </div>

                        <div className="space-y-1 md:w-[6.5rem] md:shrink-0">
                          <label className="text-xs font-semibold text-gray-600 block leading-tight">Precio venta</label>
                          <input
                            type="number"
                            value={v.precioVenta}
                            onChange={(e) => handleCambioVariante(index, "precioVenta", e.target.value)}
                            placeholder="0.00"
                            className={`w-full border px-2 py-3 rounded-lg bg-(--color-blanco) outline-none transition-colors text-sm tabular-nums ${v.precioVenta !== "" && Number(v.precioVenta) < 0 ? "border-red-400 bg-red-50" : "focus:border-gray-400 hover:border-gray-300"
                              }`}
                          />
                        </div>

                        <div className="space-y-1 md:w-[6.5rem] md:shrink-0">
                          <label className="text-xs font-semibold text-gray-600 block leading-tight">Precio mayoreo</label>
                          <input
                            type="number"
                            value={v.precioVentaMayor}
                            onChange={(e) => handleCambioVariante(index, "precioVentaMayor", e.target.value)}
                            placeholder="0.00"
                            className={`w-full border px-2 py-3 rounded-lg bg-(--color-blanco) outline-none transition-colors text-sm tabular-nums ${v.precioVenta !== "" && Number(v.precioVenta) < 0 ? "border-red-400 bg-red-50" : "focus:border-gray-400 hover:border-gray-300"
                              }`}
                          />
                        </div>

                        <div className="space-y-1 md:w-[6.5rem] md:shrink-0">
                          <label className="text-xs font-semibold text-gray-600 block leading-tight">Stock mínimo</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={v.stockMinimo}
                            onChange={(e) => handleCambioVariante(index, "stockMinimo", e.target.value)}
                            placeholder="10"
                            title="Unidades mínimas antes de alerta de bajo stock"
                            className={`w-full border px-2 py-3 rounded-lg bg-(--color-blanco) outline-none transition-colors text-sm tabular-nums ${v.stockMinimo !== "" &&
                              (!Number.isFinite(Number(v.stockMinimo)) || Number(v.stockMinimo) < 0)
                              ? "border-red-400 bg-red-50"
                              : "focus:border-gray-400 hover:border-gray-300"
                              }`}
                          />
                        </div>
                      </div>

                      {estadoDiferencial.isDuplicate ? (
                        <p className={cn(
                          "rounded-lg border bg-white px-3 py-2 text-xs font-medium",
                          nombreVarianteDuplicado
                            ? "border-red-300 text-red-800"
                            : "border-amber-300 text-amber-800"
                        )}>
                          {nombreVarianteDuplicado
                            ? "Ya existe una variante con ese nombre. Usa otro nombre de variante."
                            : `Agrega un diferencial en ${sugerenciasTexto || "otro campo"} para separar esta variante.`}
                        </p>
                      ) : null}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1 relative">
                          <label className={cn("block text-xs font-semibold", clasesPresentacion.label)}>Presentación</label>
                          <BuscadorCombo
                            placeholder="Seleccionar presentación..."
                            value={v.presentacion}
                            onChange={(val) => handleCambioVariante(index, "presentacion", val)}
                            items={presentaciones}
                            idField="idPresentacion"
                            nameField="nombre"
                            onLoadData={cargarPresentaciones}
                            onAddNew={() => {
                              setActiveVariantIndex(index);
                              setOpenPresentacionModal(true);
                            }}
                            limit={3}
                            inputClassName={clasesPresentacion.input}
                          />
                        </div>
                        <div className="space-y-1 relative">
                          <label className={cn("block text-xs font-semibold", clasesTalla.label)}>Talla</label>
                          <BuscadorCombo
                            placeholder="Seleccionar talla..."
                            value={v.talla}
                            onChange={(val) => handleCambioVariante(index, "talla", val)}
                            items={tallas}
                            idField="idTalla"
                            nameField="nombre"
                            onLoadData={cargarTallas}
                            onAddNew={() => {
                              setActiveVariantIndex(index);
                              setOpenTallaModal(true);
                            }}
                            limit={3}
                            inputClassName={clasesTalla.input}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className={cn("block text-xs font-semibold", clasesColor.label)}>Color</label>
                          <input
                            value={v.color}
                            onChange={(e) => handleCambioVariante(index, "color", e.target.value)}
                            placeholder="Color"
                            className={cn(
                              "w-full rounded-lg border bg-(--color-blanco) p-3 outline-none transition-colors",
                              clasesColor.input
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-600 block">Código de barras</label>
                          <input
                            value={v.codigoBarras}
                            onChange={(e) => handleCambioVariante(index, "codigoBarras", e.target.value)}
                            placeholder="Código de barras"
                            className="w-full border p-3 rounded-lg bg-(--color-blanco) outline-none focus:border-gray-400 hover:border-gray-300 transition-colors"
                          />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <label className={cn("block text-xs font-semibold", clasesAtributos.label)}>Atributos adicionales</label>
                          <input
                            value={v.atributosAdicionales}
                            onChange={(e) => handleCambioVariante(index, "atributosAdicionales", e.target.value)}
                            placeholder="Ej. Algodón, costuras reforzadas"
                            className={cn(
                              "w-full rounded-lg border bg-(--color-blanco) p-3 outline-none transition-colors",
                              clasesAtributos.input
                            )}
                          />
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
          } {
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
              if (deLista && activeVariantIndex !== null) {
                const nuevasVariantes = [...variantes];
                nuevasVariantes[activeVariantIndex].presentacion = idFinal;
                setVariantes(nuevasVariantes);
                setUltimaVarianteEditadaIndex(activeVariantIndex);
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
              if (deLista && activeVariantIndex !== null) {
                const nuevasVariantes = [...variantes];
                nuevasVariantes[activeVariantIndex].talla = idFinal;
                setVariantes(nuevasVariantes);
                setUltimaVarianteEditadaIndex(activeVariantIndex);
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

    </div>
  );
};

export default ModalNuevoProducto;
