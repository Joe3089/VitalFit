"use client";

import React, { forwardRef } from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta accesible alternativa para el input (se aplica como aria-label) */
  ariaLabel?: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ ariaLabel, className = "", value, onChange, ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        type={props.type ?? "text"} // Por defecto es "text", pero puedes sobrescribirlo
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-lg border-[#A4A4A4]
          focus:border-[#F27F2A] focus:ring-[#F27F2A]
          focus:outline-none text-[#1A1A1A] text-auto transition-colors duration-200 ${className}`}
      />
    );
  },
);

TextInput.displayName = "TextInput";
export default TextInput;
