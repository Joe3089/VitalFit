import { api } from "@/lib/sdk-config";
import { PaymentMethod } from "@vitalfit/sdk";
import { useEffect, useState } from "react";

export function usePaymentMethod(paymentMethodId?: string, token?: string) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentMethodId || !token) {
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.paymentMethod.getPaymentMethodByID(
          paymentMethodId,
          token,
        );
        setPaymentMethod(res.data || null);
      } catch (err) {
        setError("Error cargando método de pago");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [paymentMethodId, token]);

  return { paymentMethod, isLoading, error };
}
