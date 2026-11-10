"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";

interface BranchPaymentMethod {
  branch_id: string;
  is_active: boolean;
  method_id: string; 
  name: string;
  type: string;
}

export function useBranchPaymentMethods(branchId: string | undefined, token: string | null) {
  const [methods, setMethods] = useState<BranchPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"forbidden" | "error" | "not_found" | null>(null);

  const fetchMethods = useCallback(async () => {
    if (!branchId || !token) {
      setMethods([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!api?.paymentMethod?.getBranchPaymentMethods) {
        console.error("SDK Error: api.paymentMethod.getBranchPaymentMethods no está definido.");
        setMethods([]);
        return;
      }

      const response = await api.paymentMethod.getBranchPaymentMethods(branchId, token);

      if (response?.data && Array.isArray(response.data)) {
        const activeMethods = response.data.filter((m: BranchPaymentMethod) => m.is_active);
        setMethods(activeMethods);
      } else {
        setMethods([]);
      }
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      
      if (status === 403 || status === 401) {
        setError("forbidden");
      } else if (status === 404) {
        setError("not_found");
        setMethods([]); 
      } else {
        console.error("Error técnico al cargar métodos:", err);
        setError("error");
        toast.error("Error al sincronizar métodos de la sede");
      }
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, token]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  return { 
    methods: methods || [], 
    loading, 
    error, 
    isEmpty: !loading && (methods?.length === 0 || !methods),
    refresh: fetchMethods 
  };
}