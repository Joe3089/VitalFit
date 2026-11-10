import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";

export const useTax = (branchId: string | null, token: string | null) => {
  const [taxRate, setTaxRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTax = async () => {
      if (!branchId || !token) {
        return;
      }

      setLoading(true);
      try {
        const res = await api.billing.getTaxRateByBranch(token, branchId);

        let rate = Number(res.tax_rate || "0");
        if (rate > 1) {
          rate = rate / 100;
        }

        setTaxRate(rate);
      } catch (err) {
        console.error("Error fetching tax:", err);
        setTaxRate(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTax();
  }, [branchId, token]);

  return { taxRate, loading };
};
