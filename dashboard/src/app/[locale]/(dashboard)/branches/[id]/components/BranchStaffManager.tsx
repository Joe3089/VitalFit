"use client";

import React, { useState, useMemo } from "react";
import { Plus, RotateCcw, Save, Users, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { GetUserResponse, User, Staff } from "@vitalfit/sdk";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import useBranchStaff from "@/hooks/branches/useStaffBranch";
import { useStaffUsers } from "@/hooks/staff/useStaffUsers";
import { useRoles } from "@/hooks/rbac/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BranchStaffTable from "@/components/modules/BranchStaff/BranchStaffTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/modules/branches/SectionHeader";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

interface BranchStaffPanelProps {
  branchId: string;
  mode?: "view" | "edit";
}

const getUserRole = (user: any) =>
  String(user.role || user.role_name || "").toLowerCase().trim();

export default function BranchStaffManager({
  branchId,
  mode = "edit",
}: BranchStaffPanelProps) {
  const t = useTranslations("branches.details.staff");
  const { token } = useAuth();
  const isDisabled = mode === "view";

  const [catalogPage, setCatalogPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | GetUserResponse | null>(null);
  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [removedStaffIds, setRemovedStaffIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<{ id: string; name: string } | null>(null);

  const { rolesData, isLoading: isLoadingRoles } = useRoles({
    token,
    page: 1,
    pageSize: 50,
  });

  const availableRoles = useMemo(() => {
    const FORBIDDEN = ["super_admin", "instructor", "clients"]; 
    return rolesData.filter(role => !FORBIDDEN.includes(role.name.toLowerCase()));
  }, [rolesData]);

  const { 
    users: catalogUsers, 
    totalItems: catalogTotal, 
    isLoading: isCatalogLoading 
  } = useStaffUsers(token, {
    page: catalogPage,
    limit: 10,
    search: searchTerm || undefined,
    role: roleFilter === "all" ? undefined : roleFilter
  });

  const {
    branchStaff,
    assignStaff,
    removeStaff,
    isLoading: isBranchLoading,
  } = useBranchStaff(token, branchId);

  const filteredCatalogUsers = useMemo(() => {
    if (!catalogUsers){
       return [];
    }

    const FORBIDDEN_ROLES = ["super_admin", "instructor"];
    const existingIds = new Set([
      ...(branchStaff?.map((s) => s.user_id) || []),
      ...(pendingStaff.map((s) => s.user_id)),
    ]);

    return catalogUsers.filter((user) => {
      const userRole = getUserRole(user);
      const isExisting = existingIds.has(user.user_id);
      const isForbidden = FORBIDDEN_ROLES.includes(userRole);

      return !isExisting && !isForbidden;
    });
  }, [catalogUsers, branchStaff, pendingStaff]);

  const totalCatalogPages = Math.ceil(catalogTotal / 10) || 1;
  const visibleCount = filteredCatalogUsers.length;

  const handleAddToLocal = () => {
    if (!selectedUser?.user_id) {
      return;
    }
    if (removedStaffIds.includes(selectedUser.user_id)) {
      setRemovedStaffIds(prev => prev.filter(id => id !== selectedUser.user_id));
    } else {
      setPendingStaff(prev => [...prev, selectedUser as User]);
    }
    setSelectedUser(null);
    setSearchTerm("");
    toast.success(t("toast_added_local"));
  };

  const handleRemoveLocal = (id: string, isPending?: boolean) => {
    if (isPending) {
      setPendingStaff(prev => prev.filter(u => u.user_id !== id));
      toast.info(t("toast_removed_local"));
    } else {
      const staff = branchStaff?.find(s => s.user_id === id);
      setStaffToRemove({ id, name: staff ? `${staff.first_name} ${staff.last_name}` : "" });
    }
  };

  const confirmRemoval = () => {
    if (staffToRemove) {
      setRemovedStaffIds(prev => [...prev, staffToRemove.id]);
      setStaffToRemove(null);
      toast.warning(t("toast_marked_for_deletion"));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const pendingIds = pendingStaff.map(u => u.user_id);
      if (pendingIds.length > 0) {
        await assignStaff({ staff_ids: pendingIds });
      }
      for (const id of removedStaffIds){
         await removeStaff(id);
      }
      
      setPendingStaff([]);
      setRemovedStaffIds([]);
      toast.success(t("toast_sync_success"));
    } catch {
      toast.error(t("toast_sync_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setPendingStaff([]);
    setRemovedStaffIds([]);
    toast.info(t("toast_discarded"));
  };

  const tableData = useMemo(() => {
    const current = (branchStaff || [])
      .filter((s) => !removedStaffIds.includes(s.user_id))
      .map((s) => ({ ...s, isPending: false }));
    const pending = pendingStaff.map((u) => ({ ...u, isPending: true }));
    return [...current, ...pending] as (Staff & { isPending?: boolean })[];
  }, [branchStaff, pendingStaff, removedStaffIds]);

  const hasChanges = pendingStaff.length > 0 || removedStaffIds.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Users}
        isViewMode={isDisabled}
      />

      {!isDisabled && (
        <Card className="border shadow-none bg-slate-50/40">
          <CardHeader className="pb-4 text-left">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {t("add_card_title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t("search_label")}</label>
                <Input
                  placeholder={t("search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCatalogPage(1); }}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t("role_filter_label")}</label>
                <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCatalogPage(1); }}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={isLoadingRoles ? t("roles_loading") : t("role_all")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("role_all")}</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.role_id} value={role.name.toLowerCase()}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between items-end px-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">{t("profile_label")}</label>
                  {!isCatalogLoading && (
                    <span className="text-[9px] font-medium text-slate-400">
                      Mostrando <strong className="text-slate-600">{visibleCount}</strong> perfiles elegibles en esta página
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200/60">
                   <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white" disabled={catalogPage === 1 || isCatalogLoading} onClick={() => setCatalogPage(p => p - 1)}>
                     <ChevronLeft size={14} />
                   </Button>
                   <span className="text-[10px] font-black text-slate-600 px-1">{catalogPage} / {totalCatalogPages}</span>
                   <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white" disabled={catalogPage >= totalCatalogPages || isCatalogLoading} onClick={() => setCatalogPage(p => p + 1)}>
                     <ChevronRight size={14} />
                   </Button>
                </div>
              </div>
              
              <Select
                value={selectedUser?.user_id ?? ""}
                onValueChange={(id) => {
                  const user = filteredCatalogUsers.find(u => u.user_id === id);
                  setSelectedUser(user || null);
                }}
              >
                <SelectTrigger className="bg-white h-14 font-medium border-slate-200">
                  <SelectValue placeholder={isCatalogLoading ? t("catalog_loading") : t("profile_placeholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {filteredCatalogUsers.map((user: User) => (
                    <SelectItem key={user.user_id} value={user.user_id} className="py-3">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-[10px] font-black border border-orange-100">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {user.first_name} {user.last_name}
                            </span>
                            <Badge variant="outline" className="text-[8px] uppercase px-1 h-4 bg-slate-50 font-black">
                              {getUserRole(user).replace("_", " ")}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium truncate italic">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}

                  {visibleCount === 0 && !isCatalogLoading && (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                      <SearchX className="h-8 w-8 text-slate-200" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        {searchTerm 
                          ? "No hay coincidencias en esta página" 
                          : "No hay personal elegible en esta página"}
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
              <div className="flex gap-2">
                <Button onClick={handleAddToLocal} disabled={!selectedUser} variant="outline" size="sm" className="bg-white font-bold text-xs uppercase tracking-widest border-slate-200 shadow-sm transition-all active:scale-95">
                  <Plus size={16} className="mr-2" /> {t("btn_add_queue")}
                </Button>
                <Button onClick={handleSaveChanges} disabled={!hasChanges || isSaving} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
                  <Save size={16} className="mr-2" /> {isSaving ? t("btn_saving") : t("btn_sync")}
                </Button>
              </div>

              {hasChanges && (
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-slate-400 hover:text-orange-500 font-bold text-[10px] uppercase tracking-tighter transition-colors">
                    <RotateCcw size={14} className="mr-1" /> {t("btn_discard")}
                  </Button>
                  <Badge variant="outline" className="animate-pulse border-orange-200 text-orange-600 font-bold text-[10px]">
                    {t("badge_pending")}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-black uppercase tracking-[0.25em] text-slate-500 px-1">
          {t("total_staff_label", { count: tableData.length })}
        </h3>
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <BranchStaffTable
            data={tableData}
            isLoading={isBranchLoading}
            onRemove={handleRemoveLocal}
            isDisabled={isDisabled}
          />
        </div>
      </div>

      <GeneralAlertDialog
        open={!!staffToRemove}
        onOpenChange={(open) => !open && setStaffToRemove(null)}
        title={t("dialog_remove_title")}
        description={t("dialog_remove_description")}
        actionText={t("dialog_remove_action")}
        actionVariant="destructive"
        onAction={confirmRemoval}
      />
    </div>
  );
}