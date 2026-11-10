"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          "border rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary pr-10",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-300 focus:border-[#F27F2A]",
          className,
        )}
      />
    );
  },
);

Input.displayName = "Input";
