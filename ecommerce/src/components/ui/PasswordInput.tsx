"use client";

import React, { forwardRef, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"; // Importamos de Heroicons

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Etiqueta accesible alternativa para el input (se aplica como aria-label) */
  ariaLabel?: string;
  /** Clase adicional para el input (Tailwind u otras utilidades) */
  className?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ariaLabel, className, ...props }, ref) => {
    // Estado para manejar si la contraseña se muestra en texto o en modo password
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full max-w-lg">
        {/* Campo de entrada (input) para la contraseña */}
        <input
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"} // Cambia dinámicamente según el estado
          aria-label={ariaLabel}
          value={props.value}
          onChange={props.onChange}
          className={`w-full px-4 py-2 border rounded-lg border-[#A4A4A4] 
            focus:border-[#F27F2A] focus:ring-[#F27F2A] 
            focus:outline-none text-[#1A1A1A] text-auto transition-colors duration-200 ${className}`}
        />

        {/* Botón con el ícono de ojo (sirve para alternar visibilidad) */}
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)} // Cambia el estado al hacer click
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
        >
          {showPassword ? (
            // Icono Heroicons: ojo abierto
            <EyeIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            // Icono Heroicons: ojo tachado
            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

// Nombre explícito del componente (buena práctica cuando usamos forwardRef)
PasswordInput.displayName = "PasswordInput";

// Exportamos el componente para poder usarlo en cualquier parte del proyecto
export default PasswordInput;
