"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Printer,
  Loader2,
  ReceiptText,
  Calendar,
  Info,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl"; 
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { cn } from "@/lib/utils";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const ROLES_CON_ACCESO_GESTION = ["super_admin", "accountant", "branch_admin"];

export function QuickViewPaymentModal({ invoiceId, open, onOpenChange }: any) {
  const t = useTranslations("finance.Billing.quickView"); 
  const locale = useLocale();
  const { token, user } = useAuth();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const totalPaid = useMemo(() => {
    if (!invoice?.payments) {
        return 0;
    }
    return invoice.payments.reduce(
      (acc: number, p: any) => acc + Number(p.amount_base),
      0
    );
  }, [invoice]);

  const hasAccessToManagement = useMemo(() => {
    return user?.role && ROLES_CON_ACCESO_GESTION.includes(user.role);
  }, [user]);

  const fetchInvoiceDetails = useCallback(async () => {
    if (!invoiceId || !token){
         return;
    }
    try {
      setLoading(true);
      const response = await api.billing.getInvoiceByID(invoiceId, token);
      if (response?.data){
         setInvoice(response.data);
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
    } finally {
      setLoading(false);
    }
  }, [invoiceId, token]);

  useEffect(() => {
    if (open) {
      fetchInvoiceDetails();
    } else {
      setInvoice(null);
    }
  }, [open, fetchInvoiceDetails]);

  const formatCurr = (val: any) =>
    new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(val) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden border-border bg-background shadow-lg sm:rounded-xl text-left">
        <VisuallyHidden.Root>
          <DialogTitle>
            {invoice ? `${t("accessibleTitle")} ${invoice.invoice_number}` : t("loading")}
          </DialogTitle>
          <DialogDescription>
            {t("accessibleDescription")}
          </DialogDescription>
        </VisuallyHidden.Root>

        {loading ? (
          <div className="flex h-[450px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : invoice ? (
          <div className="flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b bg-card/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold border-orange-200 text-orange-600 bg-orange-50/50"
                    >
                      {t("badgeLabel")}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(invoice.issue_date).toLocaleDateString(locale, {
                        dateStyle: "medium",
                      })}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground uppercase italic leading-none">
                    {invoice.invoice_number}
                  </h2>
                </div>
                <Badge
                  className={cn(
                    "px-3 py-1 rounded-full font-bold uppercase",
                    invoice.status === "Paid"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-orange-100 text-orange-700 border-orange-200"
                  )}
                >
                  {t(`status.${invoice.status.toLowerCase()}`)}
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-orange-500" /> {t("conceptsTitle")}
                </h3>
                <Card className="shadow-sm border-slate-100">
                  <CardContent className="p-0 divide-y text-sm">
                    {invoice.invoice_items?.map((item: any) => (
                      <div
                        key={item.invoice_item_id}
                        className="flex justify-between items-center p-3 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-800">
                            {item.description || t("defaultItemName")}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            {t("quantity")}: {item.quantity} • Unit:{" "}
                            {formatCurr(item.unit_price)}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {formatCurr(item.total_line)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="relative overflow-hidden border-orange-100 bg-gradient-to-br from-white to-orange-50/30 shadow-sm">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-orange-100/30 blur-2xl" />
                <CardContent className="p-5 space-y-4 relative z-10">
                  <div className="flex justify-between items-end border-b border-orange-100/50 pb-4">
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {t("totalAmountLabel")}
                      </p>
                      <p className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">
                        {formatCurr(invoice.total_amount)}
                      </p>
                    </div>
                    <div className="text-right text-[11px] font-bold text-muted-foreground space-y-0.5 uppercase tracking-tighter">
                      <p>{t("subtotal")}: {formatCurr(invoice.sub_total)}</p>
                      <p className="text-orange-600">
                        {t("taxes")} (16%): {formatCurr(invoice.tax)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <div className="bg-emerald-100 p-1.5 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold uppercase italic tracking-wide">
                        {t("totalPaidLabel")}
                      </span>
                    </div>
                    <span className="text-xl font-black text-emerald-600 tracking-tight">
                      {formatCurr(totalPaid)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
              <div className="flex items-center">
                {hasAccessToManagement ? (
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 shadow-sm shadow-orange-200 font-bold px-4 transition-all active:scale-95"
                  >
                    <Link href={`/finance/billing/${invoice.invoice_id}`}>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" /> {t("fullManagementBtn")}
                    </Link>
                  </Button>
                ) : (
                  <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> {t("readOnlyMode")}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => window.print()}
                className="rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                title={t("printTitle")}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}