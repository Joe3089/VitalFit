"use client";
import { InvoiceList } from "@vitalfit/sdk";
import { Eye, Calendar } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { useRouter } from "@/i18n/navigation";

interface InvoiceTableProps {
  data: InvoiceList[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onActionSuccess: () => void;
}

export function InvoiceTable({
  data,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  onActionSuccess,
}: InvoiceTableProps) {
  const t = useTranslations("finance.Billing");
  const locale = useLocale();
  const router = useRouter();

  const formatTableDate = (dateString: string) => {
    if (!dateString) {
      return "—";
    }
    try {
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return "—";
    }
  };

  const handleView = (id: string) => {
    router.push(`/finance/billing/${id}`);
  };

  const columns: Column<InvoiceList>[] = [
    {
      header: t("table.invoiceNumber"),
      accessor: "invoice_number",
      render: (v) => (
        <span className="font-mono font-medium">{v as string}</span>
      ),
    },
    {
      header: t("table.client"),
      accessor: "client_name",
    },
    {
      header: t("table.date"),
      accessor: "issue_date",
      render: (v) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatTableDate(v as string)}
        </div>
      ),
    },
    {
      header: t("table.total", { currency: "USD" }),
      accessor: "total_amount",
      render: (v) => {
        const amount = parseFloat(v as string);
        return (
          <span className="font-bold tabular-nums">
            {new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)}
          </span>
        );
      },
    },
    {
      header: t("table.status"),
      accessor: "status",
      render: (value) => {
        const status = value as string; 

        const config: Record<
          string,
          { variant: "success" | "warning" | "error" | "outline" | "secondary" }
        > = {
          Paid: { variant: "success" },
          Unpaid: { variant: "warning" },
          Overdue: { variant: "error" },
          Void: { variant: "outline" },
          Partial: { variant: "secondary" },
        };

        const s = config[status] || { variant: "outline" };

        const statusLabel = t.has(`status.${status}`) ? t(`status.${status}`) : status;

        return (
          <Badge
            variant={s.variant}
            className="text-[10px] uppercase font-bold tracking-tighter"
          >
            {statusLabel}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="rounded-md border bg-card shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        rowIdKey="invoice_id"
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end pr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
              onClick={() => handleView(row.invoice_id)}
              title={t("table.actions.view")}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
