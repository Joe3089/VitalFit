"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { SessionUser } from "@/context/AuthContext";
import { BranchStaff } from "@vitalfit/sdk";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MonthlySalesKPI, OccupancyKPI } from "./branchadmin/BranchAdminStats";
import { ActiveMember } from "../analytics/clients/ClientsStat";
import { FinancialSummaryCard } from "./branchadmin/FinancialSummaryCard";
import { ClassOccupancyAnalytics } from "./branchadmin/ClassOccupancyAnalytics";
import { ActivityHeatmapCard } from "./branchadmin/ActivityHeatmapCard";
import { SalesTrendCard } from "./branchadmin/SalesTrendCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslations } from "next-intl";

interface BranchDashboardProps {
  user: SessionUser;
  activeBranch?: BranchStaff;
}

export default function BranchAdminDashboard({
  user,
  activeBranch,
}: BranchDashboardProps) {
  const { token } = useAuth();
  const t = useTranslations("dashboards.BranchDashboard");
  
  const branchId = activeBranch?.id || "all";
  const branchName = activeBranch?.name || t("global");

  if (!token) {
    return null;
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 overflow-visible">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        <PageHeader 
          title={t("title", { branch: branchName })}
          subtitle={
            <span className="text-muted-foreground">
              {t("welcome", { name: user.first_name })}{" "}
              <span className="text-foreground font-semibold">
                {t("subtitle")}
              </span>
            </span>
          }
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsContent value="overview" className="space-y-6 outline-none">
            
            <div className="grid gap-4 md:grid-cols-3">
              <MonthlySalesKPI token={token} branchId={branchId} />
              <ActiveMember token={token} branchId={branchId} />
              <OccupancyKPI token={token} branchId={branchId} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <SalesTrendCard token={token} branchId={branchId} />
              </div>
              <div className="lg:col-span-4">
                <FinancialSummaryCard token={token} branchId={branchId} />
              </div>
              <div className="lg:col-span-8">
                <ActivityHeatmapCard token={token} branchId={branchId} />
              </div>
              <div className="lg:col-span-4">
                <ClassOccupancyAnalytics token={token} branchId={branchId} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}