import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { InvoiceDetail } from "@vitalfit/sdk";

export const useInvoiceDetail = (invoiceId: string) => {
  const { token } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!token || !invoiceId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.billing.getInvoiceByID(invoiceId, token);
      console.log(response.data);
      setInvoice(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la factura.");
    } finally {
      setLoading(false);
    }
  }, [token, invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice,
  };
};
