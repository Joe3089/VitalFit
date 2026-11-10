import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { User } from "@vitalfit/sdk";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// 1. Actualizamos la interfaz para incluir opciones de paginación
interface UserFilters {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}

export function useStaffUsers(token: string | null, filters: UserFilters = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0); // Útil para la paginación de la UI
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("user.management");

  const { search, role, page = 1, limit = 10, sort = "desc" } = filters;

  const fetchUsers = useCallback(async (isManualRefresh = false) => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let toastId: string | number | undefined;
    if (isManualRefresh) {
      toastId = toast.loading(t("notifications.refresh_loading"));
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.user.getStaffUsers(
        {
          page,
          limit,
          sort,
          search: search || undefined,
          role: role || undefined,
        },
        token
      );
      
      setUsers(response.data || []);

      if ("total" in response) {
        setTotalItems((response as any).total || 0);
      }

      if (isManualRefresh) {
        toast.success(t("notifications.refresh_success"), { id: toastId });
      }
    } catch (err) {
      console.error("Error loading users:", err);
      const message = t("notifications.error_list_load");
      setError(message);

      toast.error(t("notifications.error_load_title"), {
        description: message,
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, search, role, page, limit, sort, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    totalItems,
    isLoading,
    error,
    refresh: () => fetchUsers(true),
  };
}