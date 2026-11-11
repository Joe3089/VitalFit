"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/sdk-config";
import { AddPaymentToInvoicePayload } from "@vitalfit/sdk";
import { trackFunnel } from "@/lib/tracking";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface UseInvoiceConfirmationProps {
  invoiceId: string;
  methodId: string;
  token: string;
  onSuccess: (amountPaid: number, receiptUrl?: string) => void;
}

export const useInvoiceConfirmation = ({
  invoiceId,
  methodId,
  token,
  onSuccess,
}: UseInvoiceConfirmationProps) => {
  const t = useTranslations("Checkout.Notifications");
  const [currencyMode, setCurrencyMode] = useState<string>("USD");

  const [formData, setFormData] = useState({
    amount: 0,
    reference: "",
    filePath: "",
    currency_paid: "USD",
  });

  const [status, setStatus] = useState({ loading: false, error: "" });
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const sizeError = t("fileTooLarge");
      toast.error(sizeError);
      return setStatus((s) => ({ ...s, error: sizeError }));
    }

    setUploadingFile(true);
    setStatus((s) => ({ ...s, error: "" }));

    try {
      const cleanName = file.name
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.-]/g, "");

      const filePath = `receipts/${invoiceId}/${Date.now()}-${cleanName}`;

      if (!supabase) {
        // Fallback storage: ImgBB (images only)
        if (!file.type.startsWith("image/")) {
          throw new Error("Only images can be uploaded without Supabase");
        }
        const body = new FormData();
        body.append("image", file);
        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB}`,
          { method: "POST", body },
        );
        const json = await res.json();
        if (!res.ok || !json?.data?.url) {
          throw new Error("ImgBB upload failed");
        }
        setFormData((prev) => ({ ...prev, filePath: json.data.url }));
        toast.success(t("uploadSuccess"));
        return;
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("vitalfit_file")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from("vitalfit_file")
        .getPublicUrl(uploadData.path);

      if (!publicData?.publicUrl) {
        throw new Error("Public URL generation failed");
      }

      setFormData((prev) => ({ ...prev, filePath: publicData.publicUrl }));
      toast.success(t("uploadSuccess"));
    } catch (err: any) {
      console.error("❌ Error subiendo archivo:", err);
      const friendlyError = t("invoiceErrorDetail");
      toast.error(friendlyError);
      setStatus((s) => ({ ...s, error: friendlyError }));
    } finally {
      setUploadingFile(false);
    }
  };

  const submitPayment = async () => {
    if (formData.amount < 0) {
      toast.warning(t("validationAmount"));
      return;
    }

    if (!formData.reference.trim()) {
      toast.warning(t("validationReference"));
      return;
    }

    if (!methodId) {
      toast.warning(t("validationMethod"));
      return;
    }

    setStatus({ loading: true, error: "" });

    try {
      const payload: AddPaymentToInvoicePayload = {
        amount_paid: Number(formData.amount.toFixed(2)),
        currency_paid: currencyMode,
        invoice_id: invoiceId,
        payment_method_id: methodId,
        receipt_url: formData.filePath || "",
        transaction_id: formData.reference.trim(),
      };

      const response = await api.billing.AddPaymentToInvoice(payload, token);

      if (response) {
        trackFunnel("purchase");
        toast.success(t("paymentSuccess"), {
          description: t("paymentSuccessDetail"),
        });
        onSuccess(payload.amount_paid, payload.receipt_url);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t("invoiceError");
      toast.error(errorMessage);
      setStatus({ loading: false, error: errorMessage });
    } finally {
      setStatus((p) => ({ ...p, loading: false }));
    }
  };

  return {
    currencyMode,
    setCurrencyMode,
    formData,
    setFormData,
    status,
    setStatus,
    uploadingFile,
    handleFileUpload,
    submitPayment,
  };
};
