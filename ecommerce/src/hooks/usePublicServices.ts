import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import type { ServicePublicItem, PublicPaginationService } from "@vitalfit/sdk";

export function usePublicServices(currency: string) {
  const [services, setServices] = useState<ServicePublicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = {
          currency,
          limit: 50,
        } as unknown as PublicPaginationService;
        const res = await api.public.getServices(params);
        setServices(res.data || []);
      } catch (err) {
        console.error("Error services:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currency]);

  return { services, loading };
}
