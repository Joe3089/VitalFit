"use client";

import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { QuickViewPaymentModal } from "./QuickViewPaymentModal";

interface PaymentsTableProps {
  data: any[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  filters: { search: string };
  onFilterChange: (filters: { search: string }) => void;
}

export default function PaymentsTable({
  data,
  page,
  totalPages,
  onPageChange,
  isLoading,
  filters,
  onFilterChange,
}: PaymentsTableProps) {
  const locale = useLocale();
  const t = useTranslations("clients.payments");
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, onFilterChange]);

  const columns: Column<any>[] = [
    {
      header: t("table.reference"),
      accessor: "invoice_id",
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs tracking-tighter">
          {String(val).substring(0, 12).toUpperCase()}
        </span>
      ),
    },
    {
      header: t("table.date"),
      accessor: "issue_date",
      render: (value) => (
        <span className="text-slate-600 text-sm">
          {new Date(value as string).toLocaleDateString(
            locale === "es" ? "es-ES" : "en-US",
            { year: "numeric", month: "short", day: "numeric" }
          )}
        </span>
      ),
    },
    {
      header: t("table.amount"),
      accessor: "total_amount",
      render: (value) => (
        <span className="font-black italic text-slate-900">
          {new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
            style: "currency",
            currency: "USD",
          }).format(Number(value))}
        </span>
      ),
    },
    {
      header: t("table.status"),
      accessor: "status",
      render: (value) => {
        const val = String(value).toLowerCase();
        const isPaid = val === "paid" || val === "pagado";
        
        return (
          <Badge
            variant={isPaid ? "success" : "warning"}
            className="font-bold uppercase text-[10px] px-2 py-0"
          >
            {t(`status.${val}`) || value}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-[300px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.search_placeholder")}
            className="pl-9 h-9 text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isLoading={isLoading}
        rowIdKey="invoice_id"
        actions={(row) => (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              onClick={() => setSelectedInvoiceId(row.invoice_id)}
              title={t("table.actions.view")}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <QuickViewPaymentModal
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onOpenChange={(open: boolean) => !open && setSelectedInvoiceId(null)}
      />
    </div>
  );
}