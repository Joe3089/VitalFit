import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import { ServiceCategoryInfo, Banner } from "@vitalfit/sdk";

export function useServiceData(token: string | null) {
  const [categories, setCategories] = useState<ServiceCategoryInfo[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [categoriesResponse, bannersResponse] = await Promise.all([
          api.products.getCategories(token),
          api.marketing.getBanner(token),
        ]);
        setCategories(categoriesResponse.data || []);
        setBanners(bannersResponse.data || []);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [token]);

  return { categories, banners, isLoading };
}