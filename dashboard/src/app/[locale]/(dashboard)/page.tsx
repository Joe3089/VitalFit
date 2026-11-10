"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/roles";
import { SidebarMenuSkeleton } from "@/components/ui/sidebar";
import SuperAdminDashboard from "@/components/modules/dashboard/SuperAdminDashboard";
import BranchAdminDashboard from "@/components/modules/dashboard/BranchDashboard";
import InstructorDashboard from "@/components/modules/dashboard/InstructorDashboard";
import ReceptionDashboard from "@/components/modules/dashboard/ReceptionDashboard";
import { useTranslations } from "next-intl";
import DataAnalystDashboard from "@/components/modules/dashboard/DataAnalystDashboard";
import AccountantDashboard from "@/components/modules/dashboard/AccountantDashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const t = useTranslations("dashboards"); 

  if (loading) {
    return <SidebarMenuSkeleton />;
  }

  if (!user) {
    return null; 
  }

  const dashboards: Record<UserRole, React.ReactNode> = {
    [UserRole.SUPER_ADMIN]: (
      <SuperAdminDashboard  />
    ),
    [UserRole.BRANCH_ADMIN]: (
      <BranchAdminDashboard 
        user={user} 
        activeBranch={user.activeBranch} 
      />
    ),
    [UserRole.INSTRUCTOR]: (
      <InstructorDashboard 
        user={user} 
        activeBranch={user.activeBranch} 
      />
    ),
    [UserRole.ACCOUNTANT]: (
      <AccountantDashboard  user={user} 
        activeBranch={user.activeBranch} />
    ),
    [UserRole.DATA_ANALYST]: (
      <DataAnalystDashboard
        user={user} 
        activeBranch={user.activeBranch} 
      />
    ),
    [UserRole.RECEPTIONIST]: (
      <ReceptionDashboard 
        user={user} 
        activeBranch={user.activeBranch} 
      />
    ),
  };

  return (
    <div className="flex-1 w-full">
      {dashboards[user.role] || (
        <div className="p-8 text-center text-muted-foreground italic">
          {t("no_dashboard")}
        </div>
      )}
    </div>
  );
}