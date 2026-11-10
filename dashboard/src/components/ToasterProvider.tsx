"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      duration={4000}
      toastOptions={{
        classNames: {
          success: "bg-green-600 text-white font-semibold px-4 py-2 rounded",
          error: "bg-red-600 text-white font-semibold px-4 py-2 rounded",
        },
      }}
    />
  );
}
