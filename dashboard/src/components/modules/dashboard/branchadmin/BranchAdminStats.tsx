"use client";

import { useFinanceReports } from "@/hooks/reports/useFinanceReports";
import { 
  DollarSign, 
  Building,
  Percent
} from "lucide-react"; 
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/ui/StatCard";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { ReportStatItem } from "../../analytics/ReportStatItem";
import { useMemo } from "react";

interface StatProps {
  token: string | null;
  branchId?: string | undefined; 
}

export function MonthlySalesKPI({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.Sales.stats");
  const { data, isLoading } = useBranchReport.useMonthlySalesKPI(token, branchId);
  
  const mappedData = useMemo(() => {
    if (!data) {
      return null;
    }
    return {
      ...data,
      title: t("monthly_sales")
    };
  }, [data, t]);

  return (
    <ReportStatItem
      data={mappedData} 
      isLoading={isLoading} 
      defaultTitle={t("monthly_sales")} 
      icon={DollarSign}
      formatType="currency"
    />
  );
}

export function OccupancyKPI({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.branch.Occupancy.stats");
  const { data, isLoading } = useBranchReport.useOccupancyKPI(token, branchId);
  
  const mappedData = useMemo(() => {
    if (!data){
       return null;
    }
    return {
      ...data,
      title: t("average_occupancy")
    };
  }, [data, t]);

  return (
    <ReportStatItem
      data={mappedData} 
      isLoading={isLoading} 
      defaultTitle={t("average_occupancy")} 
      icon={Percent}
      formatType="percentage"
    />
  );
}

export function ActiveBranchesCount({ token }: StatProps) {
  const t = useTranslations("analytics.finance.stats");
  const { data, isLoading } = useFinanceReports.useActiveBranches(token);

  return (
    <StatCard 
      value={data ?? 0}
      isLoading={isLoading} 
      title={t("active_branches")} 
      icon={<Building className="h-5 w-5" />} 
    />
  );
}
