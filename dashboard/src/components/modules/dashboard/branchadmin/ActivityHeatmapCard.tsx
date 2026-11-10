"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { useTranslations } from "next-intl";

interface ActivityHeatmapCardProps {
  token: string | null;
  branchId?: string;
  branchName?: string;
}

export const ActivityHeatmapCard = ({ token, branchId }: ActivityHeatmapCardProps) => {
  const t = useTranslations("analytics.branch.Occupancy.heatmap");

  const { data: response, isLoading } = useBranchReport.useActivityHeatmap(token, branchId);

  const heatmapData = useMemo(() => {
    if (!response || !Array.isArray(response)){
         return [];
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map((h) => {
      const getVal = (day: number) => 
        response.find((d: any) => d.day_of_week === day && d.hour === h)?.value || 0;

      return {
        hora: `${h.toString().padStart(2, "0")}:00`,
        lun: getVal(1),
        mar: getVal(2),
        mie: getVal(3),
        jue: getVal(4),
        vie: getVal(5),
        sab: getVal(6),
        dom: getVal(7),
      };
    });
  }, [response]);

  const getHeatColor = (val: number) => {
    if (val === 0) {
      return "bg-slate-100 dark:bg-slate-800";
    }
    if (val < 25) {
       return "bg-orange-100 text-orange-800";
    }
    if (val < 50) {
       return "bg-orange-300 text-orange-900";
    }
    if (val < 75) {
       return "bg-orange-500 text-white";
    }
    return "bg-orange-600 text-white shadow-[0_0_8px_rgba(234,88,12,0.3)]";
  };

  return (
    <Card className="shadow-sm border-none bg-white dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-1 mb-2 ml-12">
            {/* Cargamos las iniciales de los días desde el JSON */}
            {t.raw("days").map((d: string, i: number) => (
              <span key={i} className="flex-1 text-[10px] text-center text-muted-foreground font-bold">
                {d}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-6 w-full rounded-sm" />
              ))}
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
              {heatmapData.map((row) => (
                <div key={row.hora} className="flex items-center gap-4">
                  <span className="text-[10px] w-8 text-muted-foreground font-mono font-medium">
                    {row.hora}
                  </span>
                  <div className="flex flex-1 gap-1">
                    {[row.lun, row.mar, row.mie, row.jue, row.vie, row.sab, row.dom].map((val, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-6 rounded-sm ${getHeatColor(val)} transition-all hover:scale-110 hover:z-10 cursor-help border border-white/10`}
                        title={t("tooltip", { val })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-6 text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
            <span>{t("legend_low")}</span>
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 border" />
              <div className="w-3.5 h-3.5 rounded-sm bg-orange-100" />
              <div className="w-3.5 h-3.5 rounded-sm bg-orange-300" />
              <div className="w-3.5 h-3.5 rounded-sm bg-orange-500" />
              <div className="w-3.5 h-3.5 rounded-sm bg-orange-600" />
            </div>
            <span>{t("legend_high")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};