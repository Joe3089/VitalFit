"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FileDown, Loader2 } from "lucide-react"; // Importamos iconos para el export

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { usePaymentMethods } from "@/hooks/payment-methods/usePaymentMethods";
import PaymentTable from "@/components/modules/payment-methods/PaymentTable";

// --- INTEGRACIÓN DE EXPORTACIÓN ---
import { api } from "@/lib/sdk-config";
import { useExport } from "@/hooks/export/use-export";

export default function PaymentMethodsPage() {
  const t = useTranslations("catalog.payment_methods");
  const router = useRouter();
  const { token } = useAuth();
  const { handleExport, isExporting } = useExport();

  const [searchQuery, setSearchQuery] = useState("");

  const { methods, stats, loading, filters, setFilters, pagination, refresh } =
    usePaymentMethods(token);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchQuery });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onExportClick = () => {
    const fileName = t("export_filename");

    handleExport(
      "payment-methods",
      (jwt) => api.exports.exportPaymentMethods(jwt), 
      `${fileName}_${new Date().toISOString().split("T")[0]}`,
      "csv",
    );
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={t("stats.total")}
          value={
            <h3 className="ml-1.5 font-bold text-primary">
              {stats.total ?? 0}
            </h3>
          }
        />
        <StatCard
          title={t("stats.cash")}
          value={
            <h3 className="ml-1.5 font-bold text-green-500">
              {stats.cash ?? 0}
            </h3>
          }
        />
        <StatCard
          title={t("stats.gateway")}
          value={
            <h3 className="ml-1.5 font-bold text-blue-500">
              {stats.gateway ?? 0}
            </h3>
          }
        />
        <StatCard
          title={t("stats.digital")}
          value={
            <h3 className="ml-1.5 font-bold text-primary">
              {stats.digital ?? 0}
            </h3>
          }
        />
      </div>

      <PageHeader title={t("title")}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExportClick}
            disabled={isExporting !== null || loading}
          >
            {isExporting === "payment-methods" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "payment-methods" ? t("exporting") : t("export")}
          </Button>
          <Button onClick={() => router.push("/catalog/payment-methods/new")}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t("add_button")}
          </Button>
        </div>
      </PageHeader>

      <PaymentTable
        data={methods}
        loading={loading}
        pagination={pagination}
        filters={filters}
        setFilters={setFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={refresh}
      />
    </div>
  );
}
