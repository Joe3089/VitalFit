import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { InstructorDataList } from "@vitalfit/sdk";
import { toast } from "sonner";

interface InstructorFilters {
  search?: string;
  sort?: "asc" | "desc";
  identity_doc?: string;
  limit?: number; 
  skipSummary?: boolean; 
}

export function useInstructors(token: string | null, page: number, filters: InstructorFilters) {
  const [data, setData] = useState<InstructorDataList[]>([]);
  const [summary, setSummary] = useState<{ total: number; actives: number; blocked: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const limit = filters.limit || 10;

  const loadData = useCallback(async (isManual = false) => {
    if (!token){
       return;
    }

    let toastId;
    if (isManual) {
      toastId = toast.loading("Actualizando instructores...");
    }
    
    setIsLoading(true);
    try {
      const promises: [Promise<any>, Promise<any> | null] = [
        api.instructor.getInstructors({ 
          limit, 
          page, 
          search: filters.search || undefined,
          sort: filters.sort || "desc",
          identity_doc: filters.identity_doc || undefined
        }, token),
        filters.skipSummary ? null : api.instructor.getSummary(token)
      ];

      const [instructorsRes, summaryRes] = await Promise.all(promises);

      setData(instructorsRes.data || []);
      setTotalItems(instructorsRes.total || 0); 
      
      if (summaryRes) {
        setSummary(summaryRes.data ?? null);
      }

      if (isManual) {
        toast.success("Sincronizado", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  }, [token, page, filters.search, filters.sort, filters.identity_doc, filters.skipSummary, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    summary,
    isLoading,
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1,
    refresh: () => loadData(true),
  };
}