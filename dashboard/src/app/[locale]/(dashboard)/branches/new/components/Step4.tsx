"use client";

import { Checkbox } from "@/components/ui/checkbox";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"; // Sonner toast

type StepProps = {
  formData: any;
  formErrors?: Record<string, string>;
};

export default function Step4({ formData }: StepProps) {
  const t = useTranslations("branches");
  const [accepted, setAccepted] = React.useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setAccepted(checked);

    if (checked) {
      toast.success(t("create.form.confirm.toastTitle"), {
        description: t("create.form.confirm.toastDescription"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Título y subtítulo */}
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {t("create.form.confirm.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t("create.form.confirm.subtitle")}
        </p>

        {/* Confirmación de políticas */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700">
            {t("create.form.confirm.checkbox_label")}
          </p>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirmPolicies"
              checked={accepted}
              onCheckedChange={handleCheckboxChange}
              className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <label
              htmlFor="confirmPolicies"
              className="text-sm font-normal leading-tight text-gray-700 cursor-pointer"
            >
              {t("create.form.confirm.acceptPolicies")}{" "}
              <a
                href="/settings/policies"
                target="_blank"
                className="text-primary underline hover:text-primary/80"
              >
                {t("create.form.confirm.linkText")}
              </a>
            </label>
          </div>
        </div>

        {/* Pie de página / hint */}
        <p className="text-xs text-gray-500 mt-4">
          {t("create.form.confirm.footer_hint")}
        </p>
      </div>
    </div>
  );
}
