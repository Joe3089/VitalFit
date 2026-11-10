"use client";

import { useFinanceReports } from "@/hooks/reports/useFinanceReports";
import { BillingMatrixTable } from "./BillingMatrixTable";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface BillingMatrixReportProps {
  token: string;
  startDate?: string; 
  endDate?: string;   
}

export function BillingMatrixReport({ 
  token, 
  startDate, 
  endDate 
}: BillingMatrixReportProps) {
  const t = useTranslations("analytics.finance.billing_matrix");

  const { data, isLoading, error } = useFinanceReports.useBillingMatrix(
    token, 
    startDate, 
    endDate
  );

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center text-destructive">
          {t("error")}
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <BillingMatrixTable
        data={data}
        isLoading={isLoading}
      />
    </section>
  );
}