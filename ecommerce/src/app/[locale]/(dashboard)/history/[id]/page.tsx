"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/Textarea";
import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

const memberships = [
  {
    id: "m1",
    planName: "Membresía Premium Mensual",
    paymentType: "Mensual",
    status: "activa",
    billingId: "TX-145803",
    startDate: "11 de Noviembre 2025",
    endDate: "11 de Diciembre del 2025",
    services: [
      "Acceso al gimnasio",
      "Clases grupales",
      "Piscina / spa / entrenamiento personalizado",
    ],
  },
  {
    id: "m2",
    planName: "Membresía Premium Mensual",
    paymentType: "Mensual",
    status: "cancelada",
    billingId: "TX-145804",
    startDate: "11 de Octubre 2025",
    endDate: "11 de Noviembre del 2025",
    cancellationDate: "11 de Noviembre del 2025",
    services: ["Acceso al gimnasio", "Clases grupales"],
  },
  {
    id: "m3",
    planName: "Membresía Premium Mensual",
    paymentType: "Mensual",
    status: "vencida",
    billingId: "TX-145805",
    startDate: "11 de Septiembre 2025",
    endDate: "11 de Octubre del 2025",
    services: ["Acceso al gimnasio"],
  },
];

export default function MembershipDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("MembershipDetails");

  const membership = memberships.find((m) => m.id === id);

  useEffect(() => {
    if (!membership) {
      router.replace("/memberships");
    }
  }, [membership, router]);

  if (!membership) {
    return null;
  }

  const renderActiveMembership = () => (
    <Card className={`w-full mx-auto border shadow-sm my-8`}>
      <CardContent className="space-y-4 p-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>{t("fields.paymentName")}:</strong> {membership.planName}
          </div>
          <div>
            <strong>{t("fields.paymentType")}:</strong> {membership.paymentType}
          </div>
          <div>
            <strong>{t("statusLabel")}:</strong>{" "}
            {t(`status.${membership.status}`)}
          </div>
          <div>
            <strong>{t("fields.billingId")}:</strong> {membership.billingId}
          </div>
          <div>
            <strong>{t("fields.startDate")}:</strong> {membership.startDate}
          </div>
          <div>
            <strong>{t("fields.endDate")}:</strong> {membership.endDate}
          </div>
        </div>
        <div>
          <strong>{t("fields.services")}:</strong>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {membership.services.map((s: string, i: number) => (
              <label
                key={i}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="form-checkbox h-4 w-4 text-green-600 cursor-not-allowed"
                />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="default">
            <ArrowPathIcon className="w-6 h-6" />
            {t("actions.renew")}
          </Button>
          <Button variant="outline">{t("actions.update")}</Button>
          <Button
            variant="outline"
            onClick={() => router.replace(`${id}/cancel`)}
            className="text-red-500"
          >
            {t("actions.cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCancelledMembership = () => (
    <div className="space-y-6">
      <Card className={`w-full mx-auto border shadow-sm my-8`}>
        <CardContent className="space-y-4 p-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t("fields.paymentName")}:</strong> {membership.planName}
            </div>
            <div>
              <strong>{t("fields.paymentType")}:</strong>{" "}
              {membership.paymentType}
            </div>
            <div>
              <strong>{t("statusLabel")}:</strong>{" "}
              {t(`status.${membership.status}`)}
            </div>
            <div>
              <strong>{t("fields.billingId")}:</strong> {membership.billingId}
            </div>
            <div>
              <strong>{t("fields.startDate")}:</strong> {membership.startDate}
            </div>
            <div>
              <strong>{t("fields.endDate")}:</strong> {membership.endDate}
            </div>
          </div>

          <div>
            <strong>{t("fields.services")}:</strong>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {membership.services.map((s: string, i: number) => (
                <label
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="form-checkbox h-4 w-4 text-green-600 cursor-not-allowed"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </CardContent>

        <CardContent className="space-y-6 p-8">
          <p className="text-lg font-bold text-gray-900">
            Cancelación de membresía
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold block mb-2">
                Motivo de cancelación
              </label>
              <Select disabled defaultValue={membership.cancellationDate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectCancelDefaultValue")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={""}>
                    {membership.cancellationDate}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">
                {t("cancellationDate")}
              </label>
              <p className="text-gray-900">{membership.cancellationDate}</p>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-semibold block mb-2">
                Descripción
              </label>
              <Textarea
                value={membership.cancellationDate}
                disabled
                placeholder={t("descriptionCancelPlaceholder")}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpiredMembership = () => (
    <Card className="w-full mx-auto border shadow-sm my-8">
      <CardContent className="space-y-6 p-8 text-center">
        <h1 className="text-xl">{t("viewexpired")}</h1>
        <Button variant="default" className="border-gray-300">
          Ver Membresia
        </Button>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (membership.status) {
      case "activa":
        return renderActiveMembership();
      case "cancelada":
        return renderCancelledMembership();
      case "vencida":
        return renderExpiredMembership();
      default:
        return renderActiveMembership();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-8">
        <PageHeader subtitle={t("subtitle")} title={t("title")} />
        {renderContent()}
      </div>
    </div>
  );
}
