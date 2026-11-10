"use client";

import React from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale"; 
import { 
  Clock, AlignLeft, Info, Calendar as CalendarIcon, CalendarDays, Users, Plus, Minus
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

export interface ScheduleClassFormData {
  branch_id: string;
  service_id: string;
  instructor_id: string;
  start_date: string;
  start_time: string;
  end_time: string;
  end_date?: string; 
  max_capacity: number;
  is_visible: boolean;
  notes?: string;
  recurrence?: "none" | "daily" | "weekly";
  recurrence_until?: string | null;
}

interface ScheduleClassFormProps {
  formData: ScheduleClassFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ScheduleClassFormData, value: any) => void;
  branches: any[];
  services: any[];
  instructors: any[];
  disabled?: boolean;
  isCreateMode?: boolean;
}

export default function ScheduleClassForm({
  formData,
  errors,
  onChange,
  branches = [],
  services = [],
  instructors = [],
  disabled = false,
  isCreateMode = false,
}: ScheduleClassFormProps) {
  
  const t = useTranslations("calendar.form");
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;

  const isBranchSelected = !!formData.branch_id;

  const handleChange = (field: keyof ScheduleClassFormData, value: any) => {
    if (disabled) {
      return;
    };
    onChange(field, value);
  };

  const ErrorMsg = ({ field }: { field: string }) => 
    errors[field] ? (
      <span className="text-[10px] font-medium text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
        {errors[field]}
      </span>
    ) : null;

  return (
    <div className="flex flex-col gap-6 w-full bg-white">

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-orange-500" /> {t("sections.general")}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t("fields.visible")}</span>
            <Switch
              checked={!!formData.is_visible}
              onCheckedChange={(v) => handleChange("is_visible", v)}
              disabled={disabled}
              className="data-[state=checked]:bg-orange-500 scale-90"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className={cn("text-xs font-medium", errors.branch_id ? "text-red-500" : "text-slate-600")}>{t("fields.branch")}</Label>
              <ErrorMsg field="branch_id" />
            </div>
            <Select
              value={formData.branch_id || ""}
              onValueChange={(v) => handleChange("branch_id", v)}
              disabled={disabled || !isCreateMode}
            >
              <SelectTrigger className={cn("h-10 border-slate-200", errors.branch_id && "border-red-400")}>
                <SelectValue placeholder={t("placeholders.branch")} />
              </SelectTrigger>
              <SelectContent className="z-[150] max-h-60">
                {branches.map((b) => (
                  <SelectItem key={b.branch_id} value={b.branch_id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className={cn("text-xs font-medium", errors.service_id ? "text-red-500" : "text-slate-600")}>{t("fields.service")}</Label>
              <ErrorMsg field="service_id" />
            </div>
            <Select
              value={formData.service_id || ""}
              onValueChange={(v) => handleChange("service_id", v)}
              disabled={disabled || !isBranchSelected}
            >
              <SelectTrigger className={cn("h-10 border-slate-200", errors.service_id && "border-red-400")}>
                <SelectValue placeholder={t("placeholders.service")} />
              </SelectTrigger>
              <SelectContent className="z-[150] max-h-60">
                {services.map((s) => (
                  <SelectItem key={s.service_id} value={s.service_id}>{s.service_name || s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className={cn("text-xs font-medium", errors.instructor_id ? "text-red-500" : "text-slate-600")}>{t("fields.instructor")}</Label>
              <ErrorMsg field="instructor_id" />
            </div>
            <Select
              value={formData.instructor_id || ""}
              onValueChange={(v) => handleChange("instructor_id", v)}
              disabled={disabled || !isBranchSelected}
            >
              <SelectTrigger className={cn("h-10 border-slate-200", errors.instructor_id && "border-red-400")}>
                <SelectValue placeholder={t("placeholders.instructor")} />
              </SelectTrigger>
              <SelectContent className="z-[150] max-h-60">
                {instructors.map((i) => (
                  <SelectItem key={i.instructor_id} value={i.instructor_id}>{i.instructor_name || i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock className="w-3.5 h-3.5 text-orange-500" /> {t("sections.schedule")}
        </Label>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label className={cn("text-xs font-medium", errors.start_date ? "text-red-500" : "text-slate-600")}>{t("fields.date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full h-10 justify-start border-slate-200", errors.start_date && "border-red-400")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                  {formData.start_date ? format(new Date(formData.start_date + "T00:00:00"), "PPP", { locale: dateLocale }) : t("placeholders.date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 z-[160]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.start_date ? new Date(formData.start_date + "T00:00:00") : undefined}
                  onSelect={(d) => d && handleChange("start_date", format(d, "yyyy-MM-dd"))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">{t("fields.start_time")}</Label>
              <Input
                type="time"
                value={formData.start_time || ""}
                onChange={(e) => handleChange("start_time", e.target.value)}
                className="h-10 border-slate-200 focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-orange-600">{t("fields.end_time")}</Label>
              <Input
                type="time"
                value={formData.end_time || ""}
                onChange={(e) => handleChange("end_time", e.target.value)}
                className="h-10 border-orange-200 bg-orange-50/20 text-orange-700 font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
          <Users className="w-3.5 h-3.5 text-orange-500" /> {t("sections.capacity")}
        </Label>

        <div className="space-y-1.5">
          <Label className={cn("text-xs font-medium", errors.max_capacity ? "text-red-500" : "text-slate-600")}>
            {t("fields.max_capacity")}
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min={1}
                value={formData.max_capacity || ""}
                onChange={(e) => handleChange("max_capacity", parseInt(e.target.value) || 0)}
                disabled={disabled}
                className="h-10 border-slate-200 font-bold pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">
                {t("suffix.slots")}
              </span>
            </div>
            {!disabled && (
              <div className="flex border border-slate-200 rounded-xl overflow-hidden h-10">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-full w-10 rounded-none border-r border-slate-100 hover:bg-slate-50"
                  onClick={() => handleChange("max_capacity", Math.max(1, (formData.max_capacity || 0) - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-full w-10 rounded-none hover:bg-slate-50"
                  onClick={() => handleChange("max_capacity", (formData.max_capacity || 0) + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <ErrorMsg field="max_capacity" />
        </div>

        {isCreateMode && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">{t("fields.recurrence")}</Label>
              <Select value={formData.recurrence || "none"} onValueChange={(v) => handleChange("recurrence", v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[150]">
                  <SelectItem value="none">{t("recurrence_options.none")}</SelectItem>
                  <SelectItem value="daily">{t("recurrence_options.daily")}</SelectItem>
                  <SelectItem value="weekly">{t("recurrence_options.weekly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recurrence !== "none" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label className="text-xs font-medium text-orange-600 italic">{t("fields.recurrence_until")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-10 justify-start border-orange-200 text-orange-700 bg-orange-50/10">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.recurrence_until ? format(new Date(formData.recurrence_until + "T00:00:00"), "PPP", { locale: dateLocale }) : t("placeholders.until")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 z-[160]" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.recurrence_until ? new Date(formData.recurrence_until + "T00:00:00") : undefined}
                      onSelect={(d) => d && handleChange("recurrence_until", format(d, "yyyy-MM-dd"))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <AlignLeft className="w-3.5 h-3.5 text-orange-500" /> {t("sections.notes")}
        </Label>
        <Textarea
          value={formData.notes || ""}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder={t("placeholders.notes")}
          className="min-h-[80px] border-slate-200 focus-visible:ring-orange-500 resize-none text-xs rounded-xl"
        />
      </div>
    </div>
  );
}