"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA lista, scope:", reg.scope))
        .catch((err) => console.error("Error PWA:", err));
    }
  }, []);

  return null;
}
