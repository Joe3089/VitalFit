import { api } from "@/lib/sdk-config";
import useSWR from "swr";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function useSessionsManager(jwt: string, targetUserId?: string) {
  const t = useTranslations("user.audit.sessions");

  const key = jwt
    ? targetUserId
      ? `user/${targetUserId}/sessions`
      : "user/sessions"
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    if (targetUserId) {
      return await api.auth.getUserSessionByID(targetUserId, jwt);
    }
    return await api.auth.getUserSessions(jwt);
  });

  const handleRevokeOne = async (sessionId: string) => {
    try {
      await api.auth.revokeSession(sessionId, jwt);
      
      await mutate();
      
      toast.success(t("revokeSuccess"));
    } catch (err) {
      console.error("Error revoking session:", err);
      toast.error(t("errorRevoke"));
    }
  };

  const handleRevokeAll = async () => {
    try {
      if (targetUserId) {
        await api.auth.revokeAllSessionsByUserID(targetUserId, jwt);
      } else {
        await api.auth.revokeAllSessions(jwt);
      }

      await mutate();
      
      toast.success(t("revokeSuccess"));
    } catch (err) {
      console.error("Error revoking all sessions:", err);
      toast.error(t("errorRevoke"));
    }
  };

  return {
    sessions: data?.data || [],
    isLoading,
    isError: error,
    handleRevokeOne,
    handleRevokeAll,
  };
}