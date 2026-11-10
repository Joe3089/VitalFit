import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { RoleResponse } from "@vitalfit/sdk";

interface UseRolesProps {
  token: string | null;
  page: number;
  pageSize: number;
  search?: string;
}

export function useRoles({ token, page, pageSize, search }: UseRolesProps) {
  const [rolesData, setRolesData] = useState<RoleResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!token) {
        return;
    }

    setIsLoading(true);
    try {
      const response = await api.RBAC.getRoles(
        {
          page,
          limit: pageSize,
          search: search || undefined,
          sort: "desc",
        },
        token
      );

      setRolesData(response.data || []);
      setTotalItems(response.total || response.count || 0);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      setRolesData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, pageSize, search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    rolesData,
    totalItems,
    isLoading,
    refresh: fetchRoles,
  };
}