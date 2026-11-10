"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  ArrowPathIcon,
  ClockIcon,
  NoSymbolIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { ClientMembership } from "@vitalfit/sdk";
import {
  MEMBERSHIP_STATUS_CONFIG,
  MembershipStatusType,
} from "@/constants/membershipStatus";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";

interface MembershipSummaryProps {
  clientMembership: ClientMembership | null | undefined;
}

export const MembershipSummary: React.FC<MembershipSummaryProps> = ({
  clientMembership,
}) => {
  const t = useTranslations("membership");
  const tc = useTranslations("MembershipCancel");
  const format = useFormatter();
  const router = useRouter();
  const { token } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [reasons, setReasons] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isDialogOpen && token) {
      const fetchReasons = async () => {
        try {
          const response = await api.membership.getCancelReasons(token, {
            page: 1,
            limit: 100,
          });
          if (response?.data) {
            const apiReasons = response.data;
            const otherReason = {
              reason_id: "other",
              description: tc("reasons.other"),
            };
            setReasons([...apiReasons, otherReason]);
          }
        } catch (error) {
          console.error("Error fetching cancel reasons:", error);
          toast.error(tc("notifications.loadError"));
        }
      };
      fetchReasons();
    }
  }, [isDialogOpen, token, tc]);

  const statusInfo = useMemo(() => {
    if (!clientMembership) {
      return null;
    }

    let statusKey =
      clientMembership.status.toLowerCase() as MembershipStatusType;

    if (!MEMBERSHIP_STATUS_CONFIG[statusKey]) {
      statusKey = "expired";
    }

    const start = new Date(clientMembership.start_date);
    const end = new Date(clientMembership.end_date);
    const now = new Date();

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    let daysRemaining = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (statusKey === "expired" || statusKey === "cancelled") {
      daysRemaining = 0;
    }

    const progress = Math.min(
      Math.max((elapsed / totalDuration) * 100, 0),
      100,
    );
    const isUrgent = statusKey === "active" && daysRemaining <= 5;

    const visualConfig = MEMBERSHIP_STATUS_CONFIG[statusKey];

    const currentProgressColor = isUrgent
      ? "bg-red-500"
      : visualConfig.progressBarColor;

    return {
      start,
      end,
      daysRemaining,
      progress,
      statusKey,
      config: visualConfig,
      progressColor: currentProgressColor,
      planName: "Plan VIP",
    };
  }, [clientMembership]);

  const handleConfirmCancellation = async () => {
    if (!selectedReasonId) {
      toast.error(tc("notifications.selectReason"));
      return;
    }

    if (selectedReasonId === "other" && !cancelNotes.trim()) {
      toast.error(tc("notifications.provideDescription"));
      return;
    }

    if (!clientMembership || !token) {return;}

    setIsSubmitting(true);
    try {
      let finalReasonId = selectedReasonId;

      if (selectedReasonId === "other") {
        const reasonResponse = (await api.membership.createCancelReason(
          { description: cancelNotes, is_active: true },
          token,
        )) as any;

        finalReasonId =
          reasonResponse?.reason_id || reasonResponse?.data?.reason_id;

        if (!finalReasonId) {
          throw new Error("Failed to create cancellation reason");
        }
      }

      await api.membership.updateClientMembership(
        clientMembership.client_membership_id,
        {
          status: "Cancelled",
          cancel_reason_id: finalReasonId,
          cancel_notes: cancelNotes,
        },
        token,
      );
      toast.success(tc("notifications.success"));
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error cancelling membership:", error);
      toast.error(tc("notifications.cancelError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!statusInfo) {
    return (
      <Card className="bg-white overflow-hidden">
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <PlusCircleIcon className="w-8 h-8 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">
              {t("noMembershipTitle")}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {t("noMembershipDescription")}
            </p>
          </div>

          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push("/memberships")}
          >
            {t("acquireMembershipButton")}
          </Button>
        </div>
      </Card>
    );
  }

  const {
    start,
    end,
    daysRemaining,
    progress,
    config,
    progressColor,
    statusKey,
    planName,
  } = statusInfo;

  return (
    <>
      <Card className="overflow-hidden bg-white">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
              <p className="text-sm font-medium text-gray-500">{planName}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${config.badgeColor}`}
            >
              {t(config.translationKey)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t("nextLabel")}</span>
              <span
                className={`font-bold flex gap-1 items-center text-gray-900`}
              >
                {statusKey === "cancelled" ? (
                  <NoSymbolIcon className={`w-4 h-4 ${config.iconColor}`} />
                ) : (
                  <ClockIcon className={`w-4 h-4 ${config.iconColor}`} />
                )}

                {statusKey === "expired"
                  ? t("expiredLabel")
                  : `${daysRemaining} ${t("daysRemaining")}`}
              </span>
            </div>

            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between text-sm pt-2">
            <div>
              <p className="text-gray-500 text-xs uppercase font-semibold">
                {t("startLabel")}
              </p>
              <p className="font-medium text-gray-900">
                {format.dateTime(start, { dateStyle: "medium" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase font-semibold">
                {t("expiryLabel")}
              </p>
              <p
                className={`font-medium ${statusKey === "expired" ? "text-red-600" : "text-gray-900"}`}
              >
                {format.dateTime(end, { dateStyle: "medium" })}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-4">
            <Button
              className={`w-full sm:w-auto gap-2 ${statusKey === "expired" ? "bg-red-600 hover:bg-red-700" : ""}`}
              onClick={() => router.push("/memberships")}
            >
              <ArrowPathIcon className="w-4 h-4" />
              {statusKey === "active"
                ? t("renewButton")
                : t("reactivateButton")}
            </Button>

            {statusKey === "active" && (
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setIsDialogOpen(true)}
              >
                {t("cancelMembership")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{tc("title")}</DialogTitle>
            <DialogDescription>{tc("message")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {tc("fields.reason")}
              </label>
              <Select
                value={selectedReasonId}
                onValueChange={setSelectedReasonId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc("placeholders.reason")} />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((reason) => (
                    <SelectItem key={reason.reason_id} value={reason.reason_id}>
                      {reason.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {tc("fields.additionalNotes")}
              </label>
              <Textarea
                placeholder={tc("placeholders.description")}
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc("actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancellation}
              disabled={isSubmitting || !selectedReasonId}
            >
              {isSubmitting ? tc("actions.cancelling") : tc("actions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
