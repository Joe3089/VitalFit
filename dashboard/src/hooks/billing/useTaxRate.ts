import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";

export function useTaxRate(branchId: string | undefined, token: string | null) {
  const [taxData, setTaxData] = useState<{ rate: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTaxRate = useCallback(async () => {
    if (!branchId || !token) {
      setTaxData(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.billing.getTaxRateByBranch(token, branchId);

      const rateStr = (response as any).tax_rate || "0";
      const rateNum = parseFloat(rateStr);

      setTaxData({
        rate: rateNum,
        name: "IVA" 
      });
    } catch (error) {
      console.error("Error fetching tax rate:", error);
      setTaxData({ rate: 0, name: "Impuesto" });
    } finally {
      setIsLoading(false);
    }
  }, [branchId, token]);

  useEffect(() => {
    fetchTaxRate();
  }, [fetchTaxRate]);

  return {
    taxRate: taxData,
    isLoading,
    refresh: fetchTaxRate,
  };
}