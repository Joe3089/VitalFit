import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { MembershipType } from "@vitalfit/sdk";

interface UseMembershipTypesProps {
  token: string;
  initialLimit?: number;
}

export function useMembershipTypes({ token, initialLimit = 10 }: UseMembershipTypesProps) {
  const [data, setData] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: initialLimit,
    search: "",
  });

  const [meta, setMeta] = useState({
    total: 0,
    count: 0,
  });

  const fetchMemberships = useCallback(async () => {
    if (!token) {
        return;
    }

    setLoading(true);
    try {
      const response = await api.membership.getMembershipTypes(token, {
        page: filters.page,
        limit: filters.limit,
        sort: "desc",
        search: filters.search || undefined,
      });

      setData(response.data);
      setMeta({
        total: response.total,
        count: response.count,
      });
    } catch (error: any) {
      console.error("Error fetching memberships:", error);
      toast.error("No se pudieron cargar los tipos de membresía");
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const totalPages = Math.ceil(meta.total / filters.limit);

  const updateSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return {
    memberships: data,
    loading,
    pagination: {
      currentPage: filters.page,
      totalPages,
      totalItems: meta.total,
      count: meta.count,
    },
    updateSearch,
    changePage,
    refresh: fetchMemberships,
  };
}