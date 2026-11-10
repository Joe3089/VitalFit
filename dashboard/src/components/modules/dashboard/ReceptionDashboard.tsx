"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SessionUser, useAuth } from "@/context/AuthContext";
import { BranchStaff } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { CheckInsToday, OccupancyStat } from "./reception/ReceptionStats";
import { RecentCheckInsCard } from "./reception/RecentCheckInsCard";
import { ClassCapacityMonitor } from "./reception/ClassCapacityMonitor";
import { UpcomingClassesCard } from "./reception/UpcomingClassesCard";
import { ManualCheckInModal } from "../access/ManualCheckInModal";

interface ReceptionDashboardProps {
  user: SessionUser;
  activeBranch?: BranchStaff;
}

export default function ReceptionDashboard({ user, activeBranch }: ReceptionDashboardProps) {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { token } = useAuth();
  const t = useTranslations("dashboards.ReceptionDashboard");

  const branchId = activeBranch?.id || "all";
  const branchName = activeBranch?.name || t("global");

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.altKey && e.code === "KeyC") {
      e.preventDefault(); 
      setIsCheckInOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!token) {
    return null;
  }

  return (
    <div className="w-full min-h-full bg-transparent overflow-y-visible">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        
        <PageHeader 
          title={t("title", { branch: branchName })}
          subtitle={
            <span className="text-muted-foreground italic">
              {t("welcome", { name: user.first_name })}{" "}
              <span className="text-primary font-bold">{t("status_ready")}</span>
            </span>
          }
          children={
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <Keyboard className="h-3.5 w-3.5 mr-1" />
              <span>Atajo</span>
              <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-sm text-slate-900 font-sans">
                Alt
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-sm text-slate-900 font-sans">
                C
              </kbd>
            </div>
          }
          actionButton={
            <Button 
              onClick={() => setIsCheckInOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg gap-2 h-11 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Check-In Manual</span>
            </Button>
          }
        />

        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <OccupancyStat token={token} branchId={branchId} key={`occ-${refreshKey}`} />
            <CheckInsToday token={token} branchId={branchId} key={`cit-${refreshKey}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <ClassCapacityMonitor token={token} branchId={branchId} key={`ccm-${refreshKey}`} />
              <RecentCheckInsCard token={token} branchId={branchId} key={`rcc-${refreshKey}`} />
            </div>
            
            <div className="lg:col-span-4 h-full">
              <UpcomingClassesCard token={token} branchId={branchId} key={`ucc-${refreshKey}`} />
            </div>
          </div>
        </div>
      </div>

      <ManualCheckInModal 
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        token={token}
        activeBranchId={branchId}
        onSuccess={handleRefresh} 
      />
    </div>
  );
}