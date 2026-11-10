import { useState } from "react";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function useClientActions(token: string | null) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("clients");

  const deleteClient = async (userId: string, onSuccess: () => void) => {
    if (!token) {
      toast.error(t("notifications.error_title"), { description: t("notifications.no_token") });
      return;
    }

    setIsDeleting(true);
    try {
      await api.user.deleteUser(userId, token);
      toast.success(t("notifications.success_title"), { description: t("notifications.delete_success") });
      setDeleteRowId(null);
      setTimeout(onSuccess, 500);
    } catch (error: any) {
      const message = error.status === 403 ? t("notifications.permission_error") : t("notifications.delete_error");
      toast.error(t("notifications.error_title"), { description: message });
      if (error.status === 401){
         router.replace("/login");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    deleteRowId,
    setDeleteRowId,
    deleteClient,
    handleView: (id: string) => router.replace(`/clients/register/${id}`),
    handleEdit: (id: string) => router.replace(`/clients/register/${id}/edit`),
  };
}