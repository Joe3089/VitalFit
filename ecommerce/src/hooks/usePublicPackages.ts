import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import type { PackagePublicItem, PublicPaginatedPackage } from "@vitalfit/sdk";

export function usePublicPackages(currency: string) {
  const [packages, setPackages] = useState<PackagePublicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const params = {
          currency,
          limit: 50,
        } as unknown as PublicPaginatedPackage;
        const res = await api.public.getPackages(params);
        setPackages(res.data || []);
      } catch (err) {
        console.error("Error packages:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currency]);

  return { packages, loading };
}
