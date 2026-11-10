import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";

export function useExchangeRate(token: string | null, currencyCode: string) {
  const [rate, setRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRate = useCallback(async () => {

    if (currencyCode === "USD") {
      setRate(1);
      return;
    }

    if (!token || !currencyCode) {
      setRate(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.billing.getExchangeRate(token, currencyCode);

      const exchangeValue = Number(response[currencyCode as keyof typeof response]);

      setRate(isNaN(exchangeValue) ? 0 : exchangeValue);
    } catch (error) {
      console.error(`Error obteniendo tasa para ${currencyCode}:`, error);
      setRate(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, currencyCode]);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return {
    rate,
    isLoading,
    refresh: fetchRate,
  };
}