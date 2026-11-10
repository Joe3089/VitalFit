"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SessionUser, useAuth } from "@/context/AuthContext";
import { BranchStaff } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { ActiveMember, NewClients, RetentionRate } from "../analytics/clients/ClientsStat";
import { AverageCLV } from "../analytics/finance/FinancialStats";
import { NewVsRecurringReport } from "../analytics/clients/NewVsRecurringReport";
import { MostUsedServicesReport } from "../analytics/clients/MostUsedServicesReport";
import SalesByHourChart from "../analytics/sales/SalesByHourChart";
import CategorySalesDonutChart from "../analytics/sales/ServiceSalesDonutChart";
import { startOfMonth, endOfMonth, format } from "date-fns"; 

interface DataAnalystDashboardProps {
  user: SessionUser;
  activeBranch?: BranchStaff;
}

export default function DataAnalystDashboard({
  user,
  activeBranch,
}: DataAnalystDashboardProps) {
  const { token } = useAuth();
  const t = useTranslations("dashboards.DataAnalystDashboard");
  
  const branchId = activeBranch?.id || "all";
  const branchName = activeBranch?.name || t("global");

  const now = new Date();

  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");

  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const today = format(now, "yyyy-MM-dd");
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;

  if (!token) {
    return null;
  }

  return (
    <div className="w-full bg-transparent transition-colors overflow-visible">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        <PageHeader
          title={t("title", { branch: branchName })}
          subtitle={
            <span className="text-muted-foreground italic">
              {t("welcome", { name: user.first_name })}{" "}
              <span className="text-primary font-bold">
                {t("status_ready")}
              </span>
            </span>
          }
        />

        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <RetentionRate token={token} branchId={branchId} />
            <AverageCLV token={token} branchId={branchId} />
            <NewClients token={token} branchId={branchId} />
            <ActiveMember token={token} branchId={branchId} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <NewVsRecurringReport 
                token={token} 
                branchId={branchId} 
              />
            </div>
            
            <div className="lg:col-span-6">
              <MostUsedServicesReport 
                token={token} 
                startDate={monthStart} 
                endDate={monthEnd} 
              />
            </div>

            <div className="lg:col-span-7">
              <SalesByHourChart 
                token={token} 
                startHour={todayStart} 
                endHour={todayEnd} 
              />
            </div>

            <div className="lg:col-span-5">
              <CategorySalesDonutChart 
                token={token} 
                startDate={monthStart} 
                endDate={monthEnd} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}