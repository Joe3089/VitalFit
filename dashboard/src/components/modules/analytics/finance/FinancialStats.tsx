"use client";

import { useFinanceReports } from "@/hooks/reports/useFinanceReports";
import { 
  DollarSign, 
  TrendingUp, 
  WalletCards, 
  Building,
  UserIcon
} from "lucide-react"; 
import { ReportStatItem } from "../ReportStatItem";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/ui/StatCard";

interface StatProps {
  token: string | null;
  branchId?: string | undefined; 
}

export function WeeklyRevenueStat({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.finance.stats");
  const { data, isLoading } = useFinanceReports.useWeeklyRevenue(token, branchId);
  
  return (
    <ReportStatItem
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("weekly_revenue")} 
      icon={DollarSign}
      formatType="currency"
    />
  );
}

export function MRRStat({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.finance.stats");
  const { data, isLoading } = useFinanceReports.useMRR(token, branchId);
  
  return (
    <ReportStatItem 
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("mrr")} 
      icon={TrendingUp}
      formatType="currency"
    />
  );
}

export function AccountsReceivableStat({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.finance.stats");
  const { data, isLoading } = useFinanceReports.useAccountsReceivable(token, branchId);
  
  return (
    <ReportStatItem 
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("accounts_receivable")} 
      icon={WalletCards} 
      formatType="currency"
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

export function AverageCLV({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.finance.stats");
  const { data, isLoading } = useFinanceReports.useAverageCLV(token, branchId);
  
  return (
    <ReportStatItem
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("clv")}
      icon={UserIcon}
      formatType="number" 
    />
  );
}