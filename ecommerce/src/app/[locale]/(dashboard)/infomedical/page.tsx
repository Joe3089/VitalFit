"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Activity,
  Droplet,
  Phone,
  FileText,
  Pill,
} from "lucide-react";
import useMedicalProfile from "@/hooks/useMedicalProfile";
import { useTranslations } from "next-intl";

export default function FichaMedicaPage() {
  const t = useTranslations("MedicalInfo");
  const { token } = useAuth();
  const router = useRouter();
  const { medicalProfile, isLoading } = useMedicalProfile();

  if (!token) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (!medicalProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">{t("noInfo")}</p>
            <Button
              className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              onClick={() => router.push("/infomedical/edit")}
            >
              {t("addBtn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    medicalProfile.emergency_contact,
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          onClick={() => router.push("/infomedical/edit")}
        >
          {t("editBtn")}
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="text-xl font-bold text-red-600 uppercase">
                  {t("criticalAlerts")}
                </h4>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  {t("allergies.label")}
                </h4>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {medicalProfile.allergies || t("allergies.noRegistered")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  {t("trainingWarnings.label")}
                </h4>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {medicalProfile.warnings ||
                      t("trainingWarnings.noRegistered")}
                  </p>
                </div>
              </div>

              {medicalProfile.medical_risks && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {t("medicalRisks.label")}
                  </h4>
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {medicalProfile.medical_risks}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-slate-600" />
                <h4 className="text-xl font-bold text-slate-600 uppercase">
                  {t("athleteProfile")}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {t("bloodType.label")}
                  </h4>
                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className="px-4 py-2 text-lg border-2 border-orange-500 text-orange-600 bg-orange-50"
                    >
                      <Droplet className="h-4 w-4 mr-2" />
                      {medicalProfile.blood_type || t("bloodType.notSpecified")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {t("emergencyContact.label")}
                  </h4>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-orange-500 flex-shrink-0 mt-1" />
                    <p className="text-slate-700 text-sm">
                      {emergencyContact.name}
                      {emergencyContact.relation &&
                        ` (${emergencyContact.relation})`}
                      {emergencyContact.phone && ` - ${emergencyContact.phone}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  {t("medicalConditions.label")}
                </h4>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {medicalProfile.medical_conditions ||
                        t("medicalConditions.noRegistered")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  {t("currentMedication.label")}
                </h4>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex gap-3">
                    <Pill className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {medicalProfile.medications ||
                        t("currentMedication.noRegistered")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
