import { useState } from "react";
import { X } from "lucide-react";

const ModalAgregarSimple = ({ open, onClose, onSave, titulo, placeholder }) => {
  const [valor, setValor] = useState("");

  if (!open) return null;

  const handleSave = () => {
    if (!valor.trim()) return;
    onSave(valor);
    setValor("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg p-6 relative border-t-4 border-(--color-pagina)">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">{titulo}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={placeholder}
          className="w-full border p-3 rounded-lg mb-4"
        />

        <button
          onClick={handleSave}
          className="w-full bg-(--color-pagina-2) text-white py-3 rounded-xl"
        >
          Guardar
        </button>

      </div>
    </div>
  );
};

export default ModalAgregarSimple;