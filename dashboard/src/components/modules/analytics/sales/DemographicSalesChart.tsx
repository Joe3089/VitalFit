"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { useFormatter, useTranslations } from "next-intl"; 

const COLORS = {
    primary: "#f97316",
    secondary: "#fb923c",
    tertiary: "#fdba74",
    quaternary: "#fed7aa",
    slate: "#64748b",
};

const PIE_COLORS = ["#f97316", "#334155", "#cbd5e1", "#94a3b8"];

interface ChartData {
    label: string;
    value: number;
}

interface DemographicChartProps {
    data: ChartData[];
    dimension: "age" | "gender";
    isLoading: boolean;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) {
        return null;
    }

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-xs font-bold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function DemographicSalesChart({
    data,
    dimension,
    isLoading,
}: DemographicChartProps) {
    const t = useTranslations("analytics.Sales.charts.demography.ui");
    const format = useFormatter();

    const formatCurrency = (value: number) =>
        format.number(value, { style: "currency", currency: "USD" });

    const ChartComponent = useMemo(() => {
        if (isLoading) {
            return (
                <div className="h-[300px] flex items-center justify-center text-slate-400 animate-pulse">
                    {t("loading")}
                </div>
            );
        }
        if (!data || data.length === 0) {
            return (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                    {t("no_data")}
                </div>
            );
        }

        if (dimension === "age") {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e2e8f0"
                        />
                        <XAxis
                            dataKey="label"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickFormatter={(value) => `$${value / 1000}k`}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: "#f1f5f9" }}
                            contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value: number) => [
                                formatCurrency(value),
                                t("tooltip_sales"),
                            ]}
                        />
                        <Bar
                            dataKey="value"
                            fill={COLORS.primary}
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="label"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                strokeWidth={2}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name,
                        ]}
                        contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ color: "#1e293b", fontWeight: "bold" }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => (
                            <span className="text-slate-600 font-medium text-xs ml-1">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        );
    }, [data, dimension, isLoading, format, t]); 

    return (
        <Card className="shadow-sm border-slate-100 h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-800">

                    {dimension === "age" ? t("title_age") : t("title_gender")}
                </CardTitle>
                <CardDescription className="text-xs">
                    {t("description")}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">{ChartComponent}</CardContent>
        </Card>
    );
}
