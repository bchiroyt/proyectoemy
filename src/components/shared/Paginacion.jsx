import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Paginacion = ({ from, to, total, onPrev, onNext, disablePrev, disableNext, isLoading }) => {
  return (
    <div className="flex items-center gap-3 text-sm text-(--color-gris-letra) whitespace-nowrap">
      {/* Contador de registros */}
      <span className="tabular-nums font-medium">
        {from}-{to} <span className="mx-1 text-slate-400">/</span> {total}
      </span>

      {/* Botones pegados */}
      <div className="flex -space-x-px">
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-r-none border-(--color-gris-claro-2) bg-(--color-pagina-2)/10 hover:bg-(--color-pagina-2)/20 disabled:opacity-30"
          onClick={onPrev}
          disabled={disablePrev || isLoading}
        >
          <ChevronLeft className="size-4 text-(--color-gris-letra)" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-l-none border-(--color-gris-claro-2) bg-green-800 hover:bg-green-900 text-white disabled:opacity-30"
          onClick={onNext}
          disabled={disableNext || isLoading}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

export default Paginacion;