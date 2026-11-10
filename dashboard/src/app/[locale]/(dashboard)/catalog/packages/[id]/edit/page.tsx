"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { PackageDetail, ServiceFullDetail } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import PackageForm from "../../PackageForm";
import { useTranslations } from "next-intl";

export default function EditPackagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.packages");

  const [packageD, setPackageD] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableServices, setAvailableServices] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    const loadPackage = async () => {
      try {
        setLoading(true);
        const response = await api.packages.getPackageByID(id, token);
        setPackageD(response.data);
      } catch (err: any) {
        console.error("Error cargando paquete:", err);
        setError(t("edit.error_load"));
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [id, token, t]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const response = await api.products.getServices(token, {
          page: 1,
          limit: 100,
        });
        const allServices = response.data.map((s: ServiceFullDetail) => ({
          id: s.service_id,
          name: s.name,
        }));
        setAvailableServices(allServices);
      } catch (err) {
        console.error("Error cargando servicios:", err);
        setServicesError(t("notifications.services_load_error"));
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, [token, t]);

  const handleChange = (data: Partial<PackageDetail>) => {
    setPackageD((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageD || !token) {
      return;
    }

    setIsLoading(true);

    try {
      await api.packages.updatePackage(packageD.packageId, packageD, token);
      toast.success(t("edit.success"));
      setTimeout(() => router.push("/catalog/packages"), 1500);
    } catch (err: any) {
      console.error("Error al guardar paquete:", err);
      toast.error(
        err?.response?.data?.error || t("edit.error_update"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">{t("edit.button_saving")}</div>; // Reusing "Saving" as loading state or adding a load key
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
  if (!packageD) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PageHeader
          title={t("edit.title")}
          subtitle={t("edit.subtitle", { name: packageD.name })}
          actionButton={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.push("/catalog/packages")}
              >
                {t("edit.button_cancel")}
              </Button>
              <Button type="submit" variant="default" disabled={isLoading}>
                {isLoading ? t("edit.button_saving") : t("edit.button_save")}
              </Button>
            </div>
          }
        />

        {servicesError && (
          <div className="text-red-500 mb-2">{servicesError}</div>
        )}

        <PackageForm
          formData={packageD}
          onChange={handleChange}
          mode="edit"
          services={availableServices}
        />
      </form>
    </div>
  );
}
