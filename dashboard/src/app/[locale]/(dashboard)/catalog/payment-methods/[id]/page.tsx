"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Pencil, ChevronLeft } from "lucide-react";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentForm from "@/components/modules/payment-methods/PaymentForm";

export default function PaymentMethodDetailPage() {
  const t = useTranslations("catalog.payment_methods");
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);

  const loadPaymentMethod = useCallback(async () => {
    if (!token || !id) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.paymentMethod.getPaymentMethodByID(
        id as string,
        token
      );

      if (response.data) {
        setFormData({
          ...response.data,
        });
      } else {
        throw new Error("No data found");
      }
    } catch (error) {
      console.error("Error loading payment method:", error);
      toast.error(t("notifications.load_error"));
      router.push("/catalog/payment-methods");
    } finally {
      setLoading(false);
    }
  }, [id, token, t, router]);

  useEffect(() => {
    loadPaymentMethod();
  }, [loadPaymentMethod]);

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <div className="mt-8 bg-white rounded-xl border p-6 shadow-sm space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <PageHeader title={t("view.title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/catalog/payment-methods")}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("form.actions.back")}
          </Button>

          <Button
            onClick={() => router.push(`/catalog/payment-methods/${id}/edit`)}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            {t("form.actions.edit")}
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="mb-6 border-b pb-4 flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-foreground">
                    {formData.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                    ID: {formData.method_id}
                </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase border bg-secondary/50">
                {t(`table.types.${formData.type.toLowerCase()}`)}
            </span>
        </div>

        <PaymentForm 
          formData={formData} 
          onChange={() => {}} 
          mode="view" 
        />
      </div>
    </div>
  );
}