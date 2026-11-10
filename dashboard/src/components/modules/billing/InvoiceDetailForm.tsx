"use client";
import {
  FileText,
  Mail,
  MapPin,
  Receipt,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Cake,
  Crown,
  History,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { InvoiceItemsTable } from "./InvoiceItemsTable";
import { PaymentHistoryTable } from "./PaymentHistoryTable";
import { AddPaymentDialog } from "./AddPaymentDialog";

interface InvoiceDetailFormProps {
  invoice: any;
  user: any;
  userLoading: boolean;
  onRefresh: () => void;
  pendingAmount: number;
  branchName?: string;
}

export function InvoiceDetailForm({
  invoice,
  user,
  userLoading,
  onRefresh,
  pendingAmount,
  branchName,
}: InvoiceDetailFormProps) {
  const t = useTranslations("finance.Billing.detail");

  const isActuallyPaid = pendingAmount <= 0.05;
  const lastPayment = invoice.payments?.[0];
  const hasFailedPayments = lastPayment?.status === "Failed";
  const hasPendingPayments = lastPayment?.status === "Pending";
  const hasRefundedPayments = lastPayment?.status === "Refunded";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-8 space-y-8">
        <section className="space-y-4">
          <header className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm border border-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {t("conceptsTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("conceptsSubtitle")}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="font-mono bg-background border-muted-foreground/20"
            >
              {t("itemsCount", { count: invoice.invoice_items?.length || 0 })}
            </Badge>
          </header>

          <Card className="border-muted/60 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <InvoiceItemsTable items={invoice.invoice_items || []} />
            </CardContent>
          </Card>
        </section>
        <section className="space-y-4">
          <header className="flex items-center gap-3 px-1">
            <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm border border-primary/20">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {t("paymentsTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("paymentsSubtitle")}
              </p>
            </div>
          </header>

          <Card className="border-muted/60 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              <PaymentHistoryTable
                payments={invoice.payments || []}
                onRefresh={onRefresh}
              />
            </CardContent>
          </Card>
        </section>
      </div>
      <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
        <Card className="rounded-3xl border-muted/60 shadow-2xl shadow-primary/5 overflow-hidden">
          <div
            className={`h-2.5 w-full ${isActuallyPaid ? "bg-green-500" : "bg-orange-500"}`}
          />

          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {t("statusLabel")}
              </span>
              <Badge
                className={`px-4 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm border-none ${
                  isActuallyPaid
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {isActuallyPaid ? t("status.paid") : t("status.pending")}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                $
                {Number(invoice.total_amount || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm font-bold text-muted-foreground uppercase opacity-60">
                USD
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-2xl border border-border/40">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  {t("summary.subtotal")}
                </p>
                <p className="text-sm font-black tabular-nums">
                  ${Number(invoice.sub_total || 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                  {t("summary.taxes")}
                </p>
                <p className="text-sm font-black tabular-nums text-orange-600">
                  +${Number(invoice.tax || 0).toFixed(2)}
                </p>
              </div>
            </div>

            {!isActuallyPaid ? (
              <div className="space-y-5">
                {hasFailedPayments && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold leading-tight animate-pulse">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{t("alerts.failed")}</span>
                  </div>
                )}

                {hasRefundedPayments && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold leading-tight">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{t("alerts.refunded")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5 font-black text-[11px] uppercase tracking-widest text-destructive">
                    <Receipt className="h-4 w-4" />
                    {t("summary.currentDebt")}
                  </div>
                  <span className="text-3xl font-black tabular-nums text-destructive tracking-tighter">
                    ${pendingAmount.toFixed(2)}
                  </span>
                </div>

                <AddPaymentDialog
                  invoiceId={invoice.invoice_id}
                  onPaymentAdded={onRefresh}
                  defaultAmount={pendingAmount}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 p-5 bg-green-50/50 border border-green-200 rounded-2xl text-green-700 font-black text-xs uppercase tracking-widest shadow-inner">
                <CheckCircle2 className="h-5 w-5" />
                {t("summary.fullyPaid")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-muted/60 shadow-sm overflow-hidden bg-background">
          <CardHeader className="bg-muted/30 pb-4 py-3.5 border-b">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
              {t("accountInfo.title")}
              <ArrowUpRight className="h-3 w-3 opacity-30" />
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-4">
               <Avatar className="h-16 w-16 rounded-2xl border-2 border-primary/10 shadow-sm">
                <AvatarImage
                  src={user?.profile_picture_url}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-primary/5 text-primary font-black text-xl">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-black text-foreground truncate leading-tight">
                    {userLoading
                      ? "..."
                      : `${user?.first_name} ${user?.last_name}`}
                  </p>
                  {user?.category === "VIP" && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none h-5 px-1.5 text-[9px] font-black uppercase tracking-tighter">
                      <Crown className="h-2.5 w-2.5 mr-1 fill-current" />
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate font-medium flex items-center gap-1.5 mt-1">
                  <Mail className="h-3 w-3 opacity-60" /> {user?.email}
                </p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold border-muted-foreground/20 text-muted-foreground leading-none py-0.5 px-2 h-5 uppercase"
                  >
                    ID: {user?.identity_document || "N/A"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="opacity-40" />

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                  <Phone className="h-3 w-3 opacity-60" />{" "}
                  {t("accountInfo.phoneLabel") || "Teléfono"}
                </p>
                <p className="text-[11px] font-bold text-foreground tabular-nums truncate">
                  {user?.phone || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                  <Cake className="h-3 w-3 opacity-60" />{" "}
                  {t("accountInfo.birthLabel") || "Cumpleaños"}
                </p>
                <p className="text-[11px] font-bold text-foreground truncate">
                  {user?.birth_date
                    ? new Date(user.birth_date).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—"}
                </p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 opacity-60" />{" "}
                  {t("accountInfo.branchLabel")}
                </p>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-black border-primary/10 text-primary uppercase px-2 py-0.5 w-fit"
                >
                  {branchName || t("accountInfo.principal")}
                </Badge>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-muted/50 p-4 rounded-2xl border border-border/40 cursor-help group transition-all hover:border-primary/30 hover:bg-muted">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-1.5 flex justify-between">
                      {t("accountInfo.uuidLabel")}
                      <span className="group-hover:text-primary transition-colors text-[8px] opacity-0 group-hover:opacity-100">
                        {t("accountInfo.uuidInfo")}
                      </span>
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/60 break-all leading-tight truncate">
                      {invoice.invoice_id}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="text-[10px] font-mono bg-popover shadow-xl border-muted"
                >
                  {invoice.invoice_id}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
