"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { SessionUser } from "@/context/AuthContext";
import { BranchStaff } from "@vitalfit/sdk";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslations } from "next-intl";
import { AccountsReceivableStat } from "../analytics/finance/FinancialStats";
import {  AverageTicketStat, TotalTransactionsStat } from "../analytics/sales/SalesStats";
import { ProjectedCashFlowReport } from "../analytics/finance/ProjectedCashFlow";
import { MonthlyRevenueReport } from "../analytics/finance/MonthlyRevenueReport";
import SalesByPaymentMethodSection from "../analytics/sales/SalesByPaymentMethodSection";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface AccountantDashboardProps {
  user: SessionUser;
  activeBranch?: BranchStaff;
}

export default function AccountantDashboard({
  user,
  activeBranch,
}: AccountantDashboardProps) {
  const { token } = useAuth();
  const t = useTranslations("dashboards.AccountantDashboard");
  const branchId = activeBranch?.id || "all";
  const branchName = activeBranch?.name || t("global");

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  if (!token) {
    return null;
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 overflow-visible">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        <PageHeader 
          title={t("title", { branch: branchName })}
          subtitle={
            <span className="text-muted-foreground italic">
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
              <AccountsReceivableStat token={token} branchId={branchId} />
              <TotalTransactionsStat token={token} branchId={branchId} />
              <AverageTicketStat token={token} branchId={branchId} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <ProjectedCashFlowReport token={token} branchId={branchId} />
              </div>

              <div className="lg:col-span-4">
                <MonthlyRevenueReport token={token} branchId={branchId} />
              </div>

              <div className="lg:col-span-12">
                <SalesByPaymentMethodSection 
                  token={token} 
                  start={monthStart} 
                  end={monthEnd}  
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}