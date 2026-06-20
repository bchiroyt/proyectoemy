import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const controlClass = "h-7 min-h-7 bg-(--color-gris-claro-2) text-xs shadow-none";

function ProveedorBuscador({
  value,
  onChange,
  proveedores,
  disabled,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValor, setInputValor] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedProvider = useMemo(() => {
    return proveedores.find((p) => String(p.id) === String(value));
  }, [proveedores, value]);

  const providerName = selectedProvider ? selectedProvider.nombre : "";
  const [prevValue, setPrevValue] = useState(value);
  const [prevProviderName, setPrevProviderName] = useState(providerName);

  if (value !== prevValue || providerName !== prevProviderName) {
    setPrevValue(value);
    setPrevProviderName(providerName);
    setInputValor(providerName);
  }

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setInputValor(providerName);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [providerName]);

  const query = inputValor.trim().toLowerCase();

  const matches = useMemo(() => {
    const isSelectedName = selectedProvider && inputValor === selectedProvider.nombre;
    const filterText = isSelectedName ? "" : query;

    if (!filterText) {
      return proveedores.slice(0, 5);
    }
    return proveedores
      .filter((p) => p.nombre.toLowerCase().includes(filterText))
      .slice(0, 5);
  }, [proveedores, query, selectedProvider, inputValor]);

  const handleSelect = (p) => {
    onChange(String(p.id));
    setInputValor(p.nombre);
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
      if (selectedProvider) {
        setInputValor(selectedProvider.nombre);
      } else {
        setInputValor("");
      }
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          disabled={disabled}
          value={inputValor}
          onChange={(e) => {
            setInputValor(e.target.value);
            setIsOpen(true);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            e.target.select();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Seleccione proveedor…"
          className={cn(
            controlClass,
            "w-full pr-8 pl-2 bg-(--color-gris-claro-2) focus-visible:ring-1 focus-visible:ring-(--color-pagina) placeholder:text-muted-foreground/60"
          )}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-(--color-gris-letra)">
          {inputValor && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onChange("");
                setInputValor("");
                setIsOpen(true);
                inputRef.current?.focus();
              }}
              className="hover:text-(--color-negro) transition-colors p-0.5"
            >
              <X className="size-3" />
            </button>
          )}
          <ChevronDown className="size-3.5 opacity-50 pointer-events-none" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-[50] mt-1 max-h-60 overflow-y-auto rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-lg">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-xs text-(--color-gris-letra) italic">
              Sin coincidencias
            </div>
          ) : (
            <div className="py-1">
              {matches.map((p, idx) => {
                const isSelected = selectedProvider && String(p.id) === String(selectedProvider.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer select-none transition-colors",
                      isSelected
                        ? "bg-(--color-pagina)/10 text-(--color-pagina) font-semibold"
                        : "text-(--color-negro) hover:bg-(--color-pagina-hover)",
                      idx === 0 && !isSelected ? "bg-(--color-gris-claro-2)/50 font-medium" : ""
                    )}
                  >
                    <span className="truncate pr-2">{p.nombre}</span>
                    {idx === 0 && (
                      <span className="shrink-0 text-[9px] text-(--color-gris-letra) font-normal border border-(--color-gris-claro-2) px-1 rounded bg-(--color-blanco)">
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

function Campo({ label, children, className }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <Label className="w-[4.25rem] shrink-0 text-right text-[9px] font-bold uppercase leading-none text-(--color-gris-letra)">
        {label}
      </Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function CompraDatosGenerales({
  proveedor,
  onProveedorChange,
  proveedores,
  proveedoresLoading,
  fechaPedido,
  onFechaPedidoChange,
  documentoRef,
  onDocumentoRefChange,
  tipoComprobante,
  onTipoComprobanteChange,
  disabled = false,
}) {
  return (
    <section
      aria-labelledby="compra-datos-generales-titulo"
      className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-2.5 py-1.5 lg:flex-nowrap">
        <h2
          id="compra-datos-generales-titulo"
          className="w-full shrink-0 text-[10px] font-bold uppercase leading-none text-(--color-negro) lg:w-auto"
        >
          Datos generales
        </h2>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 lg:flex-nowrap">
          <Campo label="Proveedor" className="w-full sm:w-auto sm:min-w-[11rem] lg:min-w-[12rem] lg:flex-[1.35]">
            {proveedoresLoading ? (
              <div className={cn(controlClass, "w-full animate-pulse rounded-md")} />
            ) : (
              <ProveedorBuscador
                value={proveedor}
                onChange={onProveedorChange}
                proveedores={proveedores}
                disabled={disabled}
              />
            )}
          </Campo>

          <Campo label="Fecha" className="w-full sm:w-auto sm:min-w-[9.5rem]">
            <Input
              type="date"
              value={fechaPedido}
              onChange={(e) => onFechaPedidoChange(e.target.value)}
              className={controlClass}
              disabled={disabled}
            />
          </Campo>

          <Campo label="No. ref." className="w-full sm:w-auto sm:min-w-[9rem] lg:min-w-[8rem] lg:flex-1">
            <Input
              value={documentoRef}
              onChange={(e) => onDocumentoRefChange(e.target.value)}
              placeholder="REF-00123"
              className={controlClass}
              disabled={disabled}
            />
          </Campo>

          <Campo label="Comprob." className="w-full sm:w-auto sm:min-w-[10rem] lg:min-w-[9.5rem]">
            <Select value={tipoComprobante} onValueChange={onTipoComprobanteChange} disabled={disabled}>
              <SelectTrigger className={cn(controlClass, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin comprobante</SelectItem>
                <SelectItem value="1">Nota de crédito</SelectItem>
                <SelectItem value="2">Factura</SelectItem>
                <SelectItem value="3">Envio</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
        </div>
      </div>
    </section>
  );
}
