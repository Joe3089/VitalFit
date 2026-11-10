"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CreatePaymentMethod,
  BranchPaymentVisibility,
} from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import PaymentForm from "@/components/modules/payment-methods/PaymentForm";

export default function EditPaymentMethodPage() {
  const t = useTranslations("catalog.payment_methods");
  const router = useRouter();
  const { id } = useParams();
  const { token } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (id && token) {
      loadPaymentMethod();
    }
  }, [id, token]);

  const loadPaymentMethod = async () => {
    try {
      setIsLoading(true);
      const response = await api.paymentMethod.getPaymentMethodByID(id as string, token!);
      setFormData({
        ...response.data,
        surcharge_fixed: Number(response.data.surcharge_fixed) || 0,
        surcharge_percentage: Number(response.data.surcharge_percentage) || 0,
      });
    } catch (error) {
      toast.error(t("notifications.load_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const nameLower = formData.name.toLowerCase();
      const config = formData.configuration || {};

      let finalConfig: any = {};
      let finalType = formData.type;

      if (nameLower.includes("pago movil") || nameLower.includes("pago móvil")) {
        finalType = "Transfer";
        finalConfig = {
          phone: String(config.phone || "").trim(),
          bank_id: String(config.bank_id || "").trim(),
          tax_id: String(config.tax_id || "").trim(),
        };
      } else if (nameLower.includes("zelle")) {
        finalType = "Transfer";
        finalConfig = {
          email: String(config.email || "").trim().toLowerCase(),
        };
      } else if (finalType === "Transfer") {
        finalConfig = {
          bank_name: String(config.bank_name || "").trim(),
          account_number: String(config.account_number || "").trim(),
          tax_id: String(config.tax_id || "").trim(),
        };
      } else {
        finalConfig = {}; 
      }

      const payload: CreatePaymentMethod = {
        method_id: id as string,
        name: formData.name.trim(),
        display_name: formData.display_name?.trim() || formData.name.trim(),
        type: finalType as any,
        processing_type: formData.processing_type as any,
        visibility: formData.visibility as BranchPaymentVisibility,
        description: formData.description || "",
        surcharge_fixed: Number(formData.surcharge_fixed),
        surcharge_percentage: Number(formData.surcharge_percentage),
        configuration: finalConfig,
      };

      await api.paymentMethod.updatePaymentMethod(id as string, payload, token!);

      toast.success(t("notifications.update_success_title"));
      
      router.push("/catalog/payment-methods");
      router.refresh();

    } catch (error: any) {
      console.error("API ERROR:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Error de red al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) {
    return <div className="p-8 text-center">{t("view.loading")}</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <form onSubmit={handleSubmit}>
        <PageHeader title={t("edit.title")}>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("form.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("edit.saving") : t("edit.save_button")}
            </Button>
          </div>
        </PageHeader>

        <div className="mt-4 bg-white rounded-xl border p-6 shadow-sm">
          <PaymentForm
            mode="edit"
            formData={formData}
            onChange={(field, value) => setFormData((prev: any) => ({ ...prev, [field]: value }))}
          />
        </div>
      </form>
    </div>
  );
}