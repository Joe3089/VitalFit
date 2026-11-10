"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users2, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export const ClassCapacityMonitor = ({
  token,
  branchId,
}: {
  token: string | null;
  branchId?: string;
}) => {
  const t = useTranslations("analytics.branch.ClassCapacity");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: upcomingResponse, isLoading: isLoadingClasses } =
    useBranchReport.useUpcomingClasses(token, branchId);

  const { data: ratioResponse, isLoading: isLoadingRatio } =
    useBranchReport.useClassCapacityRatio(token, selectedClassId);

  const classes = upcomingResponse || [];
  const stats = ratioResponse;

  useEffect(() => {
    setSelectedClassId("");
  }, [branchId]);

  const percentage = stats
    ? Math.round((stats.current_count / stats.max_capacity) * 100)
    : 0;
  const availableSlots = stats ? stats.max_capacity - stats.current_count : 0;

  const getStatusStyles = (pct: number) => {
    if (pct >= 100) {
      return {
        color: "bg-slate-950",
        label: t("status.sold_out"),
        text: "text-slate-950",
        border: "border-slate-950/20",
        light: "bg-slate-50",
      };
    }
    if (pct >= 85) {
      return {
        color: "bg-orange-500",
        label: t("status.almost_full"),
        text: "text-orange-600",
        border: "border-orange-200",
        light: "bg-orange-50",
      };
    }
    return {
      color: "bg-emerald-500",
      label: t("status.available"),
      text: "text-emerald-600",
      border: "border-emerald-100",
      light: "bg-emerald-50",
    };
  };

  const status = getStatusStyles(percentage);

  return (
    <Card className="flex flex-col  border-none shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
      <CardHeader className="pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <CardTitle className="text-lg font-bold leading-none">{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
        <div className="shrink-0">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-11">
              <SelectValue
                placeholder={
                  isLoadingClasses
                    ? t("placeholder_loading")
                    : t("placeholder_select")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.class_id} value={cls.class_id} className="cursor-pointer">
                  {cls.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[350px]">
          {!selectedClassId ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
              <Users2 className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {t("empty_state")}
              </p>
            </div>
          ) : isLoadingRatio ? (
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <div className="space-y-3">
                <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
                <Skeleton className="h-4 w-full rounded-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className={cn(
                "flex items-center justify-between p-5 rounded-3xl border transition-colors",
                status.light,
                status.border
              )}>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {t("ratio_label")}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
                      {stats?.current_count}
                    </span>
                    <span className="text-xl font-bold text-slate-400">
                      / {stats?.max_capacity}
                    </span>
                  </div>
                </div>
                <Badge className={cn("px-4 py-1.5 rounded-full font-bold shadow-sm border-none", status.color, "text-white")}>
                  {status.label}
                </Badge>
              </div>
              <div className="space-y-4 px-1">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      {percentage >= 90 ? (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {t("occupied", { percentage })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("font-bold border-2", status.text, status.border)}>
                    {t("free_slots", { count: availableSlots })}
                  </Badge>
                </div>

                <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-200/50 dark:border-slate-700">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", status.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Capacidad Max</p>
                    <p className="text-lg font-black text-slate-700 dark:text-slate-200">{stats?.max_capacity}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Inscritos Hoy</p>
                    <p className="text-lg font-black text-slate-700 dark:text-slate-200">{stats?.current_count}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};