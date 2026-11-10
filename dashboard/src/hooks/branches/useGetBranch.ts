"use client";

import { api } from "@/lib/sdk-config";
import { BranchDetails } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

export default function useGetBranch(
  branchId: string | undefined,
  token: string | null
) {
  const [branchDetail, setBranchDetail] = useState<BranchDetails>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranch = useCallback(async () => {

    if (!branchId || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);


      const response = await api.branch.getBranchById(branchId, token);

      if (response) {
        setBranchDetail(response); 
      } else {
        setError("No se encontró el detalle de la sucursal.");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la sucursal.");
    } finally {
      setLoading(false);
    }
  }, [branchId, token]);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  return { branchDetail, loading, error, refetch: fetchBranch };
}