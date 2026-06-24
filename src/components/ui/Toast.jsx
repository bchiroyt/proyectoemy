import { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const tipos = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    clases: "bg-green-500",
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    clases: "bg-red-500",
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5" />,
    clases: "bg-yellow-500",
  },
};

const posiciones = {
  "top-right": "top-5 right-5 animate-in slide-in-from-right duration-300",
  "bottom-right": "bottom-5 right-5 animate-in slide-in-from-bottom duration-300",
  "bottom-center": "bottom-5 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom duration-300",
};

const Toast = ({
  open,
  message,
  type = "success",
  onClose,
  duration = 3000,
  position = "top-right",
}) => {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, open, onClose]);

  if (!open) return null;
  return (
    <div className={`fixed z-[9999] ${posiciones[position] || posiciones["top-right"]}`}>
      <div
        className={`
          ${tipos[type]?.clases}
          text-white
          px-5
          py-4
          rounded-2xl
          shadow-2xl
          flex
          items-center
          gap-3
          min-w-[320px]
        `}
      >
        {tipos[type]?.icon}

        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
