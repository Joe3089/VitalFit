"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Plus, 
  Save, 
  Trash2, 
  UserRound, 
  RotateCcw,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { BranchInstructorInfo, InstructorDataList } from "@vitalfit/sdk";

import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import EntityItem from "@/components/layout/EntityItem";
import { PaginationControls } from "@/components/ui/table/PaginationControls";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { InstructorGlobalSelector } from "@/components/modules/branches/InstructorGlobalSelector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "@/components/modules/branches/SectionHeader";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

export default function BranchInstructorPanel({ 
  branchId, 
  mode = "edit" 
}: { 
  branchId: string; 
  mode?: "view" | "edit" 
}) {
  const t = useTranslations("branches.details.instructors");
  const { token } = useAuth();
  const isViewMode = mode === "view";


  const [branchInstructors, setBranchInstructors] = useState<BranchInstructorInfo[]>([]);
  const [newInstructorIds, setNewInstructorIds] = useState<string[]>([]);
  const [removedInstructorIds, setRemovedInstructorIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [branchPage, setBranchPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTemp, setSelectedTemp] = useState<InstructorDataList | null>(null);
  const [instructorToRemove, setInstructorToRemove] = useState<{ id: string; name: string } | null>(null);

  const fetchBranchInstructors = useCallback(async () => {
    if (!token || !branchId) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.instructor.getBranchInstructors(branchId, {}, token);
      setBranchInstructors((res.data || []).map((i: any) => ({
        instructorID: i.instructor_id,
        instructorName: i.instructor_name,
        email: i.email,
        phone: i.phone,
      })));
      setNewInstructorIds([]);
      setRemovedInstructorIds([]);
    } catch (err) {
      toast.error(t("toast_error_load"));
    } finally {
      setLoading(false);
    }
  }, [token, branchId, t]);

  useEffect(() => { fetchBranchInstructors(); }, [fetchBranchInstructors]);


  const handleAddPending = () => {
    if (!selectedTemp) {
      return;
    }

    const isAlreadyInBranch = branchInstructors.some(i => i.instructorID === selectedTemp.instructor_id);
    const isInRemovedList = removedInstructorIds.includes(selectedTemp.instructor_id);

    if (isAlreadyInBranch && !isInRemovedList) {
      toast.warning(t("toast_already_exists"));
      return;
    }

    if (isInRemovedList) {

      setRemovedInstructorIds(prev => prev.filter(id => id !== selectedTemp.instructor_id));
    } else {

      setBranchInstructors(prev => [...prev, {
        instructorID: selectedTemp.instructor_id,
        instructorName: `${selectedTemp.first_name} ${selectedTemp.last_name}`,
        email: selectedTemp.email ?? "",
        phone: selectedTemp.phone ?? ""
      }]);
      setNewInstructorIds(prev => [...prev, selectedTemp.instructor_id]);
    }

    setSelectedTemp(null);
    toast.success(t("toast_added_local"));
  };

  const handleRemoveClick = (id: string, name: string) => {
    if (newInstructorIds.includes(id)) {

      setBranchInstructors(prev => prev.filter(i => i.instructorID !== id));
      setNewInstructorIds(prev => prev.filter(curr => curr !== id));
      toast.info(t("toast_removed_local"));
    } else {

      setInstructorToRemove({ id, name });
    }
  };

  const confirmRemoval = () => {
    if (instructorToRemove) {
      setRemovedInstructorIds(prev => [...prev, instructorToRemove.id]);
      setInstructorToRemove(null);
      toast.warning(t("toast_marked_for_deletion"));
    }
  };

  const handleSave = async () => {
    if (!token) {
      return;
    }
    setIsSaving(true);
    try {

      if (newInstructorIds.length > 0) {
        await api.instructor.addBranchInstructor(branchId, newInstructorIds, token);
      }
      // 2. Eliminar marcados
      for (const id of removedInstructorIds) {
        await api.instructor.removeBranchInstructor(branchId, id, token);
      }

      toast.success(t("toast_sync_success"));
      await fetchBranchInstructors(); 
    } catch {
      toast.error(t("toast_sync_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    fetchBranchInstructors();
    toast.info(t("toast_discarded"));
  };

  const displayedInstructors = useMemo(() => {
    return branchInstructors.filter(i => !removedInstructorIds.includes(i.instructorID));
  }, [branchInstructors, removedInstructorIds]);

  const paginatedData = useMemo(() => {
    const start = (branchPage - 1) * pageSize;
    return displayedInstructors.slice(start, start + pageSize);
  }, [displayedInstructors, branchPage, pageSize]);

  const hasChanges = newInstructorIds.length > 0 || removedInstructorIds.length > 0;
  const totalPages = Math.ceil(displayedInstructors.length / pageSize) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={UserRound}
        isViewMode={isViewMode}
      />
      
      {!isViewMode && token && (
        <div className="p-6 border rounded-2xl bg-slate-50/50 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
              {t("add_card_title")}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow">
                <InstructorGlobalSelector
                  token={token}
                  onSelect={setSelectedTemp}
                  excludeIds={displayedInstructors.map(i => i.instructorID)}
                  placeholder={t("selector_placeholder")}
                />
              </div>
              <Button
                onClick={handleAddPending}
                disabled={!selectedTemp}
                variant="outline"
                className="bg-white font-bold text-xs uppercase tracking-widest border-slate-200 shadow-sm transition-all active:scale-95"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("btn_add")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="font-bold text-xs uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-100 transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? t("btn_saving") : t("btn_sync")}
              </Button>
              {hasChanges && (
                <Button
                  variant="ghost"
                  onClick={handleDiscard}
                  className="text-slate-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-tighter"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  {t("btn_discard")}
                </Button>
              )}
            </div>
            {hasChanges && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-100 animate-pulse font-black text-[10px]">
                {t("badge_pending")}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <h3 className="font-black uppercase tracking-[0.25em] text-slate-500">
            {t("total_label", { count: displayedInstructors.length })}
          </h3>
        </div>

        <div className="rounded-xl border bg-white divide-y overflow-hidden shadow-sm">
          {loading && branchInstructors.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase animate-pulse tracking-widest italic">
              {t("loading")}
            </div>
          ) : displayedInstructors.length === 0 ? (
            <div className="p-12 text-center text-slate-300">
              <UserRound className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-[10px] uppercase font-black tracking-[0.2em]">{t("empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedData.map(instr => (
                <div key={instr.instructorID} className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                  <EntityItem
                    title={instr.instructorName}
                    description={instr.email}
                    initials={instr.instructorName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  />
                  {!isViewMode && (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClick(instr.instructorID, instr.instructorName)}
                        className="h-9 w-9 text-slate-400 hover:text-destructive hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {displayedInstructors.length > 0 && (
          <div className="flex items-center justify-between pt-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t("show_label")}</span>
              <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); setBranchPage(1); }}>
                <SelectTrigger className="h-8 w-16 text-[11px] font-bold border-slate-200 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20].map(s => <SelectItem key={s} value={s.toString()} className="text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <PaginationControls
              page={branchPage}
              totalPages={totalPages}
              onPageChange={setBranchPage}
            />
          </div>
        )}
      </div>

      <GeneralAlertDialog
        open={!!instructorToRemove}
        onOpenChange={(open) => !open && setInstructorToRemove(null)}
        title={t("dialog_remove_title")}
        description={t("dialog_remove_description")}
        actionText={t("dialog_remove_action")}
        actionVariant="destructive"
        onAction={confirmRemoval}
      />
    </div>
  );
}