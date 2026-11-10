"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import EquipmentForm from "../EquipmentForm";
import { EquipmentInfo } from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function EquipmentDetailPage() {
  const t = useTranslations("catalog.equipment.details");
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const id = params?.id as string | undefined;
  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    const fetchEquipment = async () => {
      try {
        const data = await api.equipment.getEquipmentByID(id, token);
        setEquipment(data.data);
      } catch (err) {
        console.error("Error al cargar equipo:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [id, token]);

  if (loading) {
    return <div className="p-6">{t("loading")}</div>;
  }

  if (!equipment) {
    return <div className="p-6 text-red-500">{t("not_found")}</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <PageHeader
        title={t("title")}
        subtitle={
          <span className="text-sm text-muted-foreground">
            {t("subtitle", { name: equipment.name })}
          </span>
        }
        actionButton={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.replace("/catalog/equipment")}
            >
              {t("back")}
            </Button>
            <Button
              variant="default"
              type="button"
              onClick={() => router.replace(`/catalog/equipment/${id}/edit`)}
            >
              {t("edit")}
            </Button>
          </div>
        }
      />

      <EquipmentForm equipment={equipment} mode="view" />
    </div>
  );
}
