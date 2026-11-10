"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  CreditCard,
  Eye,
  FileText,
  BarChart,
  ClipboardList,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  BRANCH_ADMIN = "branch_admin",
  INSTRUCTOR = "instructor",
  ACCOUNTANT = "accountant",
  DATA_ANALYST = "data_analyst",
  RECEPTIONIST = "recepcionist",
}

interface Props {
  userId: string;
  currentUser: any;
  canEdit: boolean;
  isBlocked: boolean;
  onNavigate: (path: string) => void;
  onEditClick: () => void;
  onBlockClick: () => void;
  onUnblockClick: () => void;
  isUnblocking?: boolean;
  isBlocking?: boolean;
}

export const ClientActions = ({
  userId,
  currentUser,
  canEdit,
  isBlocked,
  onNavigate,
  onEditClick,
  onBlockClick,
  onUnblockClick,
  isUnblocking,
  isBlocking,
}: Props) => {
  const t = useTranslations("clients.view");
  const userRole = currentUser?.role as UserRole;

  const actions = useMemo(
    () => [
      {
        label: t("actions.edit"),
        icon: Pencil,
        onClick: () => onEditClick(),
        visible: canEdit,
        variant: "default",
      },
      {
        label: t("actions.membership_history"),
        icon: CreditCard,
        onClick: () => onNavigate(`/clients/register/${userId}/payments`),
        visible: [
          UserRole.SUPER_ADMIN,
          UserRole.ACCOUNTANT,
          UserRole.BRANCH_ADMIN,
        ].includes(userRole),
        variant: "default",
      },
      {
        label: t("actions.attendance_history"),
        icon: Eye,
        onClick: () => onNavigate(`/clients/register/${userId}/attendance`),
         visible: [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT].includes(userRole),
        variant: "default",
      },
      {
        label: t("actions.service_usage"),
        icon: ClipboardList,
        onClick: () => onNavigate(`/clients/register/${userId}/service-usage`),
         visible: [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT].includes(userRole),
        variant: "default",
      },
      {
        label: t("actions.view_wallet"), 
        icon: Wallet,
        onClick: () => onNavigate(`/clients/register/${userId}/clientServiceBalances`),
         visible: [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT].includes(userRole),
        variant: "default",
      },
      {
        label: isBlocked ? t("actions.unblock") : t("actions.block"),
        icon: isBlocked ? Unlock : ShieldAlert,
        onClick: isBlocked ? () => onUnblockClick() : () => onBlockClick(),
        visible: [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN].includes(userRole),
        variant: isBlocked ? "unblock" : "destructive",
        isLoading: isBlocked ? isUnblocking : isBlocking,
      },
      {
        label: t("actions.rfm"),
        icon: BarChart,
        onClick: null,
        visible: [UserRole.SUPER_ADMIN, UserRole.DATA_ANALYST].includes(userRole),
        variant: "default",
      },
    ],
    [
      userId,
      t,
      userRole,
      canEdit,
      isBlocked,
      onNavigate,
      onEditClick,
      onBlockClick,
      onUnblockClick,
      isUnblocking,
      isBlocking,
    ]
  );

  const visibleActions = actions.filter((action) => action.visible);

  return (
    <Card className="shadow-lg border-slate-200 text-left bg-white rounded-3xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 h-fit">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
        <CardTitle className="text-[10px] font-black italic uppercase tracking-[0.2em] text-slate-400 leading-none flex items-center justify-between">
          {t("sections.actions")}
          <Lock className="h-3 w-3 opacity-20" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-4">
        {visibleActions.map((action, idx) => {
          const isDestructive = action.variant === "destructive";
          const isUnblock = action.variant === "unblock";

          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                "w-full justify-start text-[11px] font-black uppercase tracking-wider h-11 transition-all group border-slate-100 shadow-sm rounded-xl px-3",
                isDestructive && "hover:bg-red-600 hover:text-white hover:border-red-600",
                isUnblock && "hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
                !isDestructive && !isUnblock && "hover:bg-slate-900 hover:text-white hover:border-slate-900"
              )}
              onClick={() => action.onClick && action.onClick()}
              disabled={!action.onClick || action.isLoading}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg mr-3 transition-colors",
                  isDestructive && "bg-red-50 group-hover:bg-white/20",
                  isUnblock && "bg-emerald-50 group-hover:bg-white/20",
                  !isDestructive && !isUnblock && "bg-slate-50 group-hover:bg-white/20"
                )}
              >
                {action.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-inherit" />
                ) : (
                  <action.icon
                    className={cn(
                      "h-4 w-4 group-hover:scale-110 transition-transform",
                      isDestructive
                        ? "text-red-600 group-hover:text-white"
                        : isUnblock
                        ? "text-emerald-600 group-hover:text-white"
                        : "text-slate-600 group-hover:text-white"
                    )}
                  />
                )}
              </div>
              {action.label}
            </Button>
          );
        })}

        {visibleActions.length === 0 && (
          <p className="text-[10px] text-slate-400 italic text-center py-4">
            {t("actions.no_permissions")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};