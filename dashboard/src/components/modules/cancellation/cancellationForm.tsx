"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/Textarea";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CancellationReason, CreateCancellationReason } from "@vitalfit/sdk";

type CancellationFormData = CreateCancellationReason | CancellationReason;

interface CancellationFormProps {
  cancellation: CancellationFormData;
  onChange?: (field: keyof CancellationFormData, value: any) => void;
  mode?: "view" | "edit" | "create";
  errors?: Partial<Record<keyof CancellationFormData, string>>;
}

export default function CancellationForm({
  cancellation,
  onChange,
  errors = {},
  mode = "view",
}: CancellationFormProps) {
  // Accedemos a las traducciones
  const t = useTranslations("catalog.cancellationReason.CausesTable");
  
  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  const handleChange = (field: keyof CancellationFormData, value: any) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Campo de Estado */}
      <div className="flex flex-col gap-2">
        <label className={cn(
          "text-sm font-semibold transition-colors",
          errors.is_active ? "text-destructive" : "text-foreground"
        )}>
          {t("columns.status")}
        </label>
        
        <Select
          value={isCreateMode ? "active" : (cancellation.is_active ? "active" : "inactive")}
          onValueChange={(value) => handleChange("is_active", value === "active")}
          disabled={isViewMode || isCreateMode}
        >
          <SelectTrigger className={cn(
            "w-full",
            isCreateMode && "bg-muted/50 cursor-default", 
            errors.is_active && "border-destructive focus:ring-destructive"
          )}>
            <SelectValue placeholder={t("status.active")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t("status.active")}</SelectItem>
            <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Texto traducido para creación */}
        {isCreateMode && (
          <p className="text-[0.75rem] text-orange-400 font-medium italic">
            {t("createModeHelp")} 
          </p>
        )}

        {errors.is_active && (
          <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            {errors.is_active}
          </p>
        )}
      </div>

      {/* Campo de Descripción */}
      <div className="flex flex-col gap-2">
        <label className={cn(
          "text-sm font-semibold transition-colors",
          errors.description ? "text-destructive" : "text-foreground"
        )}>
          {t("columns.description")}
        </label>
        
        <Textarea
          value={cancellation.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder={t("columns.descriptionPlaceholder")}
          disabled={isViewMode}
          className={cn(
            "min-h-[120px] resize-none transition-all",
            isViewMode && "bg-muted cursor-not-allowed opacity-80",
            errors.description && "border-destructive focus-visible:ring-destructive"
          )}
        />
        
        {errors.description && (
          <p className="text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            {errors.description}
          </p>
        )}
        
        {isCreateMode && (
          <p className="text-[0.8rem] text-muted-foreground">
            {t("descriptionHelp")}
          </p>
        )}
      </div>
    </div>
  );
}