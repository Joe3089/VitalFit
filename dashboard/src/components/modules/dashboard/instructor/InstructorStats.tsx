"use client";

import {
  Clock,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { useTranslations } from "next-intl";

interface InstructorStatsProps {
  nextClass: string;
  studentCount: any; //
  monthlyCount: any;
  attendanceRate: number;
  studentsToday: number;
}

export function InstructorStats({
  nextClass,
  studentCount,
  monthlyCount,
  attendanceRate,
  studentsToday,
}: InstructorStatsProps) {
  const t = useTranslations("dashboards.InstructorDashboard.stats");
  const tCommon = useTranslations(
    "dashboards.InstructorDashboard.classes_list",
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={t("next_class")}
        value={<span className="truncate block">{nextClass}</span>}
        icon={<Clock className="h-5 w-5 text-blue-600" />}
        description={tCommon("starts")}
      />

      <StatCard
        title={t("students_today_count")}
        value={studentsToday.toString()}
        icon={<Users className="h-5 w-5 text-orange-600" />}
        description={t("students_today_desc")}
      />
      <StatCard
        title={t("attendance_rate")}
        value={`${attendanceRate}%`}
        icon={<Activity className="h-5 w-5 text-emerald-600" />}
        description={
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>{t("attendance_desc")}</span>
          </span>
        }
      />

      <StatCard
        title={t("monthly_classes")}
        value={monthlyCount?.value?.toString() || "0"}
        icon={<GraduationCap className="h-5 w-5 text-purple-600" />}
        description={`${t("meta") || "Meta"}: ${monthlyCount?.target || 0}`}
      />
    </div>
  );
}
