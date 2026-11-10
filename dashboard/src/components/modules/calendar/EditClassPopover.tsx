"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, Pencil, Users, ChevronRight, Lock } from "lucide-react";
import ScheduleClassForm, { ScheduleClassFormData } from "./ScheduleClassForm";
import { useClassActions } from "@/hooks/class/useClassActions";
import { useCalendarResources } from "@/hooks/class/useCalendarResources";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { useBookingCount } from "@/hooks/booking/useBookingCount";
import { AttendanceSheet } from "./AttendanceSheet"; 
import { CancelClassDialog } from "./CancelClassDialog";
import { UserRole } from "@/lib/roles";

interface EditClassPopoverProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClassPopover({ classId, isOpen, onClose, onSuccess }: EditClassPopoverProps) {
  const t = useTranslations("calendar.edit_popover");
  const { token, user } = useAuth();
  const hasHydrated = useRef(false);
  const initialFormRef = useRef<ScheduleClassFormData | null>(null);

  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  
  const canModifyStructure = useMemo(() => {
    return user?.role === UserRole.SUPER_ADMIN || 
           user?.role === UserRole.BRANCH_ADMIN;
  }, [user?.role]);

  const canManageAttendance = useMemo(() => {
    const allowedRoles: string[] = [
      UserRole.SUPER_ADMIN, 
      UserRole.BRANCH_ADMIN, 
      UserRole.RECEPTIONIST, 
      UserRole.INSTRUCTOR
    ];
    return allowedRoles.includes(user?.role || "");
  }, [user?.role]);

  const { selectedClass, isLoading, isUpdating, updateClass, deleteClass } = useClassActions(token, classId);
  const { count: bookingCount, isLoading: isLoadingCount, mutate: mutateCount } = useBookingCount(token, isOpen ? classId : null);
  const [localFormData, setLocalFormData] = useState<ScheduleClassFormData | null>(null);
  const { branches, services, instructors, isLoadingResources } = useCalendarResources(token, selectedClass?.branch_id || null);

