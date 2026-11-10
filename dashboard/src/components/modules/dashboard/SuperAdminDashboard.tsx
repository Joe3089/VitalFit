"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { GlobalStats } from "../analytics/sales/SalesStats";
import { ActiveBranchesCount, WeeklyRevenueStat } from "../analytics/finance/FinancialStats";
import { TotalClients } from "../analytics/clients/ClientsStat";
import { FranchisePerformanceCard } from "./superadmin/FranchisePerformanceCard";
import { SystemAlertsCard } from "./superadmin/SystemAlertsCard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const t = useTranslations("dashboards.SuperAdminDashboard");

  if (!token) {
    return null;
  }

  return (
    <div className="w-full space-y-8 p-4 md:p-8 pt-6">
      <PageHeader
        title={t("header.title")}
        subtitle={t("header.subtitle")}
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlobalStats token={token} />
          <ActiveBranchesCount token={token} />
          <TotalClients token={token} />
          <WeeklyRevenueStat token={token} branchId=" " />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <FranchisePerformanceCard token={token} />
          </div>

          <div className="lg:col-span-3">
            <SystemAlertsCard />
          </div>
        </div>
      </div>
    </div>
  );
}