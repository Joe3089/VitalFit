"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  title: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  variant?: "classic" | "modern";
  trend?: {
    value?: string | number;
    isPositive?: boolean;
    label?: string;
  };
  isLoading?: boolean;
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
  variant = "modern",
  trend,
  isLoading
}) => {
  return (
    <Card className={cn("shadow-sm border-gray-200 overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
        {isLoading ? (
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <CardTitle className="text-sm md:text-[16px] font-semibold text-[#111827] leading-tight break-words max-w-[80%]">
            {title}
          </CardTitle>
        )}
        
        {icon && (
          <div className={cn(
            "text-[#111827] shrink-0",
            isLoading && "animate-pulse opacity-20"
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        ) : (
          <>

            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 break-words line-clamp-1">
              {value}
            </div>
            
            <div className="min-h-[1.25rem] mt-1">
              {trend ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn(
                    "text-sm font-bold whitespace-nowrap",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {trend.isPositive ? "↑" : "↓"} {trend.value}% 
                  </span>
                  <span className="text-[11px] sm:text-xs text-gray-500 font-normal truncate">
                    {trend.label ?? "vs mes pasado"}
                  </span>
                </div>
              ) : (
                description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )
              )}
            </div>
          </>
        )}
      </CardContent>

      {variant === "classic" && !isLoading && (
        <div className="bg-gray-50 p-2 w-full border-t border-gray-100 mt-2"></div>
      )}
    </Card>
  );
};