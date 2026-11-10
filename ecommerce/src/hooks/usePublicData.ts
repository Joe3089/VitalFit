import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import type {
  ServicePublicItem,
  PackagePublicItem,
  PublicMembershipResponse,
  PublicPaginationService,
  PublicPaginatedPackage,
} from "@vitalfit/sdk";

export function usePublicData(currency: string = "USD", token?: string) {
  const [data, setData] = useState({
    services: [] as ServicePublicItem[],
    packages: [] as PackagePublicItem[],
    memberships: [] as PublicMembershipResponse[],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const serviceParams = {
          currency,
          limit: 50,
          page: 1,
        } as unknown as PublicPaginationService;

        const packageParams = {
          currency,
          limit: 50,
          page: 1,
        } as unknown as PublicPaginatedPackage;

        const [servicesRes, packagesRes, membershipsRes] = await Promise.all([
          api.public.getServices(serviceParams),
          api.public.getPackages(packageParams),
          api.membership.publicGetMemberships(
            token || "",
            { limit: 50, page: 1 },
            currency,
          ),
        ]);

        setData({
          services: servicesRes.data || [],
          packages: packagesRes.data || [],
          memberships: membershipsRes.data || [],
        });
      } catch (err) {
        console.error("Error en usePublicData:", err);
        setError(
          "No pudimos actualizar el catálogo. Por favor, intenta de nuevo.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [currency, token]);

  return {
    ...data,
    loading,
    error,
    hasData: data.memberships.length > 0 || data.packages.length > 0,
  };
}
