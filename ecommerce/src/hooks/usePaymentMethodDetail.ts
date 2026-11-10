import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import { PaymentMethod } from "@vitalfit/sdk";

export function usePaymentMethodDetail(methodId: string, token: string) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!methodId || !token) {
      return;
    }
    api.paymentMethod
      .getPaymentMethodByID(methodId, token)
      .then((res) => setMethod(res.data))
      .finally(() => setLoading(false));
  }, [methodId, token]);

  return { method, loading };
}
