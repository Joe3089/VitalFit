"use client";

import { useInvoiceDetail } from "@/hooks/useInvoiceDetail";
import { usePublicData } from "@/hooks/usePublicData";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ReceiptText,
  AlertCircle,
  CreditCard,
  Info,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import Loading from "@/app/[locale]/loading";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface Props {
  invoiceId: string;
}

export const StepSuccess = ({ invoiceId }: Props) => {
  const t = useTranslations("Checkout.Success");

  const {
    invoice,
    loading: loadingInvoice,
    error: errorInvoice,
  } = useInvoiceDetail(invoiceId);

  const {
    memberships,
    packages,
    loading: loadingPublic,
  } = usePublicData("USD");

  if (loadingInvoice || loadingPublic) {
    return <Loading />;
  }

  if (errorInvoice || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <p className="font-black text-slate-900 uppercase tracking-tighter">
            {t("errorTitle")}
          </p>
          <p className="text-xs text-slate-500">{t("errorSubtitle")}</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-2xl">
            {t("backToDashboard")}
          </Button>
        </Link>
      </div>
    );
  }

  const lastPayment =
    invoice.payments && invoice.payments.length > 0
      ? invoice.payments[0]
      : null;
  const isPending =
    lastPayment?.status === "Pending" || invoice.status === "Unpaid";

  const formatCurrency = (amount: string | number, symbol = "$") =>
    `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const getItemName = (item: any) => {
    if (item.membership_type_id) {
      const match = memberships.find(
        (m) => String(m.membership_type_id) === String(item.membership_type_id),
      );
      return match ? match.name : t("membership");
    }
    if (item.package_id) {
      const match = packages.find(
        (p) => String(p.packageId) === String(item.package_id),
      );
      return match ? match.name : t("additionalService");
    }
    return t("additionalService");
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4 animate-in fade-in zoom-in-95 duration-700">
      <Card className="w-full max-w-lg bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div
          className={cn(
            "pt-12 pb-8 px-8 text-center",
            isPending ? "bg-orange-50/50" : "bg-emerald-50/50",
          )}
        >
          <div
            className={cn(
              "mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm transition-all",
              isPending
                ? "bg-orange-500 text-white"
                : "bg-emerald-500 text-white",
            )}
          >
            {isPending ? (
              <Clock size={48} className="animate-pulse" />
            ) : (
              <CheckCircle2 size={48} />
            )}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3 italic uppercase">
            {isPending ? t("pendingTitle") : t("confirmedTitle")}
          </h2>
          <p className="text-sm text-slate-500 font-medium px-6">
            {isPending ? t("pendingDescription") : t("confirmedDescription")}
          </p>
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                <ReceiptText size={14} /> {t("orderSummary")}
              </h3>
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-500 font-bold text-[9px] px-2 py-0 border-none"
              >
                {invoice.invoice_number}
              </Badge>
            </div>

            <div className="space-y-3 bg-slate-50/50 p-5 border border-slate-100 rounded-2xl">
              {invoice.invoice_items.map((item: any, idx: number) => (
                <div
                  key={item.invoice_item_id || idx}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">
                      {getItemName(item)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-black uppercase">
                      {t("quantity")}: {item.quantity}
                    </span>
                  </div>
                  <span className="font-black text-slate-900">
                    {formatCurrency(item.unit_price)}
                  </span>
                </div>
              ))}

              <div className="pt-4 mt-2 border-t border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  {t("totalAmount")}
                </span>
                <span className="text-2xl font-black text-orange-600 tabular-nums">
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {lastPayment && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <CreditCard size={14} /> {t("paymentInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    {t("amountPaid")}
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {Number(lastPayment.amount_paid).toLocaleString()}{" "}
                    {lastPayment.currency_paid}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    {t("reference")}
                  </p>
                  <p className="text-sm font-black text-slate-800 truncate">
                    #{lastPayment.transaction_id || "N/A"}
                  </p>
                </div>
              </div>
              <div className="px-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase italic">
                <Info size={12} className="text-orange-500" />
                {t("appliedRate")}:{" "}
                {Number(lastPayment.exchange_rate).toFixed(2)}{" "}
                {lastPayment.currency_paid}/USD
              </div>
            </div>
          )}

          {isPending && (
            <div className="bg-orange-50 p-5 rounded-2xl flex gap-4 items-start border border-orange-100/50 shadow-sm">
              <div className="bg-orange-500 rounded-full p-1.5 text-white shrink-0 mt-0.5">
                <Info size={14} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-orange-900 uppercase tracking-tight">
                  {t("pendingBannerTitle")}
                </p>
                <p className="text-[11px] text-orange-800/80 leading-relaxed font-medium">
                  {t("pendingBannerText")}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <Link href="/dashboard" className="block w-full">
              <Button className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-sm gap-2 shadow-xl shadow-orange-600/20 transition-all active:scale-95 border-none">
                {t("goHome")} <ArrowRight size={18} />
              </Button>
            </Link>

            {lastPayment?.receipt_url && (
              <a
                href={lastPayment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button
                  variant="outline"
                  className="w-full h-12 text-slate-500 border-slate-200 font-bold text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50 rounded-2xl"
                >
                  <ExternalLink size={14} /> {t("viewReceipt")}
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
