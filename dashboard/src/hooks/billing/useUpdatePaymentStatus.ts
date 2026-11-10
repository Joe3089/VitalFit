"use client";

import { useState } from "react";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";

export type PaymentStatus = "Completed" | "Failed" | "Refunded" | "Pending";

export function useUpdatePaymentStatus() {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (
    paymentId: string,
    status: PaymentStatus,
    token: string
  ) => {
    setLoading(true);
    try {
      await api.billing.updatePaymentStatus(paymentId, status, token);

      const statusLabels = {
        Completed: "Completado",
        Failed: "Fallido",
        Refunded: "Reembolsado",
        Pending: "Pendiente",
      };

      toast.success(`Pago actualizado a ${statusLabels[status]}`);
      return { success: true };
    } catch (error: any) {
      console.error("Error al actualizar estado del pago:", error);
      toast.error(error.message || "No se pudo actualizar el estado");
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateStatus,
    loading,
  };
}
