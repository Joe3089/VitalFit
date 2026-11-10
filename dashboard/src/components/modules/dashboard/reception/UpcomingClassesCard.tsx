"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Users,
  User2,
  CalendarDays,
  Timer,
  Activity,
} from "lucide-react";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { format, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const dateLocales = {
  es: es,
  en: enUS,
};

export const UpcomingClassesCard = ({
  token,
  branchId,
}: {
  token: string | null;
  branchId?: string;
}) => {
  const t = useTranslations("analytics.branch.UpcomingClasses");
  const locale = useLocale() as keyof typeof dateLocales;

  const { data: response, isLoading } = useBranchReport.useUpcomingClasses(
    token,
    branchId,
  );

  const todayClasses = useMemo(() => {
    if (!response) {
      return [];
    }
    const today = new Date();
    return response.filter((cls) => isSameDay(new Date(cls.start_time), today));
  }, [response]);

  const getTimeStatus = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffInMinutes = (start.getTime() - now.getTime()) / (1000 * 60);

    if (diffInMinutes <= 0 && diffInMinutes >= -60) {
      return {
        label: t("status.ongoing"),
        variant: "destructive" as const,
        dot: "bg-red-500 animate-pulse",
      };
    }
    if (diffInMinutes > 0 && diffInMinutes <= 30) {
      return {
        label: t("status.starting_soon"),
        variant: "default" as const,
        dot: "bg-orange-500 animate-bounce",
      };
    }
    return {
      label: t("status.scheduled"),
      variant: "secondary" as const,
      dot: "bg-slate-300",
    };
  };

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-950 flex flex-col h-full max-h-[600px] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4 shrink-0 border-b border-slate-50 dark:border-slate-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-950/30 rounded-lg">
              <Activity className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight">
              {t("title")}
            </CardTitle>
          </div>
          <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {t("description", { count: todayClasses.length })} •{" "}
            {format(new Date(), "MMMM yyyy", { locale: dateLocales[locale] })}
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="font-mono py-1 px-3 border-slate-200 text-slate-600"
        >
          {format(new Date(), "eee dd", { locale: dateLocales[locale] })}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-14 w-1 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : todayClasses.length > 0 ? (
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-4 pr-3">
              {todayClasses.map((cls) => {
                const status = getTimeStatus(cls.start_time);
                return (
                  <div key={cls.class_id} className="group flex gap-4 relative">
                    {/* Línea de tiempo vertical */}
                    <div
                      className={cn(
                        "w-1 shrink-0 rounded-full transition-all duration-300 group-hover:w-1.5",
                        status.dot.split(" ")[0],
                      )}
                    />

                    <div className="flex-1 flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group-hover:shadow-md group-hover:border-slate-200 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate uppercase tracking-tight">
                            {cls.class_name}
                          </h4>
                          <div className="flex items-center text-[11px] font-semibold text-slate-500">
                            <User2 className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                            {cls.instructor_name}
                          </div>
                        </div>
                        <Badge className="text-[9px] font-black uppercase px-2 h-5 tracking-tighter">
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-[11px] font-bold text-slate-900 dark:text-slate-200">
                            <Clock className="mr-1.5 h-3.5 w-3.5 text-orange-500" />
                            {format(new Date(cls.start_time), "HH:mm")}
                          </div>
                          <Separator orientation="vertical" className="h-3" />
                          <div className="flex items-center text-[10px] font-bold text-slate-400">
                            <Users className="mr-1 h-3.5 w-3.5" />
                            {t("capacity", { max: cls.max_capacity })}
                          </div>
                        </div>

                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Timer className="h-3 w-3 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center p-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 blur-2xl rounded-full" />
              <div className="relative p-6 bg-white dark:bg-slate-900 rounded-full shadow-xl border border-slate-100 dark:border-slate-800">
                <CalendarDays className="h-12 w-12 text-orange-500 opacity-80" />
              </div>
            </div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2">
              Sin clases para hoy
            </h5>
            <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed font-medium">
              No hay sesiones programadas para este centro el día de hoy.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
const Separator = ({
  orientation,
  className,
}: {
  orientation: string;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-slate-200 dark:bg-slate-800",
      orientation === "vertical" ? "w-[1px]" : "h-[1px]",
      className,
    )}
  />
);
