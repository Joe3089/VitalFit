"use client";

import * as React from "react";
import { PieChart, Pie, LabelList, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ReusableDonutChartProps<T> {
  title: string;
  description?: string;
  data?: T[];
  dataKey: keyof T;
  labelKey: keyof T;
  config?: ChartConfig;
  footerText?: string;
  growth?: number;
  height?: number;
  isLoading?: boolean;
}

const DEFAULT_COLORS = ["#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];

export function ReusableDonutChart<T extends Record<string, any>>({
  title,
  description,
  data = [],
  dataKey,
  labelKey,
  config = {},
  footerText,
  growth,
  height = 260,
  isLoading = false,
}: ReusableDonutChartProps<T>) {
  
  const safeData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      [dataKey]: Number(item[dataKey]) || 0,
    }));
  }, [data, dataKey]);

  const total = React.useMemo(() => 
    safeData.reduce((acc, item) => acc + (item[dataKey] as number), 0),
    [safeData, dataKey]
  );

  const growthInfo = React.useMemo(() => {
    if (growth === undefined) {
      return null;
    }
    if (growth > 0) {
      return {
      icon: <TrendingUp className="h-4 w-4" />,
      text: `Subió un ${growth}%`,
      color: "text-green-600"
    };
    }
    if (growth < 0) {
      return {
      icon: <TrendingDown className="h-4 w-4" />,
      text: `Bajó un ${Math.abs(growth)}%`,
      color: "text-red-600"
    };
    }
    return {
      icon: <Minus className="h-4 w-4" />,
      text: "Sin cambios",
      color: "text-muted-foreground"
    };
  }, [growth]);

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Skeleton className="h-4 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full shadow-sm border-none bg-white dark:bg-slate-950">
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square w-full"
          style={{ maxHeight: height }}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey={labelKey as string} hideLabel />}
            />
            <Pie
              data={safeData.length ? safeData : [{ [dataKey]: 1 }]}
              dataKey={dataKey as string}
              nameKey={labelKey as string}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={4}
              cornerRadius={4}
            >
              {safeData.length > 0 ? (
                safeData.map((_, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]} 
                    className="stroke-background hover:opacity-80 transition-opacity"
                  />
                ))
              ) : (
                <Cell fill="#e5e7eb" />
              )}
              
              <LabelList
                dataKey={labelKey as string}
                position="outside"
                className="fill-muted-foreground"
                fontSize={11}
                formatter={(value: string) => {
                  const item = safeData.find(d => d[labelKey] === value);
                  const val = item ? (item[dataKey] as number) : 0;
                  const pct = total > 0 ? (val / total) * 100 : 0;
                  return pct > 8 ? `${pct.toFixed(0)}%` : "";
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      {(footerText || growthInfo) && (
        <CardFooter className="flex-col gap-1 text-sm pt-4">
          {growthInfo && (
            <div className={`flex items-center gap-2 font-medium ${growthInfo.color}`}>
              {growthInfo.text} {growthInfo.icon}
            </div>
          )}
          {footerText && (
            <div className="text-muted-foreground text-xs text-center">{footerText}</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}