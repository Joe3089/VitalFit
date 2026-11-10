"use client";

import { 
  UserIcon,
  UserMinus,
  UsersIcon
} from "lucide-react"; 
import { ReportStatItem } from "../ReportStatItem";
import { StatCard } from "@/components/ui/StatCard";
import { useClientReport } from "@/hooks/reports/useClientReports";
import { useTranslations } from "next-intl";

interface StatProps {
  token: string | null;
  branchId?: string | undefined; 
}

export function TotalClients({ token }: StatProps) {
  const t = useTranslations("analytics.clients.stats");
  const { data, isLoading } = useClientReport.useTotalClients(token);
  
  return (
    <StatCard
      value={data?.toString() ?? "0"} 
      isLoading={isLoading} 
      title={t("total_clients")} 
      icon={<UsersIcon className="h-5 w-5" />}
    />
  );
}

export function ActiveMember({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.clients.stats");
  const { data, isLoading } = useClientReport.useActiveMember(token, branchId);
  
  return (
    <ReportStatItem
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("active_members")}
      icon={UserIcon}
      formatType="number"
    />
  );
}

export function NewClients({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.clients.stats");
  const { data, isLoading } = useClientReport.useNewClients(token, branchId);

  return (
    <ReportStatItem
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("new_clients")}
      icon={UserIcon}
      formatType="number"
    />
  );
} 

export function RetentionRate({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.clients.stats");
  const { data, isLoading } = useClientReport.useRetentionRate(token, branchId);
  
  return (
    <ReportStatItem
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("retention_rate")}
      icon={UserIcon}
      formatType="percentage" 
    />
  );
}

export function ChurnRateKPI({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.clients.stats");
  const { data, isLoading } = useClientReport.useChurnRateKPI(token, branchId);
  
  return (
    <ReportStatItem
      data={data} 
      isLoading={isLoading} 
      defaultTitle={t("churn_rate")} 
      icon={UserMinus} 
      formatType="percentage" 
    />
  );
}