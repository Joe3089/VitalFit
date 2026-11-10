import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config"; 
import { toast } from "sonner";

export const useClientBalances = (userId: string | undefined, token: string | null) => {
  const [balances, setBalances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchBalances = useCallback(async () => {
    if (!token || !userId){
         return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.products.getClientBalances(token, userId);
      setBalances(response.data || []);
    } catch (err: any) {
      setError(err);
      console.error("Error fetching client balances:", err);
     toast.error("No se pudieron cargar los saldos");
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
};