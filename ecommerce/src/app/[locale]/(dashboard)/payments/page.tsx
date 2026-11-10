"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useMyInvoices } from "@/hooks/useClientInvoices";
import PaymentHistoryTable from "@/components/features/dashboard/PaymentHistoryTable";

export default function HistoryPaymentPage() {
  const t = useTranslations("paymentHistory");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    invoices,
    loading: invoicesLoading,
    page,
    setPage,
    totalPages,
    setSearch,
  } = useMyInvoices({ limit: 10 });

  const showClearFilters = searchTerm !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSearch(value);
    setPage(1);
  };

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") {
      return invoices;
    }

    return invoices.filter(
      (inv) => inv.status.toLowerCase() === statusFilter.toLowerCase(),
    );
  }, [invoices, statusFilter]);

  return (
    <div className="min-h-screen">
      <main className="p-8">
        <PageHeader title={t("title")} />

        <div className="space-y-4 my-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="relative w-full sm:w-[250px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("filters.payname")}
                className="w-64 pl-9"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.status")}</SelectItem>{" "}
                <SelectItem value="Paid">{t("status.paid")}</SelectItem>
                <SelectItem value="Unpaid">{t("status.unpaid")}</SelectItem>
                <SelectItem value="Overdue">{t("status.overdue")}</SelectItem>
                <SelectItem value="Void">{t("status.void")}</SelectItem>
              </SelectContent>
            </Select>

            {showClearFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {t("filters.clear")}
              </Button>
            )}
          </div>

          <PaymentHistoryTable
            data={filteredInvoices}
            loading={invoicesLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </main>
    </div>
  );
}
