"use client";

import { useState, useMemo } from "react"; 
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemographicSalesChart } from "./DemographicSalesChart";
import { EmptyChartPlaceholder } from "./EmptyChartPlaceholder";
import { useSalesReports } from "@/hooks/reports/useSalesReports";

interface DemographicSalesSectionProps {
  token: string;
  branchId?: string;
  startDate?: string; 
  endDate?: string;   
}

export function DemographicSalesSection({ 
  token, 
  branchId, 
  startDate, 
  endDate 
}: DemographicSalesSectionProps) {
  const t = useTranslations("analytics.Sales");
  
  const [dimension, setDimension] = useState<"age" | "gender">("age");

  const { data: reportData, isLoading } = useSalesReports.useSalesByDemography(
    token,
    branchId,
    dimension,
    startDate || "",
    endDate || ""
  );

 const processedData = useMemo(() => {
    if (!reportData) {
        return [];
    }

    return reportData.map((item: any) => {
      let label = item.label;


      if (dimension === "gender") {

        const translationKey = `charts.demography.values.${item.label.toLowerCase()}`;

        try {

            if (["male", "female", "prefer-not-to-say", "other"].includes(item.label.toLowerCase())) {
                 label = t(translationKey as any);
            }
        } catch (e) {

            console.warn("Missing translation for", item.label);
        }
      }

      return {
        label: label, 
        value: Number(item.value) 
      };
    });
  }, [reportData, dimension, t]); 

 if (!startDate || !endDate) {
    return (
      <EmptyChartPlaceholder 
        title={t("filters.required_title")} 
        description={t("filters.required_description")} 
      />
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">

      <div className="flex items-center justify-end">
        <Tabs 
          value={dimension} 
          onValueChange={(v) => setDimension(v as "age" | "gender")} 
          className="w-auto"
        >
          <TabsList className="grid w-[180px] grid-cols-2 h-8 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger 
              value="age" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 transition-all"
            >
              {t("charts.demography.age") || "Edad"} 
            </TabsTrigger>
            <TabsTrigger 
              value="gender" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700 transition-all"
            >
              {t("charts.demography.gender") || "Género"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-[350px]">

        <DemographicSalesChart 
          data={processedData} 
          dimension={dimension}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}