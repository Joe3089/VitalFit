"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl"; 

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  isViewMode?: boolean;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  isViewMode = false,
  action,
}) => {

  const t = useTranslations("common.ui");

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
      <div className="space-y-1 text-left">
        <h2 className="text-xl text-orange-400 font-bold tracking-tight uppercase flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </h2>
        <p className="text-sm text-muted-foreground italic font-medium">
          {subtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {action}

        {isViewMode && (
          <Badge variant="secondary" className="h-fit bg-slate-100 text-slate-500 border-none px-3">
            {t("view_mode")} 
          </Badge>
        )}
      </div>
    </div>
  );
};