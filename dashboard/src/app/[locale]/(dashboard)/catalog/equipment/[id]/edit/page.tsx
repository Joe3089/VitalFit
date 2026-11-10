"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import EquipmentForm from "../../EquipmentForm";
import { EquipmentInfo } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function EditEquipmentPage() {
  const t = useTranslations("catalog.equipment.edit");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    const loadEquipment = async () => {
      try {
        setLoading(true);
        const response = await api.equipment.getEquipmentByID(id, token);
        setEquipment(response.data ?? response);
      } catch (err) {
        console.error("Error cargando equipo:", err);
        setError(t("messages.error_fetch"));
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [id, token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || !token){
       return;
    }

    setIsSaving(true);
    const toastId = toast.loading(t("saving"));
    try {
      await api.equipment.updateEquipment(
        equipment.equipment_id,
        equipment,
        token,
      );
      toast.success(t("messages.success"), { id: toastId });
      router.push("/catalog/equipment");
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      toast.error(t("messages.error_update"), { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">{t("loading_data")}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
  if (!equipment) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle", { name: equipment.name })}
          actionButton={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                type="button"
                disabled={isSaving}
                onClick={() => router.push("/catalog/equipment")}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" variant="default" disabled={isSaving}>
                {isSaving ? t("saving") : t("save")}
              </Button>
            </div>
          }
        />

        <EquipmentForm
          mode="edit"
          equipment={equipment}
          onChange={(field, value) =>
            setEquipment((prev) => (prev ? { ...prev, [field]: value } : prev))
          }
        />
      </form>
    </div>
  );
}