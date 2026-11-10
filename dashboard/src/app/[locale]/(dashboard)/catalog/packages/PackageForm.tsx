"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar24 } from "@/components/layout/Calendar24";
import { Button } from "@/components/ui/button";
import EntityItem from "@/components/layout/EntityItem";
import { useTranslations } from "next-intl";

export interface PackageItemUI {
  serviceId: string;
  sessionsIncluded: number;
  name: string;
}

export interface PackageFormState {
  name: string;
  description: string;
  price: number;
  startAt: string;
  endAt: string;
  packageItems: PackageItemUI[];
  isActive?: boolean;
}

interface PackageFormProps {
  formData: PackageFormState;
  onChange?: (data: Partial<PackageFormState>) => void;
  mode?: "view" | "edit";
  services?: { id: string; name: string }[];
  errors?: Record<string, string>; 
}

export default function PackageForm({
  formData,
  onChange,
  mode = "view",
  services = [],
  errors = {},
}: PackageFormProps) {
  const isEditable = mode !== "view";
  const t = useTranslations("catalog.packages");

  const handleFieldChange = <K extends keyof PackageFormState>(
    field: K,
    value: PackageFormState[K],
  ) => {
    if (!isEditable) {
      return;
    }
    onChange?.({ [field]: value });
  };

  const handleUpdateSessions = (serviceId: string, value: number) => {
    if (!isEditable) {
      return;
    }
    const updatedItems = formData.packageItems.map((item) =>
      item.serviceId === serviceId
        ? { ...item, sessionsIncluded: value }
        : item,
    );
    onChange?.({ packageItems: updatedItems });
  };

  const handleRemoveService = (serviceId: string) => {
    if (!isEditable) {
      return;
    }
    const updatedItems = formData.packageItems.filter(
      (item) => item.serviceId !== serviceId,
    );
    onChange?.({ packageItems: updatedItems });
  };

  const handleAddService = (serviceId: string) => {
    if (!isEditable || !serviceId) {
      return;
    }
    if (formData.packageItems.some((i) => i.serviceId === serviceId)) {
      return;
    }
    
    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      return;
    }

    const newItem: PackageItemUI = {
      serviceId,
      name: service.name,
      sessionsIncluded: 1,
    };
    onChange?.({ packageItems: [...formData.packageItems, newItem] });
  };

  const dateStart = formData.startAt ? new Date(formData.startAt) : undefined;
  const dateEnd = formData.endAt ? new Date(formData.endAt) : undefined;


  const labelClass = "text-[11px] font-bold text-[#1e3a5f] uppercase tracking-tight mb-2 block";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="flex flex-col">
          <label className={labelClass}>{t("form.labels.name")}</label>
          <Input
            disabled={!isEditable}
            value={formData.name || ""}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            className={`h-11 ${errors.name ? "border-red-500 bg-red-50/10" : "border-slate-200"}`}
          />
          {errors.name && <p className="text-[10px] text-red-500 font-medium italic mt-1.5 ml-1">{errors.name}</p>}
        </div>


        <div className="flex flex-col">
          <label className={labelClass}>{t("form.labels.price")}</label>
          <Input
            type="number"
            disabled={!isEditable}
            value={formData.price || 0}
            onChange={(e) => handleFieldChange("price", Number(e.target.value))}
            className={`h-11 ${errors.price ? "border-red-500 bg-red-50/10" : "border-slate-200"}`}
          />
          {errors.price && <p className="text-[10px] text-red-500 font-medium italic mt-1.5 ml-1">{errors.price}</p>}
        </div>
      </div>


      <div className="flex flex-col">
        <label className={labelClass}>{t("form.labels.description")}</label>
        <Textarea
          disabled={!isEditable}
          value={formData.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          className={`min-h-[100px] ${errors.description ? "border-red-500 bg-red-50/10" : "border-slate-200"}`}
        />
        {errors.description && <p className="text-[10px] text-red-500 font-medium italic mt-1.5 ml-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="flex flex-col">
          <label className={labelClass}>{t("form.labels.start_at")}</label>
          <Calendar24
            date={dateStart}
            disabled={!isEditable}
            onChange={(d) => d && handleFieldChange("startAt", d.toISOString())}
          />
          {errors.startAt && <p className="text-[10px] text-red-500 font-medium italic mt-1.5 ml-1">{errors.startAt}</p>}
        </div>

        <div className="flex flex-col">
          <label className={labelClass}>{t("form.labels.end_at")}</label>
          <Calendar24
            date={dateEnd}
            disabled={!isEditable}
            onChange={(d) => d && handleFieldChange("endAt", d.toISOString())}
          />
          {errors.endAt && <p className="text-[10px] text-red-500 font-medium italic mt-1.5 ml-1">{errors.endAt}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <label className={labelClass}>{t("form.labels.services_included")}</label>

        {isEditable && services.length > 0 && (
          <div className="mb-4">
            <select
              className="w-full h-11 px-4 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b00] transition-all"
              onChange={(e) => handleAddService(e.target.value)}
              value=""
            >
              <option value="" disabled>{t("form.placeholders.select_service")}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.packageItems && <p className="text-[10px] text-red-500 font-medium italic mt-1.5 ml-1">{errors.packageItems}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {formData.packageItems.map((item) => {
            const serviceName = services.find((s) => s.id === item.serviceId)?.name || item.name;
            return (
              <EntityItem
                key={item.serviceId}
                title={serviceName}
                initials={serviceName.substring(0, 2).toUpperCase()}
                action={
                  isEditable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveService(item.serviceId)}
                    >
                      {t("form.labels.remove")}
                    </Button>
                  )
                }
              >
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex flex-col flex-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                        {t("form.labels.sessions_count")}
                      </span>
                      <Input
                        type="number"
                        min={1}
                        disabled={!isEditable}
                        value={item.sessionsIncluded}
                        onChange={(e) => handleUpdateSessions(item.serviceId, Number(e.target.value))}
                        className="h-9 w-24 border-slate-200"
                      />
                   </div>
                </div>
              </EntityItem>
            );
          })}
        </div>
      </div>

      {"isActive" in formData && (
        <div className="pt-4 flex items-center gap-3">
          <label className="text-[11px] font-bold text-[#1e3a5f] uppercase">{t("form.labels.status")}:</label>
          <Badge
            variant="outline"
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              formData.isActive
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-yellow-50 border-yellow-200 text-yellow-700"
            }`}
          >
            {formData.isActive ? t("table.status.active") : t("table.status.inactive")}
          </Badge>
        </div>
      )}
    </div>
  );
}