import { useState, useEffect, useMemo, useRef } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BuscadorCombo({
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

  // Cerrar el menú al hacer click fuera
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
              Sin coincidencias
            </div>
          ) : (
            <div className="py-1">
              {matches.map((item, idx) => {
                const isSelected = selectedItem && String(item[idField]) === String(selectedItem[idField]);
                return (
                  <div
                    key={item[idField]}
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
