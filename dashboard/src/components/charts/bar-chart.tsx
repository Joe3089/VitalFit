"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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
} from "@/components/ui/chart";

type BarChartProps = {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  growth: number;
  color?: string; 
};

const DEFAULT_COLOR = "#f97316";

export function BarChartDefault({
  title,
  description,
  data,
  growth,
  color = DEFAULT_COLOR,
}: BarChartProps) {
  
  const isEmpty = !data || data.length === 0;

  const growthStatus = (() => {
    if (growth > 0) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
        text: `Trending up by ${growth}% this month`,
        className: "text-green-600",
      };
    }

    if (growth < 0) {
      return {
        icon: <TrendingDown className="h-4 w-4 text-red-500" />,
        text: `Trending down by ${Math.abs(growth)}% this month`,
        className: "text-red-600",
      };
    }

    return {
      icon: <Minus className="h-4 w-4 text-muted-foreground" />,
      text: "No change this month",
      className: "text-muted-foreground",
    };
  })();

  const chartData = isEmpty
    ? [{ label: "N/A", value: 0 }]
    : data.map((item) => ({
        month: item.label,
        desktop: item.value,
      }));

  const chartConfig = {
    desktop: {
      label: title,
      color,
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar
              dataKey="desktop"
              fill={color}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div
          className={`flex items-center gap-2 leading-none font-medium ${growthStatus.className}`}
        >
          {growthStatus.text} {growthStatus.icon}
        </div>

        <div className="text-muted-foreground leading-none">
          {description ?? "Showing results"}
        </div>
      </CardFooter>
    </Card>
  );
}
