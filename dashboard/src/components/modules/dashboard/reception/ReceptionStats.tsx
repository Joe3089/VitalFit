"use client";

import { useTranslations } from "next-intl";
import { StatCard } from "@/components/ui/StatCard";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { Users } from "lucide-react";

interface StatProps {
  token: string | null;
  branchId?: string | undefined;
}

export function OccupancyStat({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.branch.Occupancy");
  const { data: response, isLoading } = useBranchReport.useCurrentOccupancyPercent(token, branchId);

  const occupancyValue = response ? Number(response) : 0;

  return (
    <StatCard
      title={t("stats.current_occupancy")}
      isLoading={isLoading}
      value={`${occupancyValue}%`}
      icon={<Users className="h-4 w-4 text-muted-foreground" />}
      trend={{
        value: "",
        isPositive: true,
        label: t("stats.real_time") 
      }}
    />
  );
}

export function CheckInsToday({ token, branchId }: StatProps) {
  const t = useTranslations("analytics.branch.Occupancy");
  const { data: response, isLoading } = useBranchReport.useCheckInsToday(token, branchId);

  const checkValue = response ? Number(response) : 0;

  return (
    <StatCard
      title={t("stats.checkins_today")}
      isLoading={isLoading}
      value={checkValue}
      icon={<Users className="h-4 w-4 text-muted-foreground" />}
      trend={{
        value: "",
        isPositive: true,
        label: t("stats.real_time") 
      }}
    />
  );
}