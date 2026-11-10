"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSalesReports } from "@/hooks/reports/useSalesReports";
import { FranchisePerformanceItem } from "../../analytics/FranchisePerformanceItem";
import { useTranslations } from "next-intl";

interface BranchData {
  label: string;
  percent_change: number;
  status: string;
  trend: string; 
  value: number;
}

interface FranchisePerformanceCardProps {
  token: string | null;
}

export const FranchisePerformanceCard = ({ token }: FranchisePerformanceCardProps) => {

  const t = useTranslations("analytics.Sales.charts.top_branches");
  const { data: response, isLoading } = useSalesReports.useTopBranches(token);

  
  const branches = response;

  const normalizeTrend = (trend: string | number): "up" | "down" | "neutral" => {

  if (trend === "up") {
    return "up";
  }
  if (trend === "down"){
     return "down";
  }

  const val = Number(trend);
  if (isNaN(val) || val === 0) {
    return "neutral";
  }
  return val > 0 ? "up" : "down";
};

  return (
    <Card className="h-full border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t("title")}
        </CardTitle>
        <div className="text-sm text-gray-500">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            t("description", { count: branches?.length ?? 0 })
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          ) : branches && branches.length > 0 ? (
            branches.map((branch, index) => (
              <FranchisePerformanceItem
                key={branch.label + index}
                name={branch.label}
                status={branch.status}
                revenue={Number(branch.value)}
                growth={branch.percent_change}
                trend={normalizeTrend(branch.trend)}
                withBorder={index !== branches.length - 1}
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm italic">
              {t("empty_state")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};