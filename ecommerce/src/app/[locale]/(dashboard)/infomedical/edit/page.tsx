"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Activity, Save, X } from "lucide-react";
import { toast } from "sonner";
import useMedicalProfile from "@/hooks/useMedicalProfile";
import type { MedicalProfile } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";

export default function EditMedicalInfoPage() {
  const t = useTranslations("MedicalInfo");
  const { token } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    allergies: "",
    warnings: "",
    medical_risks: "",
    bloodType: "NO_ESPECIFICADO", // Cambiar valor por defecto
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    medicalConditions: "",
    currentMedication: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    medicalProfile: loadedProfile,
    isLoading: profileLoading,
    save,
  } = useMedicalProfile();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [token, router]);

  useEffect(() => {
    // Cuando la carga del perfil termina, inicializamos el formulario
    if (!profileLoading) {
      if (loadedProfile) {
        // Si hay perfil existente, cargamos los datos
        const parseEmergencyContact = (contact: string) => {
          const match = contact.match(/^(.+?)\s*\((.+?)\)\s*-\s*(.+)$/);
          if (match) {
            return {
              name: match[1].trim(),
              relation: match[2].trim(),
              phone: match[3].trim(),
            };
          }
          return { name: contact, relation: "", phone: "" };
        };

        const emergencyContact = parseEmergencyContact(
          loadedProfile.emergency_contact || "",
        );

        setFormData({
          allergies: loadedProfile.allergies || "",
          warnings: loadedProfile.warnings || "",
          medical_risks: loadedProfile.medical_risks || "",
          bloodType: loadedProfile.blood_type || "NO_ESPECIFICADO", // Usar valor por defecto
          emergencyContactName: emergencyContact.name,
          emergencyContactRelation: emergencyContact.relation,
          emergencyContactPhone: emergencyContact.phone,
          medicalConditions: loadedProfile.medical_conditions || "",
          currentMedication: loadedProfile.medications || "",
        });
      }
      // Marcamos como inicializado tanto si hay perfil como si no
      setIsInitialized(true);
    }
  }, [loadedProfile, profileLoading]);

  if (!token) {
    return null;
  }

  // Muestra spinner solo mientras se está cargando el perfil
  if (profileLoading && !isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      bloodType: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format emergency contact as "Name (Relation) - Phone"
      const emergencyContact = `${formData.emergencyContactName}${
        formData.emergencyContactRelation
          ? ` (${formData.emergencyContactRelation})`
          : ""
      }${formData.emergencyContactPhone ? ` - ${formData.emergencyContactPhone}` : ""}`;

      // Prepare data for API - convertir "NO_ESPECIFICADO" a string vacío
      const updateData: MedicalProfile = {
        allergies: formData.allergies,
        blood_type:
          formData.bloodType === "NO_ESPECIFICADO" ? "" : formData.bloodType,
        emergency_contact: emergencyContact,
        medical_conditions: formData.medicalConditions,
        medical_risks: formData.medical_risks,
        medications: formData.currentMedication,
        warnings: formData.warnings,
      };

      await save(updateData);
      toast.success(t("messages.success"));
      router.push("/infomedical");
    } catch (error) {
      toast.error(t("messages.error"));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/infomedical");
  };

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {loadedProfile ? t("editTitle") : t("addTitle")}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sección de Alertas Críticas */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="text-xl font-bold text-red-600 uppercase">
                    {t("criticalAlerts")}
                  </h4>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="allergies"
                    className="text-sm font-semibold text-slate-500 uppercase tracking-wide block"
                  >
                    {t("allergies.label")}
                  </label>
                  <Textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder={t("allergies.placeholder")}
                    className="min-h-[100px] border-red-200 focus:border-red-500"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {t("allergies.hint")}
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="warnings"
                    className="text-sm font-semibold text-slate-500 uppercase tracking-wide block"
                  >
                    {t("trainingWarnings.label")}
                  </label>
                  <Textarea
                    id="warnings"
                    name="warnings"
                    value={formData.warnings}
                    onChange={handleInputChange}
                    placeholder={t("trainingWarnings.placeholder")}
                    className="min-h-[100px] border-amber-200 focus:border-amber-500"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    {t("trainingWarnings.hint")}
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="medical_risks"
                    className="text-sm font-semibold text-slate-500 uppercase tracking-wide block"
                  >
                    {t("medicalRisks.label")}
                  </label>
                  <Textarea
                    id="medical_risks"
                    name="medical_risks"
                    value={formData.medical_risks}
                    onChange={handleInputChange}
                    placeholder={t("medicalRisks.placeholder")}
                    className="min-h-[100px] border-orange-200 focus:border-orange-500"
                  />
                  <p className="text-xs text-slate-500">
                    {t("medicalRisks.hint")}
                  </p>
                </div>
              </div>

              {/* Sección de Perfil Clínico */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-5 w-5 text-slate-600" />
                  <h4 className="text-xl font-bold text-slate-600 uppercase">
                    {t("athleteProfile")}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label
                      htmlFor="bloodType"
                      className="text-sm font-semibold text-slate-500 uppercase tracking-wide block"
                    >
                      {t("bloodType.label")}
                    </label>
                    <Select
                      value={formData.bloodType}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger className="border-orange-200 focus:border-orange-500">
                        <SelectValue placeholder={t("bloodType.placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO_ESPECIFICADO">
                          {t("bloodType.notSpecified")}
                        </SelectItem>
                        {bloodTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide block">
                    {t("emergencyContact.label")}
                  </label>
                  <div className="space-y-3">
                    <Input
                      id="emergencyContactName"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder={t("emergencyContact.name")}
                      className="border-orange-200 focus:border-orange-500"
                      required
                    />
                    <Input
                      id="emergencyContactRelation"
                      name="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={handleInputChange}
                      placeholder={t("emergencyContact.relation")}
                      className="border-orange-200 focus:border-orange-500"
                      required
                    />
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      placeholder={t("emergencyContact.phone")}
                      className="border-orange-200 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="medicalConditions"
                    className="text-sm font-semibold text-slate-500 uppercase tracking-wide block"
                  >
                    {t("medicalConditions.label")}
                  </label>
                  <Textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleInputChange}
                    placeholder={t("medicalConditions.placeholder")}
                    className="min-h-[100px] border-blue-200 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">
                    {t("medicalConditions.hint")}
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="currentMedication"
                    className="text-sm font-semibold text-slate-500 uppercase tracking-wide block"
                  >
                    {t("currentMedication.label")}
                  </label>
                  <Textarea
                    id="currentMedication"
                    name="currentMedication"
                    value={formData.currentMedication}
                    onChange={handleInputChange}
                    placeholder={t("currentMedication.placeholder")}
                    className="min-h-[100px] border-green-200 focus:border-green-500"
                  />
                  <p className="text-xs text-slate-500">
                    {t("currentMedication.hint")}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6"
              >
                <X className="h-4 w-4 mr-2" />
                {t("cancelBtn")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? t("savingBtn") : t("saveBtn")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
