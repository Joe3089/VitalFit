"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Treemap, ResponsiveContainer, Tooltip, TooltipProps } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RFMMetric {
  segment: string;
  monetary_total: string | number;
  [key: string]: any;
}

interface RFMTreemapProps {
  data: RFMMetric[];
  title?: string;
  description?: string;
}

const COLORS: Record<string, string> = {
  Champions: "#10b981",
  "Loyal Customers": "#3b82f6",
  "Potential Loyalist": "#6366f1",
  "New Customers": "#22d3ee",
  Regular: "#94a3b8",
  "At Risk": "#f59e0b",
  Lost: "#ef4444",
  "New / Non-Purchaser": "#cbd5e1",
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, value, fill } = props;
  const showText = width > 70 && height > 30;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: "#fff",
          strokeWidth: 2,
          strokeOpacity: 0.3,
        }}
        className="hover:opacity-90 transition-opacity duration-300"
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={width > 120 ? 14 : 11}
          fontWeight="600"
          className="pointer-events-none select-none"
        >
          {name}
        </text>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5">
        <p className="font-bold text-slate-900 dark:text-white border-b pb-2 mb-2 flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: data.fill }}
          />
          {data.name}
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-8 text-slate-500">
            <span>Clientes:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {data.value}
            </span>
          </div>
          <div className="flex justify-between gap-8 text-slate-500">
            <span>Inversión Total:</span>
            <span className="font-bold text-emerald-600">
              ${Number(data.totalRevenue).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RFMTreemap: React.FC<RFMTreemapProps> = ({
  data,
  title = "Segmentación de Clientes (RFM)",
  description = "Distribución de clientes por comportamiento de compra y asistencia",
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedData = useMemo(() => {
    const groups = data.reduce((acc: any, curr) => {
      const segment = curr.segment || "Unknown";
      if (!acc[segment]) {
        acc[segment] = { name: segment, value: 0, totalRevenue: 0 };
      }
      acc[segment].value += 1;
      acc[segment].totalRevenue += parseFloat(curr.monetary_total.toString());
      return acc;
    }, {});

    return Object.values(groups).map((group: any) => ({
      ...group,
      fill: COLORS[group.name] || "#94a3b8",
    }));
  }, [data]);

  if (!isMounted) {
    return <div className="h-[450px] w-full" />;
  }

  return (
    <Card className="w-full h-full min-h-[480px] overflow-hidden border-none shadow-sm bg-white dark:bg-slate-950">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[380px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={formattedData}
            dataKey="value"
            aspectRatio={4 / 3}
            isAnimationActive={true}
            animationDuration={800}
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
