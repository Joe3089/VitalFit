"use client";

import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  Tooltip,
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
  ChartTooltipContent,
} from "@/components/ui/chart";

type Datum = {
  hour: number;
  label: string;
  value: number;
};

interface AdaptableLineChartProps {
  title?: string;
  description?: string;
  data: Datum[];
  seriesLabel: string;
  footerText?: string;
  footerChange?: string;
  height?: number;
}

const warmColors = ["#f97316", "#fb923c", "#fdba74", "#fcd34d", "#fbbf24"];

export function AdaptableLineDotsChart({
  title,
  description,
  data,
  seriesLabel,
  footerText,
  footerChange,
  height = 280,
}: AdaptableLineChartProps) {
  const chartData = data || [];

  const xKey = "hour";
  const yKey = "value";

  const chartConfig: ChartConfig = {
    [yKey]: {
      label: seriesLabel,
      color: warmColors[0],
    },
    hour: {
      label: "Hora",
      color: "hsl(var(--muted-foreground))",
    },
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col space-y-1.5 p-6 pb-3">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <ChartContainer
          config={chartConfig}
          style={{ height }}
          className="w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />

            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(value) => `$${value}`}
            />

            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) => `${v}h`}
            />

            <Tooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="hour" />}
            />

            <Line
              key={yKey}
              type="natural"
              dataKey={yKey}
              stroke={chartConfig[yKey].color}
              strokeWidth={2}
              dot={{
                fill: chartConfig[yKey].color,
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      {(footerText || footerChange) && (
        <CardFooter className="flex-col items-start gap-2 text-sm p-6 pt-2">
          {footerChange && (
            <div className="flex gap-2 leading-none font-medium">
              {footerChange} <TrendingUp className="h-4 w-4" />
            </div>
          )}
          {footerText && (
            <div className="text-muted-foreground leading-none">
              {footerText}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
