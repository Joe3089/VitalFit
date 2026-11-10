"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMedicalProfile } from "@/hooks/clients/useMedicalProfile";
import { useMedicalActions } from "@/hooks/clients/useMedicalActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  AlertTriangle,
  Activity,
  PhoneCall,
  HeartPulse,
  Pencil,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";
import { MedicalForm } from "./MedicalForm";
import { MedicalInfoItem } from "./MedicalInfoItem";

interface Props {
  userId: string;
  token: string | null;
  canEdit: boolean; 
}

export const ClientMedicalSection = ({ userId, token, canEdit }: Props) => {
  const t = useTranslations("clients.medical");
  const [isEditing, setIsEditing] = useState(false);

  const { medicalData, isLoading, refetch } = useMedicalProfile(userId, token);
  const { saveMedicalProfile, isSubmitting } = useMedicalActions(userId, token);

  const handleProcessSave = async (formData: any) => {
    const success = await saveMedicalProfile(formData, !!medicalData);
    if (success) {
      await refetch(); 
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <HeartPulse className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex justify-between items-center border-b pb-4 text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            {t("title")}
          </h2>
        </div>
        {!isEditing && canEdit && (
          <Button
            variant={medicalData ? "outline" : "default"}
            size="sm"
            onClick={() => setIsEditing(true)}
            className="font-bold italic uppercase tracking-tighter shadow-sm"
          >
            {medicalData ? (
              <>
                <Pencil className="h-3.5 w-3.5 mr-2" /> {t("actions.update")}
              </>
            ) : (
              <>
                <PlusCircle className="h-3.5 w-3.5 mr-2" /> {t("actions.create")}
              </>
            )}
          </Button>
        )}
      </div>

      {isEditing ? (
        <MedicalForm
          initialData={medicalData}
          onSave={handleProcessSave}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

          <Card className="border-red-200 bg-red-50/20 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-red-100 mb-4 bg-red-50/50">
              <CardTitle className="text-xs font-black italic uppercase tracking-widest text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> {t("sections.alerts")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <MedicalInfoItem
                label={t("fields.allergies")}
                value={medicalData?.allergies}
                icon={<ShieldAlert className="h-3.5 w-3.5 text-red-400" />}
                isCritical
              />
              <MedicalInfoItem
                label={t("fields.warnings")}
                value={medicalData?.warnings}
                isCritical
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-primary/10 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30 mb-4">
              <CardTitle className="text-xs font-black italic uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> {t("sections.profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <MedicalInfoItem
                label={t("fields.blood_type")}
                value={medicalData?.blood_type}
                isBadge
              />
              <MedicalInfoItem
                label={t("fields.emergency_contact")}
                value={medicalData?.emergency_contact}
                icon={<PhoneCall className="h-3.5 w-3.5 text-primary/40" />}
              />
              <MedicalInfoItem
                label={t("fields.conditions")}
                value={medicalData?.medical_conditions}
                fullWidth
              />
              <MedicalInfoItem
                label={t("fields.medications")}
                value={medicalData?.medications}
                fullWidth
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};