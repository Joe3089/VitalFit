"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGetPaymentMethod } from "@/hooks/payment-methods/useGetPaymentMethod";
import { useTranslations } from "next-intl";

export function PaymentMethodCell({ methodId }: { methodId: string }) {
  const t = useTranslations("finance.Billing.methodCell");
  const { token } = useAuth();
  const { method, loading } = useGetPaymentMethod(methodId, token);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!method) {
    return (
      <Badge variant="secondary" className="font-normal capitalize px-2 py-0">
        {t("notAvailable")}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {method.type === "card" ? (
        <CreditCard className="h-3 w-3 text-primary" />
      ) : (
        <Wallet className="h-3 w-3 text-primary" />
      )}
      <span className="text-xs font-medium">
        {method.card_brand 
          ? `${method.card_brand.toUpperCase()} •• ${method.last4}` 
          : method.name}
      </span>
    </div>
  );
}