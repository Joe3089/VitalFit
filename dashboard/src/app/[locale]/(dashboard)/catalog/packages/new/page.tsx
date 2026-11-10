"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { CreatePackagePayload } from "@vitalfit/sdk";
import PackageForm, { PackageFormState } from "../PackageForm";
import { api } from "@/lib/sdk-config";
import { useTranslations } from "next-intl";

import { packageSchema } from "@/lib/validation/package.schema"; 

export default function CreatePackagePage() {
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.packages");

  const [formData, setFormData] = useState<PackageFormState>({
    name: "",
    description: "",
    price: 0,
    startAt: "",
    endAt: "",
    packageItems: [],
  });


  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [availableServices, setAvailableServices] = useState<{ id: string; name: string }[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        setAvailableServices(
          response.data.map((s) => ({ id: s.service_id, name: s.name })),
        );
      } catch (err) {
        console.error("Error cargando servicios:", err);
        setServicesError(t("notifications.services_load_error"));
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, [token, t]);

  const handleChange = (data: Partial<PackageFormState>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    // Limpiar el error del campo que se está editando
    if (Object.keys(data).length > 0) {
      const field = Object.keys(data)[0];
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      return;
    }


    const validation = packageSchema.safeParse(formData);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;

        errors[field] = t(issue.message);
      });
      setFormErrors(errors);
      toast.error(t("form.messages.validation_error"));
      return;
    }

    setFormErrors({});
    setIsLoading(true);
    const toastId = toast.loading(t("create.loading_create"));

    try {
      const payload: CreatePackagePayload = {
        name: validation.data.name,
        description: validation.data.description,
        price: validation.data.price,
        startAt: validation.data.startAt,
        endAt: validation.data.endAt,
        packageItems: validation.data.packageItems.map(
          ({ serviceId, sessionsIncluded }) => ({
            serviceId,
            sessionsIncluded,
          }),
        ),
      };

      await api.packages.createPackage(payload, token);

      toast.success(t("create.success"), { id: toastId });
      setTimeout(() => router.push("/catalog/packages"), 1500);
    } catch (err: unknown) {
      console.error("Error creando paquete:", err);
      toast.error(t("create.error_create"), { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingServices) {
    return <div className="p-10 flex justify-center italic text-slate-500">{t("create.loading_services")}...</div>;
  }

  if (servicesError) {
    return <div className="p-10 text-red-500 font-bold text-center">{servicesError}</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <form onSubmit={handleSubmit} className="space-y-8">
        <PageHeader
          title={t("create.title")}
          subtitle={t("create.subtitle")}
        />

        <PackageForm
          formData={formData}
          onChange={handleChange}
          mode="edit"
          services={availableServices}
          errors={formErrors} 
        />

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
           <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isLoading}
            className="px-8 h-12 rounded-xl"
           >
              {t("form.buttons.cancel")}
           </Button>
           <Button
            type="submit"
            disabled={isLoading}
            className="px-10 h-12 rounded-xl bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold transition-all active:scale-95 shadow-lg shadow-orange-100"
          >
            {isLoading ? t("create.button_creating") : t("create.button_create")}
          </Button>
        </div>
      </form>
    </div>
  );
}