import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { User } from "@vitalfit/sdk";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export interface ClientFromAPI extends User {
  role_name: string;
  is_validated: boolean;
  identity_document: string;
}

interface APIResponse {
  data: ClientFromAPI[];
  count: number;
  total: number;
  next: string | null;
  previous: string | null;
}

export function useClients({ token, initialLimit = 10 }: { token: string | null; initialLimit?: number }) {
  const t = useTranslations("clients");

  const [data, setData] = useState<ClientFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({ search: "", role: "all" });
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });

  const loadStats = useCallback(async () => {
    if (!token) {
        return;
    }
    try {
      const response = await api.user.getClientUsers(token, { limit: 10 }) as unknown as APIResponse;
      const all = response.data || [];
      
      setStats({
        total: response.total || all.length,
        active: all.filter(u => u.is_validated === true).length,
        blocked: all.filter(u => u.is_validated === false).length
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [token]);

  const loadClients = useCallback(async () => {
    if (!token) {
        return;
    }
    setIsLoading(true);

    try {
      const options = {
        search: filters.search.trim() || undefined, 
        page: page,
        limit: initialLimit,
        sort: "desc" as const,
        role: filters.role === "all" ? undefined : filters.role
      };

      const response = await api.user.getClientUsers(token, options as any) as unknown as APIResponse;
      
      setData(response.data || []);
      setTotalItems(response.total || 0);

      if (!filters.search) {
        loadStats();
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error(t("notifications.load_error"));
    } finally {
      setIsLoading(false);
    }
  }, [token, page, filters.search, filters.role, initialLimit, loadStats, t]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.role]);

  const totalPages = Math.max(1, Math.ceil(totalItems / initialLimit));

  return {
    data,
    isLoading,
    pagination: {
      page,
      limit: initialLimit,
      totalItems,
      totalPages,
      onPageChange: (p: number) => setPage(p)
    },
    filters,
    onFilterChange: (f: Partial<typeof filters>) => setFilters(prev => ({ ...prev, ...f })),
    stats,
    reload: loadClients
  };
}