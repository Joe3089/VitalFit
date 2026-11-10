"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Pie, PieChart, Cell, Label, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface ReusablePieChartProps<T> {
  title: string;
  description?: string;
  data?: T[];
  dataKey: keyof T;
  nameKey: keyof T;
  chartConfig?: ChartConfig;
  growth?: number;
  footerText?: string;
  colors?: string[];
  isLoading?: boolean;
  valuePrefix?: string;
}

const DEFAULT_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8"];

export function ReusablePieChart<T extends Record<string, any>>({
  title,
  description,
  data,
  dataKey,
  nameKey,
  chartConfig = {},
  growth,
  footerText,
  colors = DEFAULT_COLORS,
  isLoading = false,
  valuePrefix = "",
}: ReusablePieChartProps<T>) {
  
  const safeData = React.useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const processedData = React.useMemo(() => {
    return safeData.map((item) => ({
      ...item,
      [dataKey]: Number(item[dataKey]) || 0,
    }));
  }, [safeData, dataKey]);

  const totalValue = React.useMemo(() => 
    processedData.reduce((acc, curr) => acc + (curr[dataKey] as number), 0),
    [processedData, dataKey]
  );

  if (isLoading) {
    return (
      <Card className="flex flex-col shadow-md border-none rounded-xl overflow-hidden h-full">
        <CardHeader className="items-center pb-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </CardHeader>
        <CardContent className="flex-1 flex justify-center items-center py-6">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </CardContent>
        <CardFooter className="flex-col gap-2 p-6">
          <Skeleton className="h-4 w-full" />
        </CardFooter>
      </Card>
    );
  }

  const isEmpty = processedData.length === 0;

  return (
    <Card className="flex flex-col shadow-md border-none rounded-xl h-full bg-card/50 backdrop-blur-sm">
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
        {description && <CardDescription className="text-sm font-medium">{description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1 pb-0 mt-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey={nameKey as string} hideLabel />}
            />
            <Pie
              data={isEmpty ? [{ [dataKey]: 1 }] : processedData}
              dataKey={dataKey as string}
              nameKey={nameKey as string}
              innerRadius={75}
              outerRadius={100}
              strokeWidth={8}
              paddingAngle={2} 
            >
              {isEmpty ? (
                <Cell fill="hsl(var(--muted))" />
              ) : (
                processedData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                    className="stroke-background transition-all hover:opacity-90 outline-none"
                  />
                ))
              )}
              {/* LABEL CENTRAL: Muestra el gran total */}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {valuePrefix}{totalValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs uppercase tracking-wider font-semibold"
                        >
                          Total
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-3 p-6 pt-0 text-sm">
        {growth !== undefined && (
          <div className="flex items-center gap-2 font-bold transition-all">
             {growth > 0 ? (
               <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                 <TrendingUp className="h-4 w-4" /> +{growth}%
               </span>
             ) : growth < 0 ? (
               <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                 <TrendingDown className="h-4 w-4" /> {growth}%
               </span>
             ) : (
               <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                 <Minus className="h-4 w-4" /> 0%
               </span>
             )}
             <span className="text-muted-foreground font-normal">vs last month</span>
          </div>
        )}
        {footerText && (
          <p className="text-muted-foreground text-xs font-medium text-center border-t w-full pt-3">
            {footerText}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}