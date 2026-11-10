"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { CreatePaymentMethod, BranchPaymentVisibility } from "@vitalfit/sdk";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import PaymentForm from "@/components/modules/payment-methods/PaymentForm";

export default function NewPaymentMethodPage() {
  const t = useTranslations("catalog.payment_methods");
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentMethod>({
    method_id: "", 
    name: "",
    display_name: "",
    type: "Transfer", 
    processing_type: "Offline",
    description: "",
    surcharge_fixed: 0,
    surcharge_percentage: 0,
    configuration: {},
    visibility: "All" as BranchPaymentVisibility,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    setErrors({});
    const nameLower = formData.name.toLowerCase();
    const isManualType = formData.type === "Cash" || formData.type === "Card";

    if (!isManualType) {
      const isValidName = 
        nameLower.includes("pago movil") || 
        nameLower.includes("zelle") || 
        nameLower.includes("bank transfer");

      if (!isValidName) {
        const errorMsg = t("errors.invalid_name_format");
        setErrors({ name: errorMsg });
        toast.error(t("notifications.validation_error_title"), { 
          description: errorMsg 
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !validateForm()){
       return;
    }

    try {
      setIsSubmitting(true);
      const config = formData.configuration as any;
      let finalConfig = {};
      let finalType = formData.type;

      if (formData.type === "Transfer" || formData.type === "Other" || formData.name.toLowerCase().includes("zelle")) {
        finalType = "Transfer" as any;
        if (config?.phone) {
          finalConfig = { 
            phone: String(config.phone).trim(), 
            bank_id: String(config.bank_id).trim(), 
            tax_id: String(config.tax_id).trim() 
          };
        } else if (config?.email || formData.name.toLowerCase().includes("zelle")) {
          finalConfig = { email: String(config?.email || "").trim() };
        } else {
          finalConfig = { 
            bank_name: String(config?.bank_name || "").trim(), 
            account_number: String(config?.account_number || "").trim(), 
            tax_id: String(config?.tax_id || "").trim() 
          };
        }
      } else {
        finalConfig = {};
      }

      const payload: CreatePaymentMethod = {
        ...formData,
        method_id: crypto.randomUUID(),
        name: formData.name.trim(),
        display_name: (formData as any).display_name?.trim() || formData.name.trim(),
        type: finalType as any,
        configuration: finalConfig,
        surcharge_fixed: Number(formData.surcharge_fixed) || 0,
        surcharge_percentage: Number(formData.surcharge_percentage) || 0,
      };

      await api.paymentMethod.createPaymentMethod(payload, token);
      toast.success(t("notifications.create_success_title"), {
        description: t("notifications.create_success_description", { name: payload.name }),
      });
      
      setTimeout(() => {
        router.push("/catalog/payment-methods");
        router.refresh();
      }, 1500);

    } catch (error: any) {
    console.error("Error creating payment method:", error);

    const backendError = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.response?.data?.detail;

    toast.error(t("notifications.error_title"), {
      description: backendError || t("notifications.error_description"),
      action: {
        label: t("form.actions.close"), 
        onClick: () => {},
      },
    });
  } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <form onSubmit={handleSubmit}>
        <PageHeader title={t("new.title")}>
          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {t("form.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("new.creating") : t("new.create_button")}
            </Button>
          </div>
        </PageHeader>
        <div className="mt-4 bg-white rounded-xl border p-6 shadow-sm">
          <PaymentForm 
            formData={formData} 
            errors={errors} 
            onChange={(f, v) => setFormData(prev => ({ ...prev, [f]: v }))} 
            mode="create" 
          />
        </div>
      </form>
    </div>
  );
}