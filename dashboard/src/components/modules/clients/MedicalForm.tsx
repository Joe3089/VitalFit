"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl"; // Importamos para traducciones
import { MedicalProfile } from "@vitalfit/sdk";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Save, X, Loader2 } from "lucide-react";

interface Props {
  initialData: MedicalProfile | null;
  onSave: (data: MedicalProfile) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const MedicalForm = ({ initialData, onSave, onCancel, isSubmitting }: Props) => {
  const t = useTranslations("clients.medical"); 
  const { register, handleSubmit } = useForm<MedicalProfile>({
    defaultValues: initialData || {}
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 text-left">
      <Card className="border-primary/20 shadow-inner">
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              {t("fields.blood_type")}
            </label>
            <Input 
              {...register("blood_type")} 
              placeholder={t("placeholders.blood_type")} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              {t("fields.emergency_contact")}
            </label>
            <Input 
              {...register("emergency_contact")} 
              placeholder={t("placeholders.emergency_contact")} 
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="text-[10px] font-bold uppercase text-red-500">
              {t("fields.allergies")}
            </label>
            <Textarea 
              {...register("allergies")} 
              placeholder={t("placeholders.allergies")} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              {t("fields.conditions")}
            </label>
            <Textarea 
              {...register("medical_conditions")} 
              placeholder={t("placeholders.conditions")} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              {t("fields.medications")}
            </label>
            <Textarea 
              {...register("medications")} 
              placeholder={t("placeholders.medications")} 
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="text-[10px] font-bold uppercase text-red-500">
              {t("fields.warnings")}
            </label>
            <Textarea 
              {...register("warnings")} 
              placeholder={t("placeholders.warnings")} 
            />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" /> {t("form_actions.cancel")}
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="italic font-bold uppercase tracking-tighter"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t("form_actions.save")}
        </Button>
      </div>
    </form>
  );
};