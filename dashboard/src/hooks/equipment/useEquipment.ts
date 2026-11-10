import { api } from "@/lib/sdk-config";
import { Equipment, EquipmentCategory } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

interface Filters {
  search?: string;
  category?: EquipmentCategory;
}

export function useEquipment(token: string | null, filters: Filters, page: number) {
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await api.equipment.getEquipment(token, {
        limit: pageSize,
        page: page, 
        sort: "desc",
        search: filters.search || undefined,
        category: filters.category,
      });

      setEquipmentData(result.data || []); 
      setTotalItems(result.total || 0);

    } catch (error) {
      console.error("Error cargando equipamiento:", error);
      setEquipmentData([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, filters.search, filters.category]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    equipmentData,
    isLoading,
    totalItems,
    pageSize,
    totalPages: Math.ceil(totalItems / pageSize),
    refresh: loadData
  };
}