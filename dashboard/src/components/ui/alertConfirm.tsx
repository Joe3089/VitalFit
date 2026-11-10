// components/AlertConfirm.tsx
import React from "react";

interface AlertConfirmProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

const AlertConfirm: React.FC<AlertConfirmProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  type = "danger",
}) => {
  if (!isOpen) {return null;}

  const typeStyles = {
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      icon: "text-red-400",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      icon: "text-yellow-400",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: "text-blue-400",
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 bg-opacity-50 transition-opacity" />

      {/* Contenedor del modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`relative transform overflow-hidden rounded-lg ${styles.bg} px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border ${styles.border}`}
        >
          {/* Icono y contenido */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg
                className={`h-6 w-6 ${styles.icon}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className={`text-lg font-semibold leading-6 ${styles.text}`}>
                {title}
              </h3>
              <div className="mt-2">
                <p className={`text-sm ${styles.text}`}>{message}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto ${styles.button}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>

            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 sm:mt-0 sm:w-auto"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertConfirm;
