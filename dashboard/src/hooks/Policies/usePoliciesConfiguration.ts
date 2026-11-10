import { Policy } from "@vitalfit/sdk";
import { useReportBase } from "../reports/useReportBase";
import { api } from "@/lib/sdk-config";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export const usePoliciesConfiguration = {
  useCommercialPolicies: (jwt: string | null) => {
    const t = useTranslations("settings.Policies");
    const { data, error, isLoading, mutate } = useReportBase<Policy[]>(
      jwt ? ["policy", "all", jwt] : null,
      async () => {
        if (!jwt) {
          throw new Error("No JWT provided");
        }
        return api.policy.getPolicies(jwt);
      }
    );

    const [isUpdating, setIsUpdating] = useState(false);

    const update = async (policyId: string, newValue: string) => {
      if (!jwt){
         return;
      }

      setIsUpdating(true);

      try {
        await api.policy.updatePolicy(policyId, { value: newValue }, jwt);

        toast.success(
          t("updateSuccessTitle"),
          {
            description: t("updateSuccessDescription"),
          }
        );

        await mutate();
      } catch (err) {
        console.error(err);

        toast.error(
          t("updateErrorTitle"),
          {
            description: t("updateErrorDescription"),
          }
        );
      } finally {
        setIsUpdating(false);
      }
    };

    const refresh = async () => {
      try {
        await mutate();

        toast.message(
          t("refreshTitle"),
          {
            description: t("refreshDescription"),
          }
        );
      } catch {
        toast.error(
          t("refreshErrorTitle"),
          {
            description: t("refreshErrorDescription"),
          }
        );
      }
    };

    return {
      policies: data,
      isLoading,
      error,
      update,
      isUpdating,
      refresh,
    };
  },

  usePolicyDetails: (jwt: string | null, policyId: string | null) => {
    const t = useTranslations("Policies");

    const { data, error, isLoading, mutate } = useReportBase<Policy>(
      jwt && policyId ? ["policy", "detail", policyId, jwt] : null,
      async () => {
        if (!jwt || !policyId) {
          throw new Error("Missing parameters");
        }
        return api.policy.getPolicyByID(policyId, jwt);
      }
    );

    const refresh = async () => {
      try {
        await mutate();

        toast.message(
          t("refreshSingleTitle"),
          {
            description: t("refreshSingleDescription"),
          }
        );
      } catch {
        toast.error(
          t("refreshErrorTitle"),
          {
            description: t("refreshErrorDescription"),
          }
        );
      }
    };

    return {
      policy: data,
      isLoading,
      error,
      refresh,
    };
  },
};
