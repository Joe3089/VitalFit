"use client";

import React, { useEffect } from "react"; // Importar useEffect
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { XCircleIcon, BellIcon } from "@heroicons/react/24/solid";

const notificationVariants = cva(
  "fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-md rounded-lg border p-4 text-center shadow-lg transition-opacity duration-300 ease-in-out", // Agregado transition
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-gray-200 bg-white text-black",
        success: "border-gray-200 bg-white text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string;
  description: string;
  onClose?: () => void;
  // Opcional: Prop para controlar el tiempo de auto-cierre, por defecto 4000ms
  autoCloseDuration?: number;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      variant,
      title,
      description,
      onClose,
      autoCloseDuration = 3500,
      ...props
    },
    ref,
  ) => {
    // **Lógica de Desaparición Automática con useEffect**
    useEffect(() => {
      // Solo configuramos el temporizador si se proporciona una función onClose.
      if (onClose) {
        // Establecer un temporizador para llamar a onClose después de autoCloseDuration
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDuration);

        // Función de limpieza: Se ejecuta cuando el componente se desmonta o
        // antes de que el useEffect se vuelva a ejecutar. Esto evita llamadas a
        // onClose si el usuario cierra la notificación manualmente antes.
        return () => clearTimeout(timer);
      }
    }, [onClose, autoCloseDuration]); // Dependencias: Si cambian, el efecto se reinicia

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      >
        {variant === "success" && <BellIcon className="mr-2 h-6 w-6" />}
        {title && (
          <h5 className="mb-1 font-bebas text-xl font-semibold tracking-tight">
            {title}
          </h5>
        )}
        <p className="text-sm">{description}</p>
        {onClose && (
          <button onClick={onClose} className="absolute top-2 right-2 p-1">
            <XCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  },
);
Notification.displayName = "Notification";

export { Notification };
