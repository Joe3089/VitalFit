import { useMemo, useState } from "react";
import { api } from "@/lib/sdk-config";
import { getServiceSchema, ServiceFormData } from "@/lib/validation/serviceSchema";
import { CreateService as CreateServiceType, CreateServiceImage } from "@vitalfit/sdk";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function useServiceForm(token: string | null, onSuccess: () => void) {
  const t = useTranslations("common.Validations");
  const serviceSchema = useMemo(() => getServiceSchema(t), [t]);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    category_id: "",
    duration: "", 
    priority: "5", 
    is_featured: "true", 
    banner_id: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ServiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const result = serviceSchema.safeParse(formData);
    if (!result.success) {
      const errors: any = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const submitService = async (imagesPayload: CreateServiceImage[]) => {
    if (!token) {
      toast.error("Sesión expirada");
      return;
    }

    setIsSubmitting(true);

    const executeSubmit = async () => {
      try {
        const { duration, priority, is_featured, ...rest } = formData;
        const payload: CreateServiceType = {
          ...rest,
          duration: parseInt(duration) || 0, 
          priority: parseInt(priority) || 0,
          is_featured: is_featured === "true", 
          service_images: imagesPayload,    
        };

        await api.products.createService(payload, token);
        onSuccess();
      } finally {
        setIsSubmitting(false); 
      }
    };

    toast.promise(executeSubmit(), {
      loading: "Guardando el servicio...",
      success: "¡Servicio creado con éxito!",
      error: (err) => `Error: ${err.message || "No se pudo crear el servicio"}`,
    });
  };

  return {
    formData,
    handleChange,
    formErrors,
    isSubmitting,
    validate,
    submitService,
  };
}