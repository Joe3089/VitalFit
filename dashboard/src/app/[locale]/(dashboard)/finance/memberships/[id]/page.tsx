"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useClientMembershipByID } from "@/hooks/membership/useClientMembershipByID";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, UserMinus, CheckCircle } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

import { useUpdateClientMembership } from "@/hooks/membership/useUpdateClientMembership";
import { CancelMembershipDialog } from "@/components/modules/membership/CancelMembershipDialog";
import { useCancellation } from "@/hooks/cancellation-reason/useCancellation";
import { useTranslations } from "next-intl";
import ClientMembershipForm from "@/components/modules/membership/ClientMembershipForm";

export default function ClientMembershipDetailPage() {
  const t = useTranslations("finance.MembershipManagement.detail");
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const membershipId = params.id as string;

  const { update, isUpdating: isUpdatingStatus } = useUpdateClientMembership(token);
  const { membership, isLoading, error, fetchMembershipById } = useClientMembershipByID(token || "");

  const { 
    cancellationData, 
    isLoading: isLoadingReasons 
  } = useCancellation(token, {}, 1);

  useEffect(() => {
    if (token && membershipId && membership?.client_membership_id !== membershipId) {
      fetchMembershipById(membershipId);
    }
  }, [membershipId, token, fetchMembershipById, membership?.client_membership_id]);


  const handleCancelMembership = async (formData: {
    reason_id: string;
    notes: string;
  }) => {
    const result = await update(membershipId, {
      status: "Cancelled", 
      cancel_reason_id: formData.reason_id,
      cancel_notes: formData.notes,
    });

    if (result) {
      setIsCancelDialogOpen(false);
      fetchMembershipById(membershipId); 
    }
  };

  const handleActivateMembership = async () => {
    const result = await update(membershipId, {
      status: "Active", 
    });

    if (result) {
      fetchMembershipById(membershipId); 
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.replace("/finance/memberships")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader title={t("title")} />
        </div>

        <div className="flex items-center gap-3">
          {membership?.status === "Active" && (
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={isLoading || isUpdatingStatus}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              {t("actions.cancel")}
            </Button>
          )}

          {membership?.status === "Cancelled" && (
            <Button 
              variant="outline" 
              className="border-green-200 text-green-600 hover:bg-green-50"
              onClick={handleActivateMembership}
              disabled={isLoading || isUpdatingStatus}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("actions.activate")}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => fetchMembershipById(membershipId)}
            disabled={isLoading || !membershipId}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {t("actions.refresh")}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground animate-pulse text-sm font-medium">
              {t("loading")}
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-lg text-center">
            <p className="font-bold">{t("error.title")}</p>
            <p className="text-sm mb-4 opacity-90">{error.message}</p>
            <Button variant="destructive" size="sm" onClick={() => fetchMembershipById(membershipId)}>
              {t("error.retry")}
            </Button>
          </div>
        )}

        {!isLoading && membership && <ClientMembershipForm data={membership} />}

        {!isLoading && !membership && !error && (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
            <p className="text-muted-foreground text-sm font-medium">
              {t("notFound")}
            </p>
          </div>
        )}
      </div>

      <CancelMembershipDialog 
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelMembership}
        isLoading={isUpdatingStatus || isLoadingReasons}
        cancellationReasons={cancellationData}
      />
    </div>
  );
}