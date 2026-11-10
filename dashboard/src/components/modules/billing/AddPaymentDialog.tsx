"use client";

import React, { useState, useMemo } from "react";
import { Plus, Loader2, Hash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useTranslations } from "next-intl"; 

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBranchPaymentMethods } from "@/hooks/branches/useBranchPaymentMethods";
import { usePaymentMethods } from "@/hooks/payment-methods/usePaymentMethods";
import { useExchangeRate } from "@/hooks/billing/useExchangeRate";
import { mainCurrencies } from "@vitalfit/sdk";

export function AddPaymentDialog({
  invoiceId,
  onPaymentAdded,
  defaultAmount = 0,
}: {
  invoiceId: string;
  onPaymentAdded: () => void;
  defaultAmount?: number;
}) {
  const t = useTranslations("finance.Billing.addPayment");
  const { token, user: authUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [currency, setCurrency] = useState("USD");

  const branchId = authUser?.activeBranch?.id;
  const branchData = useBranchPaymentMethods(branchId ?? "", token ?? "");
  const globalData = usePaymentMethods(branchId ? null : (token ?? ""));

  const methods = branchId ? branchData.methods : globalData.methods;

  const selectedMethod = useMemo(
    () =>
      methods.find(
        (m: any) => (m.method_id || m.payment_method_id) === selectedMethodId
      ),
    [selectedMethodId, methods]
  );

  const isBankAction = selectedMethod?.type?.toLowerCase() === "transfer";
  const { rate, isLoading: isLoadingRate } = useExchangeRate(token, currency);

  const referenceAmount = useMemo(() => {
    if (currency === "USD") {
      return defaultAmount;
    }
    return defaultAmount * (rate || 0);
  }, [defaultAmount, rate, currency]);

  const currencyInfo = useMemo(
    () => mainCurrencies.find((c) => c.code === currency),
    [currency]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMethodId) {
      return toast.error(t("messages.selectMethodError"));
    }

    const formData = new FormData(e.currentTarget);
    const bankRef = formData.get("transaction_id") as string;
    const cleanRef = isBankAction ? bankRef.toUpperCase() : "CASH";
    const formattedTransactionId = `STAFF-${authUser?.user_id || "UID"}-${Date.now()}-${cleanRef}`;

    const payload = {
      invoice_id: invoiceId,
      branch_id: branchId || null,
      amount_paid: referenceAmount,
      currency_paid: currency,
      payment_method_id: selectedMethodId,
      transaction_id: formattedTransactionId,
      receipt_url: "Pago reportado por Staff/Admin",
    };

    try {
      setIsSubmitting(true);
      await api.billing.AddPaymentToInvoice(payload, token!);
      toast.success(t("messages.success"));
      setOpen(false);
      resetStates();
      onPaymentAdded();
    } catch (error: any) {
      toast.error(error.message || t("messages.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetStates = () => {
    setSelectedMethodId("");
    setCurrency("USD");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {}
        resetStates();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full shadow-sm" size="sm">
          <Plus className="h-4 w-4 mr-2" /> {t("trigger")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-50 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t("invoiceId", { id: invoiceId.split("-").pop() || "" })}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                {t("currencyLabel")}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {mainCurrencies.map((c) => (
                    <SelectItem
                      key={c.code}
                      value={c.code}
                      className="text-xs font-bold"
                    >
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border bg-slate-50/50 p-5 space-y-4 border-slate-200/60">
              <div className="flex justify-between items-center pb-3 border-b border-dashed">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400">
                    {t("totalUSD")}
                  </p>
                  <p className="text-lg font-bold text-slate-600">
                    ${defaultAmount.toFixed(2)}
                  </p>
                </div>
                {currency !== "USD" && (
                  <div className="flex flex-col items-end px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-[10px] font-black text-primary tabular-nums">
                      {isLoadingRate
                        ? "..."
                        : t("exchangeRate", { rate: rate.toFixed(2) })}
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-1 text-center md:text-left">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest opacity-70 mb-1">
                  {t("toReceive", { currency })}
                </p>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-2xl font-black text-primary">
                    {currencyInfo?.symbol}
                  </span>
                  <h2 className="text-5xl font-black text-primary tracking-tighter tabular-nums">
                    {isLoadingRate
                      ? "..."
                      : referenceAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </h2>
                </div>
              </div>
            </div>

            <div
              className={`grid ${isBankAction ? "grid-cols-2" : "grid-cols-1"} gap-3 transition-all duration-300`}
            >
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  {t("methodLabel")}
                </Label>
                <Select
                  value={selectedMethodId}
                  onValueChange={setSelectedMethodId}
                  required
                >
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder={t("choose")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[180px]">
                    {methods.map((method: any) => (
                      <SelectItem
                        key={method.method_id || method.payment_method_id}
                        value={method.method_id || method.payment_method_id}
                        className="text-xs font-bold py-2"
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isBankAction && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    {t("bankReference")}
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      name="transaction_id"
                      className="pl-9 h-10 bg-slate-50 border-slate-200 uppercase font-mono text-xs rounded-xl"
                      placeholder={t("referencePlaceholder")}
                      required={isBankAction}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="bg-slate-50 p-6 border-t">
            <Button
              type="button"
              variant="ghost"
              className="text-xs font-bold uppercase"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingRate || !selectedMethodId}
              className="px-8 h-11 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                t("confirm")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
