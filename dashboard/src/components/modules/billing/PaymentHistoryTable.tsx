"use client";

import React from "react";
import { DataTable, Column } from "@/components/ui/table/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Receipt,
  Info,
  ArrowRightLeft,
  Clock,
  AlertCircle,
  RotateCcw,
  MoreVertical,
  XCircle,
} from "lucide-react";
import { PaymentMethodCell } from "./PaymentMethodCell";
import { Button } from "@/components/ui/button";
import { useUpdatePaymentStatus, PaymentStatus } from "@/hooks/billing/useUpdatePaymentStatus";
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mainCurrencies } from "@vitalfit/sdk";
import { useTranslations, useLocale } from "next-intl";

interface Payment {
  payment_id: string;
  amount_paid: string | number;
  amount_base: string | number;
  currency_paid: string;
  exchange_rate: string | number;
  payment_date: string;
  payment_method_id: string;
  status: PaymentStatus | string;
  transaction_id: string;
  receipt_url?: string;
}

interface PaymentHistoryTableProps {
  payments: Payment[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export function PaymentHistoryTable({ payments, isLoading, onRefresh }: PaymentHistoryTableProps) {
  const t = useTranslations("finance.Billing.paymentsTable");
  const locale = useLocale();
  const { token } = useAuth();
  const { updateStatus, loading: isUpdating } = useUpdatePaymentStatus();

  const formatCurrency = (amount: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency: currencyCode || "USD",
        currencyDisplay: "symbol",
      }).format(amount);
    } catch (e) {
      const symbol = mainCurrencies.find((c) => c.code === currencyCode)?.symbol || "$";
      return `${symbol} ${amount.toFixed(2)}`;
    }
  };

  const handleAction = async (id: string, newStatus: PaymentStatus) => {
    if (!token) {
      return;
    }
    const result = await updateStatus(id, newStatus, token);
    if (result.success) {
      onRefresh();
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: t("date"),
      accessor: "payment_date",
      render: (v) => (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
          <Calendar className="h-3 w-3" />
          {v ? new Date(v as string).toLocaleDateString(locale) : "—"}
        </div>
      ),
    },
    {
      header: t("method"),
      accessor: "payment_method_id",
      render: (v) => <PaymentMethodCell methodId={String(v)} />,
    },
    {
      header: t("amount"),
      accessor: "amount_paid",
      render: (_, row) => {
        const isNotUSD = row.currency_paid !== "USD";
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight tabular-nums">
                {formatCurrency(Number(row.amount_paid), row.currency_paid)}
              </span>
              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-black bg-muted/50 text-muted-foreground border-none">
                {row.currency_paid}
              </Badge>
            </div>
            {isNotUSD && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <ArrowRightLeft className="h-2.5 w-2.5" />
                <span>{t("baseAmount", { amount: Number(row.amount_base).toFixed(2) })}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: t("status"),
      accessor: "status",
      render: (v) => {
        const statusKey = (v === "Paid" ? "Completed" : v) as PaymentStatus;
        const statusMap = {
          Completed: { label: t("statuses.Completed"), variant: "success", icon: CheckCircle2 },
          Pending: { label: t("statuses.Pending"), variant: "warning", icon: Clock },
          Failed: { label: t("statuses.Failed"), variant: "error", icon: AlertCircle },
          Refunded: { label: t("statuses.Refunded"), variant: "outline", icon: RotateCcw },
        };
        const config = statusMap[statusKey] || { label: v, variant: "outline", icon: Info };
        const Icon = config.icon;
        return (
          <Badge variant={config.variant as any} className="text-[9px] uppercase font-black h-5 px-2 flex items-center gap-1 w-fit">
            <Icon className="h-2.5 w-2.5" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: "",
      accessor: "payment_id",
      render: (_, row) => {
        const hasReceipt = row.receipt_url && row.receipt_url !== "Pago reportado en sitio";

        return (
          <div className="flex items-center gap-1 justify-end pr-2">
            {hasReceipt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-sky-600 hover:bg-sky-50 rounded-full"
                      onClick={() => window.open(row.receipt_url, "_blank")}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px]">{t("viewReceipt")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground">{t("actionsLabel")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {(row.status === "Pending" || row.status === "Unpaid") && (
                  <DropdownMenuItem onClick={() => handleAction(row.payment_id, "Completed")} className="text-emerald-600 focus:text-emerald-600 cursor-pointer">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold">{t("actions.approve")}</span>
                  </DropdownMenuItem>
                )}

                {(row.status === "Pending" || row.status === "Unpaid") && (
                  <DropdownMenuItem onClick={() => handleAction(row.payment_id, "Failed")} className="text-destructive focus:text-destructive cursor-pointer">
                    <XCircle className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold">{t("actions.reject")}</span>
                  </DropdownMenuItem>
                )}

                {(row.status === "Completed" || row.status === "Paid") && (
                  <DropdownMenuItem onClick={() => handleAction(row.payment_id, "Refunded")} className="text-orange-600 focus:text-orange-600 cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold">{t("actions.refund")}</span>
                  </DropdownMenuItem>
                )}
                
                {(row.status === "Failed" || row.status === "Refunded") && (
                  <DropdownMenuItem onClick={() => handleAction(row.payment_id, "Pending")} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4" />
                    <span className="text-xs font-semibold">{t("actions.resetToPending")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <DataTable columns={columns} data={payments || []} isLoading={isLoading} rowIdKey="payment_id" enableRowSelection={false} />
    </div>
  );
}