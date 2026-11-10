"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InputField from "@/components/ui/InputField";
import { PhoneInput } from "@/components/ui/phone-input";
import StepNotification from "../../StepNotification";

type StepProps = {
  formData: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  handleCustomChange: (field: string, value: string) => void;
  formErrors?: Record<string, string>;
};

import { useTranslations } from "next-intl";

export default function Step1({
  formData,
  handleChange,
  handleCustomChange,
  formErrors = {},
}: StepProps) {
  const t = useTranslations("branches");
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
        {t("create.form.basic_info.title")}
      </h3>
      <p className="text-sm text-gray-600 -mt-4">
        {t("create.form.basic_info.subtitle")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          id="name"
          name="name"
          label={t("create.form.basic_info.name")}
          type="text"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder={t("create.form.basic_info.name_placeholder")}
          error={formErrors["name"]}
        />

        <InputField
          id="taxId"
          name="taxId"
          label={t("create.form.basic_info.tax_id")}
          type="text"
          value={formData.taxId || ""}
          onChange={handleChange}
          placeholder={t("create.form.basic_info.tax_id_placeholder")}
          error={formErrors["taxId"]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor="phone"
            className={`text-sm font-medium ${formErrors["phone"] ? "text-red-600" : "text-gray-800"
              }`}
          >
            {t("create.form.basic_info.phone")}
          </label>
          <PhoneInput
            id="phone"
            name="phone"
            value={formData.phone ? (formData.phone.startsWith("+") ? formData.phone : `+${formData.phone}`) : ""}
            onChange={(value) => {
              handleChange({
                target: { name: "phone", value: value || "" },
              } as any);
            }}
            defaultCountry="VE"
            className={formErrors["phone"] ? "border-red-500" : "border-gray-300"}
          />
          {formErrors["phone"] && (
            <p className="text-xs text-red-600">{formErrors["phone"]}</p>
          )}
        </div>

        <div>
          <label htmlFor="status">{t("create.form.basic_info.status")}</label>
          <Select
            value={formData.status || "active"}
            onValueChange={(value) => handleCustomChange("status", value)}
          >
            <SelectTrigger id="status" className="mt-1 w-full">
              <SelectValue placeholder={t("create.form.basic_info.status_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("table.status.active")}</SelectItem>
              <SelectItem value="inactive">{t("table.status.inactive")}</SelectItem>
              <SelectItem value="maintenance">{t("table.status.maintenance")}</SelectItem>
            </SelectContent>
          </Select>
          {formErrors["status"] && (
            <p className="text-sm text-red-500 mt-1">{formErrors["status"]}</p>
          )}
        </div>
      </div>
      <StepNotification
        title={t("create.form.basic_info.next_steps.title")}
        description={t("create.form.basic_info.next_steps.description")}
      />
    </div>
  );
}
