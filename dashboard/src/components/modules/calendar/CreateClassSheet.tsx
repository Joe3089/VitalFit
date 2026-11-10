"use client";

import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ScheduleClassForm from "./ScheduleClassForm";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useCreateScheduleClassForm } from "@/hooks/class/useCreateScheduleClassForm";
import { CreateClassPayload } from "@vitalfit/sdk";
import { format } from "date-fns";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { getScheduleClassSchema } from "@/lib/validation/scheduleClassSchema";
import { Loader2, MapPinIcon, AlertCircle } from "lucide-react";

interface CreateClassSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClassSheet({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateClassSheetProps) {
  const t = useTranslations("calendar.create_sheet");
  const tForm = useTranslations("calendar.form");
  
  const { token, user } = useAuth();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const managedBranchIds = useMemo(() => {
    if (user?.role === "super_admin") {
      return [];
    }
    
    const activeId =
      typeof user?.activeBranch === "string"
        ? user.activeBranch
        : user?.activeBranch?.id;

    return activeId ? [activeId] : ["no-access"];
  }, [user]);

  const { 
    formData, 
    handleChange, 
    isLoading: isResourcesLoading, 
    isSubmitting, 
    setIsSubmitting, 
    resources 
  } = useCreateScheduleClassForm(token || "", managedBranchIds);

  const hasAccess = user?.role === "super_admin" || (managedBranchIds.length > 0 && managedBranchIds[0] !== "no-access");

  const handleSave = async () => {
    if (!token || !formData.branch_id) {
      toast.error(t("errors.missing_data"));
      return;
    }

    const schema = getScheduleClassSchema(tForm);
    const result = schema.safeParse(formData);

    if (!result.success) {
      const formatted: Record<string, string> = {};
      result.error.issues.forEach((issue: z.ZodIssue) => {
        formatted[issue.path[0] as string] = issue.message;
      });
      setFormErrors(formatted);
      toast.error(t("errors.check_fields"));
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const localOffset = format(new Date(), "xxx");
      const { data } = result;
      const hasRecurrence = data.recurrence && data.recurrence !== "none";

      const payload: CreateClassPayload = {
        service_id: data.service_id,
        instructor_id: data.instructor_id,
        starts_at: `${data.start_date}T${data.start_time}:00${localOffset}`,
        ends_at: `${data.start_date}T${data.end_time}:00${localOffset}`,
        max_capacity: Number(data.max_capacity),
        is_visible: !!data.is_visible,
        notes: data.notes || "",
        recurrence: hasRecurrence ? (data.recurrence as any) : undefined,
        recurrence_until:
          hasRecurrence && data.recurrence_until
            ? `${data.recurrence_until}T23:59:59${localOffset}`
            : undefined,
      };

      await api.schedule.CreateClass(data.branch_id, payload, token);
      toast.success(t("success"));
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || "";
      
      if (apiMessage === "the branch is closed on the selected start date") {
        toast.error(t("errors.branch_closed"), {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          duration: 5000,
        });
      } else {
        toast.error(apiMessage || t("errors.server_error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          setFormErrors({});
        }
        onOpenChange(o);
      }}
    >
      <SheetContent className="sm:max-w-[500px] overflow-y-auto border-l border-slate-100 p-0 bg-white">
        {!hasAccess ? (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-4">
            <div className="bg-slate-50 p-6 rounded-full shadow-inner">
              <MapPinIcon className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t("restricted_title")}</h2>
            <p className="text-sm text-slate-500 max-w-[280px]">
              {t("restricted_description")}
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="mt-4 rounded-xl px-8">
              {t("close")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 sticky top-0 z-20 backdrop-blur-sm">
              <SheetHeader>
                <SheetTitle className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  <span className="text-orange-500 font-mono">/</span> {t("title")}
                </SheetTitle>
                <SheetDescription className="text-slate-500 font-medium text-sm">
                  {t("description")}
                </SheetDescription>
              </SheetHeader>
            </div>
            <div className="flex-1 p-6">
              {isResourcesLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-orange-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    {t("syncing")}
                  </p>
                </div>
              ) : (
                <ScheduleClassForm
                  formData={formData}
                  errors={formErrors}
                  onChange={handleChange}
                  branches={resources.branches}
                  instructors={resources.instructors}
                  services={resources.services}
                  disabled={isSubmitting}
                  isCreateMode={true}
                />
              )}
            </div>
            <div className="p-6 border-t border-slate-50 bg-white sticky bottom-0 z-10 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
              <SheetFooter className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-slate-400 font-bold rounded-xl"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting || isResourcesLoading || !formData.branch_id}
                  className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("submitting")}</span>
                    </div>
                  ) : (
                    t("confirm")
                  )}
                </Button>
              </SheetFooter>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}