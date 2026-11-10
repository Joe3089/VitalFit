"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";

export function useGetPaymentMethod(paymentMethodId: string | undefined, token: string | null) {
  const [method, setMethod] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMethod = useCallback(async () => {
    if (!paymentMethodId || !token) {
      setMethod(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.paymentMethod.getPaymentMethodByID(paymentMethodId, token);
      
      if (response?.data) {
        setMethod(response.data);
      }
    } catch (err: any) {
      // Diagnóstico del error
      const status = err.status || err.response?.status;
      
      if (status === 403) {
        console.warn(`Acceso denegado al método de pago: ${paymentMethodId}`);
        setError("forbidden"); // Identificador para manejar en la UI
      } else {
        console.error("Error en useGetPaymentMethod:", err);
        setError(err.message || "Error al cargar el método de pago");
      }
      setMethod(null);
    } finally {
      setLoading(false);
    }
  }, [paymentMethodId, token]);

  useEffect(() => {
    fetchMethod();
  }, [fetchMethod]);

  return { 
    method, 
    loading, 
    error,
    refresh: fetchMethod 
  };
}