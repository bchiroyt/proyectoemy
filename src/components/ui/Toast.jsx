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

const Toast = ({ open, message, type = "success", onClose }) => {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed top-5 right-5 z-[9999] animate-in slide-in-from-right duration-300">
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