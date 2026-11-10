"use client";

import { PolarGrid, RadialBar, RadialBarChart, LabelList } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface RadialData {
  name: string;
  value: number;
  fill: string;
}

interface RadialRankingChartProps {
  title: string;
  description?: string;
  data: RadialData[] | undefined;
  isLoading?: boolean;
}

export function RadialRankingChart({
  title,
  description,
  data,
  isLoading,
}: RadialRankingChartProps) {

  const t = useTranslations("analytics.clients.instructors");

  const chartConfig = {
    value: { label: t("label_usage") }, 
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col border-none shadow-sm bg-white h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg font-bold text-slate-800">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs text-center">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 h-[400px]">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="space-y-2 w-full px-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg text-sm italic">
            {t("messages.no_data")} 
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px] w-full"
            >
              <RadialBarChart
                data={data}
                startAngle={240}  
                endAngle={450} 
                innerRadius={40} 
                outerRadius={140}
                barSize={20} 
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <PolarGrid gridType="circle" strokeDasharray="3 3" />

                <RadialBar dataKey="value" background cornerRadius={10}>
                  <LabelList
                    position="insideStart"
                    dataKey="name"
                    fill="#ffffff"
                    className="capitalize text-[10px] font-bold"
                    angle={0}             
                    offset={15}           
                    textAnchor="start"    
                    dominantBaseline="central" 
                  />
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>

            <div className="space-y-2 pt-4 border-t border-slate-100 px-2">
              {[...data].reverse().map((instructor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="h-3 w-3 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: instructor.fill }}
                    />
                    <span className="font-semibold text-slate-700 capitalize">
                      {instructor.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-900 font-bold tabular-nums">
                      {instructor.value}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      {t("label_usage")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}