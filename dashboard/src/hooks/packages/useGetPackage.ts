import { api } from "@/lib/sdk-config";
import { PackageDetail } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

export default function useGetPackage(
  packageId: string | undefined,
  token: string | null
) {
  const [packageDetail, setPackageDetail] = useState<PackageDetail>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackage = useCallback(async () => {

    if (!packageId || !token) {
        return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.packages.getPackageByID(packageId, token);

      if (response?.data) {
        setPackageDetail(response.data);
      } else {
        setError("No se encontró el detalle del paquete.");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el paquete.");
    } finally {
      setLoading(false);
    }
  }, [packageId, token]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  return { packageDetail, loading, error, refetch: fetchPackage };
}
