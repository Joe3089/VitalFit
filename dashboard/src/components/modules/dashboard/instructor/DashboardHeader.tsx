"use client";

import { MapPin, CalendarDays } from "lucide-react";
import { SessionUser } from "@/context/AuthContext";
import { BranchStaff } from "@vitalfit/sdk";
import { useTranslations, useLocale } from "next-intl";

interface DashboardHeaderProps {
  user: SessionUser;
  activeBranch?: BranchStaff;
}

export function DashboardHeader({ user, activeBranch }: DashboardHeaderProps) {

  const t = useTranslations("dashboards.InstructorDashboard.header");

  const locale = useLocale();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
        return t("morning");
    }
    if (hour < 18) {
        return t("afternoon");
    }
    return t("night");
  };

  const currentDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight uppercase text-slate-900">
          {getGreeting()}, {user.first_name}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 text-orange-500" />
            <span>{t("active_branch")}</span>
            <span className="font-bold text-slate-700">
              {activeBranch?.name || t("no_branch")}
            </span>
          </div>

          <div className=" items-center gap-1.5 text-sm border-l pl-4 hidden sm:flex">
            <CalendarDays className="size-4 text-orange-500" />
            <span className="capitalize">{currentDate}</span>
          </div>
        </div>
      </div>    
    </div>
  );
}