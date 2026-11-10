import { api } from "@/lib/sdk-config";
import { BranchInfo } from "@vitalfit/sdk";
import { useEffect, useState, useCallback } from "react";

export function useBranches(token: string | null | undefined) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.public.getBranchMap(token);
      setBranches(response.data || []);
    } catch (err) {
      console.error("Error useBranches:", err);
      setError("No pudimos cargar las sucursales disponibles.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  return { branches, loading, error, refetch: loadBranches };
}
