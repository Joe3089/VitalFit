"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  AlertCircle,
  Loader2,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useGetUser } from "@/hooks/users/useGetUser";
import { api } from "@/lib/sdk-config";
import { InvoiceDetailForm } from "@/components/modules/billing/InvoiceDetailForm";
import useGetBranch from "@/hooks/branches/useGetBranch";
import { InvoiceAdjustmentsSection } from "@/components/modules/billing/InvoiceAdjustmentsSection";

export default function InvoiceDetailPage() {
  const t = useTranslations("finance.Billing.detailPage");
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateSafe = (dateString: string) => {
    if (!dateString) {
      return "—";
    }
    try {
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        return "—";
      }

      return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return "—";
    }
  };

  const fetchInvoiceDetails = useCallback(async () => {
    if (!id || !token) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await api.billing.getInvoiceByID(id as string, token);
      
      if (response?.data) {
        setInvoice(response.data);
      } else {
        setError(t("errors.notFound"));
      }
    } catch (err: any) {
      setError(err.message || t("errors.serverError"));
    } finally {
      setLoading(false);
    }
  }, [id, token, t]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  const { user, loading: userLoading } = useGetUser(invoice?.user_id, token);
  const { branchDetail, loading: branchLoading } = useGetBranch(
    invoice?.branch_id,
    token
  );
  
  const financialSummary = useMemo(() => {
    if (!invoice) {
      return { totalPaid: 0, pendingAmount: 0 };
    }

    const totalInvoiceAmount = Number(invoice.total_amount || 0);

    const totalPaidUSD = (invoice.payments || [])
      .filter((p: any) => p.status === "Completed")
      .reduce((acc: number, p: any) => acc + Number(p.amount_base || 0), 0);

    const roundedTotalPaid = Math.round(totalPaidUSD * 100) / 100;

    const pending = totalInvoiceAmount - roundedTotalPaid;

    return {
      totalPaid: roundedTotalPaid,
      pendingAmount: pending <= 0.05 ? 0 : pending,
    };
  }, [invoice]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-500">
      <PageHeader
        title={
          invoice
            ? t("title", { number: invoice.invoice_number })
            : t("defaultTitle")
        }
        subtitle={
          invoice ? (
            <span className="flex flex-col gap-1.5 mt-1">
              <span className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-primary/70" />
                <span>
                  {t("issuedAt", { date: formatDateSafe(invoice.issue_date) })}
                </span>
              </span>

              <span className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4" />
                {branchLoading ? (
                  <span className="animate-pulse bg-primary/10 h-4 w-32 rounded inline-block" />
                ) : (
                  <span>{branchDetail?.name || t("unknownBranch")}</span>
                )}
              </span>
            </span>
          ) : (
            t("loadingDocument")
          )
        }
        actionButton={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={loading || !!error}
              className="hidden sm:flex"
            >
              <Printer className="h-4 w-4 mr-2" /> {t("actions.print")}
            </Button>
            <Button size="sm" variant="default" disabled={loading || !!error}>
              <Download className="h-4 w-4 mr-2" /> {t("actions.export")}
            </Button>
          </div>
        }
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </PageHeader>

      <Separator className="my-6" />

      {error ? (
        <Alert
          variant="destructive"
          className="bg-destructive/5 border-destructive/20 text-destructive"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold uppercase tracking-tight text-xs">
            {t("errors.title")}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3 text-sm mt-1">
            {error}
            <Button
              variant="outline"
            
              onClick={fetchInvoiceDetails}
            >
              {t("errors.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-bold text-foreground">
              {t("loading.title")}
            </p>
            <p className="text-xs text-muted-foreground animate-pulse">
              {t("loading.subtitle")}
            </p>
          </div>
        </div>
      ) : (
        <>
        <InvoiceDetailForm
          invoice={invoice}
          user={user}
          userLoading={userLoading}
          onRefresh={fetchInvoiceDetails}
          pendingAmount={financialSummary.pendingAmount}
          branchName={branchDetail?.name}
        />
        <InvoiceAdjustmentsSection
          invoiceId={id as string}
          invoiceStatus={invoice?.status}
          onApplied={fetchInvoiceDetails}
        />
        </>
      )}
    </div>
  );
}