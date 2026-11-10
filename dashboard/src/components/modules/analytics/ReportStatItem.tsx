import { StatCard } from "@/components/ui/StatCard";
import { formatKPICardData, FormatType } from "@/utils/formatters";
import { LucideIcon } from "lucide-react";

interface ReportStatItemProps {
  data: any;
  isLoading: boolean;
  defaultTitle: string;
  icon: LucideIcon;
  formatType?: FormatType;
}

export const ReportStatItem = ({
  data,
  isLoading,
  defaultTitle,
  icon: Icon,
  formatType = "currency", 
}: ReportStatItemProps) => {

  const formatted = formatKPICardData(data, formatType);

  return (
    <StatCard
      title={defaultTitle || formatted?.title}
      value={isLoading ? "..." : formatted?.displayValue || "0"}
      isLoading={isLoading}
      icon={<Icon className="h-5 w-5 text-gray-400" />}
      trend={{
        value: formatted?.displayTrend || 0,
        isPositive: formatted?.is_positive,
        label: formatted?.trend_label,
      }}
    />
  );
};
