"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { FiscalDocument } from "@vitalfit/sdk";

interface FiscalFormProps {
  document: FiscalDocument;
  onChange?: (field: keyof FiscalDocument, value: string) => void;
  mode?: "view" | "edit" | "create";
  errors?: Partial<Record<keyof FiscalDocument, string>>;
}

export default function FiscalForm({
  document,
  errors = {},
  onChange = () => {},
  mode = "view",
}: FiscalFormProps) {
  const t = useTranslations("catalog.fiscal_documents.form");
  const disabled = mode === "view";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-end">

      <div className="flex flex-col space-y-2">
        <label 
          htmlFor="name" 
          className="text-[11px] font-bold text-[#1e3a5f] uppercase tracking-tight min-h-[32px] flex items-end"
        >
          {t("labels.name")}
        </label>
        <Input
          id="name"
          value={document.name || ""}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={t("placeholders.name")}
          disabled={disabled}
          className={`h-11 transition-all ${
            errors.name ? "border-red-500 bg-red-50/10" : "border-gray-200 bg-white"
          } focus-visible:ring-[#ff6b00]`}
        />
        {errors.name && (
          <p className="text-[10px] text-red-500 font-medium italic mt-1 ml-1">
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <label 
          htmlFor="prefix" 
          className="text-[11px] font-bold text-[#1e3a5f] uppercase tracking-tight min-h-[32px] flex items-end"
        >
          {t("labels.prefix")}
        </label>
        <Input
          id="prefix"
          value={document.prefix || ""}
          onChange={(e) => onChange("prefix", e.target.value)}
          placeholder={t("placeholders.prefix")}
          disabled={disabled}
          className={`h-11 transition-all ${
            errors.prefix ? "border-red-500 bg-red-50/10" : "border-gray-200 bg-white"
          } focus-visible:ring-[#ff6b00]`}
        />
        {errors.prefix && (
          <p className="text-[10px] text-red-500 font-medium italic mt-1 ml-1">
            {errors.prefix}
          </p>
        )}
      </div>
    </div>
  );
}