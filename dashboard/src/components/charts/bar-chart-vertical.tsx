"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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

interface BarChartVerticalProps {
  title?: string;
  description?: string;
  data: Array<Record<string, any>>;
  categoryKey: string;
  valueKey: string;
  config: ChartConfig;
  showLabels?: boolean;
  loading?: boolean;
}

export function BarChartVertical({
  title = "Bar Chart",
  description = "",
  data,
  categoryKey, 
  valueKey, 
  config,
  showLabels = true,
  loading = false,
}: BarChartVerticalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading chart...
          </div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <ChartContainer config={config}>
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{ right: 16 }}
            >
              <CartesianGrid horizontal={false} />

              <YAxis
                dataKey={categoryKey}
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(v) =>
                  typeof v === "string" ? String(v).slice(0, 3) : String(v)
                }
                hide
              />

              <XAxis dataKey={valueKey} type="number" hide />

              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />

              <Bar
                dataKey={valueKey}
                layout="vertical"
                fill={`var(--color-${valueKey})`}
                radius={4}
              >
                {showLabels && (
                  <>
                    <LabelList
                      dataKey={categoryKey}
                      position="insideLeft"
                      offset={8}
                      className="fill-(--color-label)"
                      fontSize={12}
                    />

                    <LabelList
                      dataKey={valueKey}
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </>
                )}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
