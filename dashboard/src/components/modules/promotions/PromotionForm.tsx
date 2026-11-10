"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { promotionSchema } from "@/lib/validation/promotionSchema";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

type FormMode = "create" | "edit" | "view";

interface PromotionFormProps {
  initialData?: any;
  onSubmit: (data: any, isDirty: boolean) => void;
  mode?: FormMode;
}

export default function PromotionForm({
  initialData,
  onSubmit,
  mode = "create"
}: PromotionFormProps) {
  const t = useTranslations("catalog.Promotions.form");
  
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isDirty }, 
  } = useForm({
    resolver: zodResolver(promotionSchema),
    defaultValues: initialData || {
      name: "",
      code: "",
      discount_type: "Percentage",
      discount_value: 0,
      start_date: "",
      end_date: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const discountType = watch("discount_type");

  const handleInternalSubmit = (data: any) => {
    onSubmit(data, isDirty);
  };

  return (
    <form
      id="promotion-form"
      onSubmit={handleSubmit(handleInternalSubmit)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("labels.name")}</label>
          <Input
            {...register("name")}
            disabled={isViewMode}
            placeholder={t("placeholders.name")}
          />
          {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("labels.code")}</label>
          <Input
            {...register("code")}
            disabled={isViewMode || isEditMode}
            placeholder={t("placeholders.code")}
            className="uppercase font-mono"
          />
          {errors.code && <p className="text-xs text-red-500 font-medium">{errors.code.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("labels.type")}</label>
          <Select
            disabled={isViewMode}
            value={discountType}
            onValueChange={(v) => setValue("discount_type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("placeholders.type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Percentage">{t("placeholders.percentage")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800">{t("labels.value")}</label>
          <Input
            type="number"
            disabled={isViewMode}
            {...register("discount_value", { valueAsNumber: true })}
            placeholder={discountType === "Percentage" ? "20" : "50.00"}
          />
          {errors.discount_value && <p className="text-xs text-red-500 font-medium">{errors.discount_value.message as string}</p>}
        </div>


        <div className="space-y-2">
          <label className="text-sm font-medium">{t("labels.start_date")}</label>
          <Input
            type="date"
            disabled={isViewMode}
            {...register("start_date")}
          />
          {errors.start_date && <p className="text-xs text-red-500 font-medium">{errors.start_date.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("labels.end_date")}</label>
          <Input
            type="date"
            disabled={isViewMode}
            {...register("end_date")}
          />
          {errors.end_date && <p className="text-xs text-red-500 font-medium">{errors.end_date.message as string}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="is_active"
              disabled={isViewMode}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
          {t("labels.is_active")}
        </label>
      </div>
    </form>
  );
}