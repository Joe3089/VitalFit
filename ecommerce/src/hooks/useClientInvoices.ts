import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { ClientInvoice } from "@vitalfit/sdk";

interface UseInvoicesOptions {
  limit?: number;
}

export const useMyInvoices = ({ limit = 10 }: UseInvoicesOptions = {}) => {
  const { token, user } = useAuth();

  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const fetchInvoices = useCallback(async () => {
    if (!token || !user?.user_id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.billing.getClientInvoices(
        token,
        {
          page,
          limit,
          sort,
          search: search || undefined,
        },
        user.user_id,
      );

      console.log("Respuesta API:", response);

      if (Array.isArray(response)) {
        setInvoices(response);
        setTotal(response.length);
      } else {
        setInvoices(response.data || []);
        setTotal(response.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, [token, user?.user_id, page, limit, search, sort]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleSearch = (term: string) => {
    setSearch(term);
    setPage(1);
  };

  return {
    invoices,
    loading,
    error,
    page,
    setPage,
    totalPages: total > 0 ? Math.ceil(total / limit) : 1,
    search,
    setSearch: handleSearch,
    sort,
    setSort,
    refetch: fetchInvoices,
  };
};
