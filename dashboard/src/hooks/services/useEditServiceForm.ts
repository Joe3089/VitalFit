import { api } from "@/lib/sdk-config";
import { getServiceSchema, ServiceFormData } from "@/lib/validation/serviceSchema";
import { UpdateServiceImageManual, UpdateServiceManual } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export function useEditServiceForm(serviceId: string, token: string | null, onSuccess: () => void) {
  const t = useTranslations("common.Validations");
  const schema = useMemo(() => getServiceSchema(t), [t]);

  // Mantenemos strings para la UI
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    duration: "", 
    priority: "", 
    is_featured: "false", 
    banner_id: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fillForm = useCallback((service: any) => {
  if (!service) return;

  setFormData({
    name: service.name || "",
    description: service.description || "",
    category_id: service.category_id || "",
    duration: (service.duration_minutes || service.duration)?.toString() || "",
    priority: (service.priority_score || service.priority)?.toString() || "",

    is_featured: service.is_featured === true || service.is_featured === "true" ? "true" : "false",
    
    banner_id: service.banners?.[0]?.banner_id || service.banner_id || "",
  });
}, []);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof ServiceFormData]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  const submitUpdate = async (images: UpdateServiceImageManual[]) => {
    if (!token) {
      toast.error("Sesión expirada");
      return;
    }
    
    setIsSubmitting(true);

    const executeSubmit = async () => {
      try {
        const { duration, priority, is_featured, banner_id, ...rest } = formData;
        
        // CONSTRUCCIÓN DEL PAYLOAD EXACTO PARA EL BACKEND
        const payload: UpdateServiceManual = {
          ...rest,
          // banner_id: string o undefined
          banner_id: banner_id || undefined,
          // duration: number (parseInt garantiza que sea el tipo correcto)
          duration: parseInt(duration) || 0,
          // priority: number
          priority: parseInt(priority) || 0,
          // is_featured: boolean real (comparación estricta)
          is_featured: String(is_featured) === "true", 
          // service_images: array de objetos según el esquema
          service_images: images,
        };
        
        await api.products.updateService(serviceId, payload, token);
        onSuccess(); // Aquí se debe ejecutar router.refresh() en el componente
      } finally {
        setIsSubmitting(false);
      }
    };

    toast.promise(executeSubmit(), {
      loading: "Actualizando el servicio...",
      success: "¡Servicio actualizado con éxito!",
      error: (err) => `Error: ${err.message || "No se pudo actualizar"}`,
    });
  };

  const validate = () => {
    const result = schema.safeParse(formData);
    if (!result.success) {
      const errors: any = {};
      result.error.issues.forEach((i) => {
        if (i.path[0]) errors[i.path[0] as string] = i.message;
      });
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  return { 
    formData, 
    handleChange, 
    formErrors, 
    isSubmitting, 
    validate, 
    submitUpdate, 
    fillForm 
  };
}