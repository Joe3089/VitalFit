import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { FiscalDocument, PaginatedTotal } from "@vitalfit/sdk";

interface UseFiscalDocumentsProps {
  token: string | null;
  page: number;
  limit?: number;
  filters: { search: string };
}

export function useFiscalDocuments({
  token,
  page,
  limit = 10,
  filters,
}: UseFiscalDocumentsProps) {
  const [data, setData] = useState<FiscalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchDocuments = useCallback(async () => {
    if (!token) {return;}
    

    try {
      setIsLoading(true);
      const response = await api.billing.getFiscalDocuments(token, {
        page,
        limit,
        sort: "desc",
        search: filters.search,
      }) as any; 
      
      const result = response.data; 

      if (result && result.data && Array.isArray(result.data)) {
        setData(result.data);
        const total = result.total || 0;
        setTotalItems(total);
        setTotalPages(Math.ceil(total / limit));
      } else {
        setData([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching fiscal documents:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, limit, filters.search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    data,
    isLoading,
    totalPages,
    totalItems,
    refresh: fetchDocuments,
  };
}