  useEffect(() => {
    if (!isOpen) {
      hasHydrated.current = false;
      initialFormRef.current = null;
      setLocalFormData(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClass?.starts_at && selectedClass?.ends_at && !hasHydrated.current) {
      const start = parseISO(selectedClass.starts_at);
      const end = parseISO(selectedClass.ends_at);

      const hydratedData: ScheduleClassFormData = {
        branch_id: selectedClass.branch_id || "",
        service_id: selectedClass.service_id || "",
        instructor_id: selectedClass.instructor_id || "",
        max_capacity: selectedClass.max_capacity ?? 10,
        is_visible: !!selectedClass.is_visible,
        recurrence: (selectedClass.recurrence as any) || "none",
        start_date: format(start, "yyyy-MM-dd"),
        start_time: format(start, "HH:mm"),
        end_time: format(end, "HH:mm"),
        end_date: format(start, "yyyy-MM-dd"),
        notes: selectedClass.notes || "",
      };

      setLocalFormData(hydratedData);
      initialFormRef.current = hydratedData;
      hasHydrated.current = true;
    }
  }, [selectedClass]);

  const handleChange = (field: keyof ScheduleClassFormData, value: any) => {
    if (!canModifyStructure) {
      return;
    }
    setLocalFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const hasChanges = useMemo(() => {
    if (!localFormData || !initialFormRef.current) {
      return false;
    }
    return JSON.stringify(localFormData) !== JSON.stringify(initialFormRef.current);
  }, [localFormData]);

  const handleUpdate = async () => {
    if (!localFormData || !hasChanges || !canModifyStructure) {
      return;
    }
    try {
      const timezoneOffset = format(new Date(), "xxx");
      const payload = {
        ...localFormData,
        starts_at: `${localFormData.start_date}T${localFormData.start_time}:00${timezoneOffset}`,
        ends_at: `${localFormData.start_date}T${localFormData.end_time}:00${timezoneOffset}`,
      };
      const success = await updateClass(payload as any, timezoneOffset);
      if (success) {
        toast.success(t("success_update"));
        await mutateCount();
        await onSuccess(); 
        onClose();
      }
    } catch {
      toast.error(t("error_save"));
    }
  };

  const handleDelete = async () => {
    if (!canModifyStructure) {
      return;
    }
    const success = await deleteClass();
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const isGlobalLoading = isLoading || isLoadingResources;
  const isCancelled = (selectedClass as { status?: string } | null)?.status === "Cancelled";
  const cancellationReason = (selectedClass as { cancellation_reason?: string } | null)?.cancellation_reason;

  return (
    <>
      <Popover open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <PopoverAnchor className="fixed top-1/2 left-1/2" />
        <PopoverContent
          align="center"
          side="top"
          sideOffset={-240}
          className="w-[440px] p-0 rounded-2xl border border-slate-200 bg-white shadow-2xl z-[40] overflow-hidden animate-in zoom-in-95 duration-200"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (isAttendanceOpen) {
              e.preventDefault();
            }
          }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-orange-600" />
              <p className="text-sm font-bold text-slate-900 leading-none">
                {canModifyStructure ? t("title") : t("details_title")}
              </p>
            </div>

            <Badge 
              variant={bookingCount >= (localFormData?.max_capacity || 0) ? "warning" : "info"} 
              className="gap-1.5 px-3"
            >
              <Users className="w-3 h-3" />
              {isLoadingCount ? "..." : `${bookingCount} / ${localFormData?.max_capacity || 0}`}
            </Badge>

            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-md text-slate-400 hover:bg-slate-50">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5 bg-slate-50/30 custom-scrollbar">
            {isGlobalLoading ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("loading")}</p>
              </div>
            ) : (
              localFormData && (
                <div className="relative flex flex-col gap-4">
                  {isCancelled && (
                    <div className="p-3 border border-red-200 rounded-xl text-red-700 text-[11px] font-semibold bg-red-50">
                      {t("cancelled_notice", { reason: cancellationReason || "-" })}
                    </div>
                  )}
                  {!canModifyStructure && (
                    <div className="p-3 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-700 text-[11px] font-semibold bg-orange-50/50">
                      <Lock className="w-4 h-4 shrink-0 text-orange-500" />
                      {t("readonly_notice")}
                    </div>
                  )}

                  {canManageAttendance && (
                    <button
                      type="button"
                      onClick={() => setIsAttendanceOpen(true)}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-orange-200 hover:bg-orange-50/50 transition-all group shadow-sm text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-none">{t("attendance.button_title")}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{t("attendance.button_description")}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                    </button>
                  )}

                  <div className="h-[1px] bg-slate-200 my-2" />

                  <ScheduleClassForm
                    formData={localFormData}
                    errors={{}}
                    onChange={handleChange}
                    branches={branches}
                    services={services}
                    instructors={instructors}
                    disabled={isUpdating || !canModifyStructure}
                    isCreateMode={false}
                  />
                </div>
              )
            )}
          </div>

          <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center">
            {canModifyStructure ? (
              <div className="flex items-center">
              {!isCancelled && (
                <CancelClassDialog
                  classId={classId}
                  onCancelled={() => {
                    onSuccess();
                    onClose();
                  }}
                />
              )}
              <GeneralAlertDialog
                title={t("delete_confirm.title")}
                description={t("delete_confirm.description")}
                actionText={t("delete_confirm.action")}
                cancelText={t("cancel")}
                actionVariant="destructive"
                onAction={handleDelete}
                trigger={
                  <Button variant="ghost" className="text-red-500 hover:bg-red-50 text-xs font-bold px-2">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("delete_button")}
                  </Button>
                }
              />
              </div>
            ) : <div />}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50">
                {t("close")}
              </Button>
              {canModifyStructure && (
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating || !hasChanges}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-black h-9 px-6 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  {isUpdating ? t("saving") : t("save_changes")}
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AttendanceSheet 
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        classId={classId}
      />
    </>
  );
}