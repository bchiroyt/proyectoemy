import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { rangoFechasMesActual } from "@/lib/reportesMappers";

const fmtIso = (d) => d.toISOString().slice(0, 10);

const presets = [
  {
    id: "hoy",
    label: "Hoy",
    getRange: () => {
      const hoy = fmtIso(new Date());
      return { fechaDesde: hoy, fechaHasta: hoy };
    },
  },
  {
    id: "semana",
    label: "Esta semana",
    getRange: () => {
      const hoy = new Date();
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - hoy.getDay());
      return { fechaDesde: fmtIso(inicio), fechaHasta: fmtIso(hoy) };
    },
  },
  {
    id: "mes",
    label: "Este mes",
    getRange: () => rangoFechasMesActual(),
  },
];

const DateRangeFilter = ({ fechaDesde, fechaHasta, onChange, onClear, showPresets = true }) => {
  const handlePreset = (preset) => {
    onChange(preset.getRange());
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-(--color-gris-letra) mr-1">
        <Calendar className="size-4 text-(--color-pagina)" />
        Período
      </div>

      <Input
        type="date"
        value={fechaDesde}
        onChange={(e) => onChange({ fechaDesde: e.target.value, fechaHasta })}
        className="h-9 w-[140px] border-(--color-gris-claro-2) bg-(--color-blanco) text-sm"
      />
      <span className="text-(--color-gris-letra) text-sm">—</span>
      <Input
        type="date"
        value={fechaHasta}
        onChange={(e) => onChange({ fechaDesde, fechaHasta: e.target.value })}
        className="h-9 w-[140px] border-(--color-gris-claro-2) bg-(--color-blanco) text-sm"
      />

      {showPresets ? (
        <div className="flex flex-wrap gap-1.5 ml-1">
          {presets.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs border-(--color-gris-claro-2) hover:bg-(--color-pagina-4)"
              onClick={() => handlePreset(p)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      ) : null}

      {onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-(--color-gris-letra)"
          onClick={onClear}
          disabled={!fechaDesde && !fechaHasta}
        >
          Limpiar
        </Button>
      ) : null}
    </div>
  );
};

export default DateRangeFilter;
