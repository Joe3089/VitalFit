"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface StackedSeries {
  key: string;
  label: string;
  color: string;
}

interface StackedBarChartProps {
  title: string;
  description?: string;
  data: any[] | undefined;
  indexKey: string; 
  series: StackedSeries[];
  isLoading?: boolean;
}

export function StackedBarChart({
  title,
  description,
  data,
  indexKey,
  series,
  isLoading,
}: StackedBarChartProps) {
  const t = useTranslations("analytics.common");

  const chartConfig = React.useMemo(() => {
    return series.reduce((acc, s) => {
      acc[s.key] = { label: s.label, color: s.color };
      return acc;
    }, {} as ChartConfig);
  }, [series]);

  return (
    <Card className="flex flex-col h-full border-none shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800">
          {title}
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-lg" />
        ) : !data || data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg text-sm italic">
            {t("no_data")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.3}
              />
              <XAxis
                dataKey={indexKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-[10px] uppercase font-medium"
                tickFormatter={(value) =>
                  typeof value === "string" && value.length > 3 
                    ? value.slice(0, 3) 
                    : value
                }
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />

              {series.map((s, index) => {
                const isFirst = index === 0;
                const isLast = index === series.length - 1;

                return (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="a"
                    fill={s.color}
                    radius={[
                      isLast ? 4 : 0,
                      isLast ? 4 : 0,
                      isFirst ? 4 : 0,
                      isFirst ? 4 : 0,
                    ]}
                    barSize={32}
                  />
                );
              })}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}