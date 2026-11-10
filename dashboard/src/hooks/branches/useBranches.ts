"use client";

import { api } from "@/lib/sdk-config";
import { PaginatedBranch, Pagination } from "@vitalfit/sdk";
import { useEffect, useState } from "react";

type UseBranchesParams = {
  token: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  location?: string;
};

export function useBranches({
  token,
  page = 1,
  limit = 10,
  search,
  status,
  location,
}: UseBranchesParams) {
  const [data, setData] = useState<Pagination<PaginatedBranch[]> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token){
         return;
    }

    const fetchBranches = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.branch.getBranches(
          {
            page,
            limit,
            search,
            status,
            location,
          },
          token,
        );
        
        setData(response);
      } catch (err) {
        setError("Error al cargar las sucursales");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [token, page, limit, search, status, location]);

  return {
    branches: data?.data ?? [],
    pagination: data,
    isLoading,
    error,
  };
}
