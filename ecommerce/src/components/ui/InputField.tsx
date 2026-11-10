import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ type, label, helperText, error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === "password";

    const inputType = isPasswordType
      ? showPassword
        ? "text"
        : "password"
      : type;

    const togglePasswordVisibility = () => {
      if (isPasswordType) {
        setShowPassword((prev) => !prev);
      }
    };

    let paddingRightClass = "pr-3";
    if (isPasswordType && error) {
      paddingRightClass = "pr-14";
    } else if (isPasswordType || error) {
      paddingRightClass = "pr-10";
    }

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium",
              error ? "text-red-600" : "text-gray-800",
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            type={inputType}
            ref={ref}
            {...props}
            className={cn(
              "w-full rounded-lg border py-2 text-sm transition duration-150 focus:outline-none",
              "pl-3",
              paddingRightClass,
              error
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500",
              className,
            )}
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
            {isPasswordType && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="cursor-pointer text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
            {error && <AlertCircle className="text-red-500" size={18} />}
          </div>
        </div>

        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
