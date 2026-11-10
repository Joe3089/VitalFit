"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchReport } from "@/hooks/reports/useBranchReport";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale"; 
import { useTranslations, useLocale } from "next-intl";

const dateFnsLocales = {
  es: es,
  en: enUS,
};

interface RecentCheckInsCardProps {
  token: string | null;
  branchId?: string;
}

export const RecentCheckInsCard = ({ token, branchId }: RecentCheckInsCardProps) => {
  const t = useTranslations("analytics.branch.RecentCheckIns");
  const locale = useLocale() as keyof typeof dateFnsLocales; 
  
  const { data: response, isLoading } = useBranchReport.useRecentCheckIns(token, branchId);

  const checkIns = response || [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="h-full border-none shadow-sm bg-white dark:bg-slate-950">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{t("title")}</CardTitle>
        <CardDescription>
          {t("description", { count: checkIns.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))
          ) : checkIns.length > 0 ? (
            checkIns.map((item, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9 border-2 border-slate-100 group-hover:border-primary transition-colors">
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                      {getInitials(item.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                      {item.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.service_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(item.check_in_time), {
                      addSuffix: true,
                      locale: dateFnsLocales[locale] || es,
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">
              {t("empty_state")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};