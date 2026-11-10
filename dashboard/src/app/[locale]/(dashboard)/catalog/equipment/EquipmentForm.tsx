"use client";

import { EquipmentCategory } from "@/models/equipment";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/Textarea";
import { Equipment, EquipmentInfo } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";

type EquipmentWithBrand = Partial<EquipmentInfo> & {
  brand?: string;
  model?: string;
  category?: any;
};

interface EquipmentFormProps {
  equipment: EquipmentWithBrand;
  onChange?: (field: keyof EquipmentWithBrand, value: string) => void;
  mode?: "view" | "edit";
  errors?: Partial<Record<keyof Equipment, string>>;
}

export default function EquipmentForm({
  equipment,
  errors = {},
  onChange = () => { },
  mode = "view",
}: EquipmentFormProps) {
  const t = useTranslations("catalog.equipment.form");
  const tCategories = useTranslations("catalog.equipment.categories");
  const disabled = mode === "view";

  const categories: EquipmentCategory[] = [
    "Cardio",
    "Strength",
    "FreeWeight",
    "Functional",
    "Accessory",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">{t("labels.name")}</label>
        <Input
          value={equipment.name ?? ""}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={t("placeholders.name")}
          disabled={disabled}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">{t("labels.category")}</label>
        <Select
          value={equipment.category ?? ""}
          onValueChange={(value) => onChange("category", value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.category")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {tCategories(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category}</p>
        )}
      </div>

      <div className="flex flex-col col-span-1 md:col-span-2">
        <label className="text-sm font-medium mb-1">{t("labels.description")}</label>
        <Textarea
          value={equipment.description ?? ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder={t("placeholders.description")}
          disabled={disabled}
          className="min-h-[100px]"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">{t("labels.model")}</label>
        <Input
          value={equipment.model ?? ""}
          onChange={(e) => onChange("model", e.target.value)}
          placeholder={t("placeholders.model")}
          disabled={disabled}
        />
        {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium mb-1">{t("labels.brand")}</label>
        <Input
          value={equipment.brand ?? ""}
          onChange={(e) => onChange("brand", e.target.value)}
          placeholder={t("placeholders.brand")}
          disabled={disabled}
        />
        {errors.brand && <p className="text-sm text-red-500">{errors.brand}</p>}
      </div>
    </div>
  );
}
