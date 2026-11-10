"use client";

import { useState } from "react";
import { BadgePercent } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import type { InvoiceAdjustment } from "@vitalfit/sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { UserRole } from "@/lib/roles";
import { apiErrorMessage, useTokenSWR } from "@/hooks/advanced/useTokenSWR";

interface Props {
  invoiceId: string;
  invoiceStatus: string;
  onApplied: () => void;
}

const CAN_ADJUST = [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.ACCOUNTANT];

/** HU-MEM-04: post-sale discounts with full traceability. */
export function InvoiceAdjustmentsSection({ invoiceId, invoiceStatus, onApplied }: Props) {
  const t = useTranslations("advanced.adjustments");
  const locale = useLocale();
  const { token, hasRole } = useAuth();
  const [type, setType] = useState<"Percentage" | "FixedAmount">("Percentage");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, mutate } = useTokenSWR(["invoice-adjustments", invoiceId], (jwt) =>
    api.billing.getInvoiceAdjustments(jwt, invoiceId),
  );
  const adjustments: InvoiceAdjustment[] = data?.data ?? [];
  const canApply = hasRole(CAN_ADJUST) && (invoiceStatus === "Unpaid" || invoiceStatus === "Overdue");

  const submit = async () => {
    const amount = Number(value);
    if (!token || !(amount > 0) || reason.trim().length < 5) {
      return;
    }
    setSaving(true);
    try {
      await api.billing.applyInvoiceAdjustment(token, invoiceId, {
        discount_type: type,
        discount_value: amount,
        reason: reason.trim(),
      });
      toast.success(t("success"));
      setValue("");
      setReason("");
      await mutate();
      onApplied();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setSaving(false);
    }
  };

  if (!canApply && adjustments.length === 0) {
    return null;
  }

  const money = (v: string) =>
    new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", { style: "currency", currency: "USD" }).format(Number(v));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgePercent className="h-4 w-4 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canApply && (
          <div className="grid gap-3 md:grid-cols-[180px_140px_1fr_auto] md:items-start">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Percentage">{t("percentage")}</SelectItem>
                <SelectItem value="FixedAmount">{t("fixed")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "Percentage" ? "%" : "USD"}
            />
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              rows={1}
            />
            <Button onClick={submit} disabled={saving || !(Number(value) > 0) || reason.trim().length < 5}>
              {saving ? t("saving") : t("apply")}
            </Button>
            <p className="text-xs text-muted-foreground md:col-span-4">{t("policyHint")}</p>
          </div>
        )}

        {adjustments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">{t("date")}</th>
                  <th>{t("discount")}</th>
                  <th>{t("previous")}</th>
                  <th>{t("new")}</th>
                  <th>{t("reason")}</th>
                  <th>{t("by")}</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.adjustment_id} className="border-t">
                    <td className="py-2">{new Date(a.created_at).toLocaleString(locale)}</td>
                    <td>
                      -{money(a.amount)}
                      {a.discount_type === "Percentage" && (
                        <span className="text-muted-foreground"> ({Number(a.discount_value)}%)</span>
                      )}
                    </td>
                    <td>{money(a.previous_total)}</td>
                    <td className="font-semibold">{money(a.new_total)}</td>
                    <td className="max-w-xs truncate" title={a.reason}>{a.reason}</td>
                    <td>{a.applied_by_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
