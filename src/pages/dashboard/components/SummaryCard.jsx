import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SummaryCard = ({ title, value, icon, accent = "pagina", className }) => {
  const accentMap = {
    pagina: {
        card: "border-l-(--color-pagina)",
        iconBg: "bg-(--color-rosa-fondo)",
        iconColor: "text-(--color-pagina)"
    },
    pagina2: {
        card: "border-l-(--color-pagina-2)",
        iconBg: "bg-(--color-verde-fondo)",
        iconColor: "text-(--color-pagina-2)"
    },
    rojo: {
        card: "border-l-(--color-rojo)",
        iconBg: "bg-(--color-rojo-fondo)",
        iconColor: "text-(--color-rojo)"
    },
    advertencia: {
        card: "border-l-amber-500",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-500"
    },
  };

  const style = accentMap[accent] ?? accentMap.pagina;

  return (
    <Card
      className={cn(
        "border border-(--color-gris-claro-2) shadow-sm rounded-2xl bg-(--color-blanco) border-l-4 overflow-hidden",
        style.card,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-bold uppercase tracking-wide text-(--color-gris-letra)">
          {title}
        </CardTitle>
        {icon ? (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", style.iconBg, style.iconColor)}>
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-black text-(--color-texto-principal) tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
