import { api } from "@/lib/sdk-config";
import { Banner, ServiceCategoryInfo, ServiceFullDetail } from "@vitalfit/sdk";
import { useEffect, useState } from "react";

export function useEditServiceData(serviceId: string, token: string | null) {
  const [data, setData] = useState<{
    service: ServiceFullDetail | null;
    categories: ServiceCategoryInfo[];
    banners: Banner[];
  }>({ service: null, categories: [], banners: [] });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token || !serviceId) {
        return;
      }
      
      try {
        const [srvRes, catsRes, bansRes] = await Promise.all([
          api.products.getServiceByID(serviceId, token),
          api.products.getCategories(token),
          api.marketing.getBanner(token),
        ]);
        
        const serviceData = srvRes.data || srvRes.data; 
        setData({
          service: serviceData,
          categories: catsRes.data || [],
          banners: bansRes.data || [],
        });
      } catch (error) {
        console.error("Error loading edit data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceId, token]);

  return { ...data, isLoading };
}