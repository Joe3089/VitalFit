"use client";

import { useTranslations } from "next-intl";
import { Eye, Download, Loader2 } from "lucide-react";
import { DataTable, Column } from "@/components/ui/table/DataTable";
import { ClientInvoice } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/routing";

interface PaymentHistoryTableProps {
  data: ClientInvoice[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaymentHistoryTable({
  data = [],
  loading = false,
  page,
  totalPages,
  onPageChange,
}: PaymentHistoryTableProps) {
  const t = useTranslations("paymentHistory");
  const router = useRouter();

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "-";
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "-";
      }

      return date.toLocaleDateString("es-ES", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const getStatusStyle = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "paid") {
      return "border border-green-200 bg-green-100 text-green-700";
    }
    if (s === "unpaid") {
      return "border border-yellow-200 bg-yellow-100 text-yellow-700";
    }
    if (s === "overdue") {
      return "border border-red-200 bg-red-100 text-red-700";
    }
    if (s === "void") {
      return "border border-gray-200 bg-gray-100 text-gray-700";
    }
    return "border border-gray-200 text-gray-600";
  };

  const handleViewDetails = (invoiceId: string) => {
    router.push(`/payments/${invoiceId}`);
  };

  const columns: Column<ClientInvoice>[] = [
    {
      header: t("columns.transactionId"),
      accessor: "invoice_id",
      render: (val) => (
        <span className="font-medium text-gray-900">
          {String(val).substring(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      header: t("columns.date"),
      accessor: "issue_date",
      render: (val) => (
        <span className="text-gray-500">{formatDate(String(val))}</span>
      ),
    },
    {
      header: t("columns.totalPrice"),
      accessor: "total_amount",
      render: (val) => (
        <span className="font-bold">{formatCurrency(String(val))}</span>
      ),
    },
    {
      header: t("columns.status"),
      accessor: "status",
      render: (val) => {
        const statusString = String(val).toLowerCase();
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(statusString)}`}
          >
            {t(`status.${statusString}`) || val}
          </span>
        );
      },
    },
  ];

  const renderActions = (row: ClientInvoice) => (
    <div className="flex items-center gap-2">
      <button
        title={t("actions.viewDetails")}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
        onClick={() => handleViewDetails(row.invoice_id)}
      >
        <Eye size={18} />
      </button>
      <button
        title={t("actions.downloadReceipt")}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
        onClick={() =>
          console.log("Lógica de descarga pendiente para ID:", row.invoice_id)
        }
      >
        <Download size={18} />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">{t("title")}</h3>
        {loading && (
          <Loader2 className="animate-spin text-orange-400 h-5 w-5" />
        )}
      </div>

      {loading && data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-400 animate-pulse">
          {t("loading")}
        </div>
      ) : (
        <DataTable<ClientInvoice>
          columns={columns}
          data={data}
          actions={renderActions}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          enableRowSelection={false}
          rowIdKey="invoice_id"
        />
      )}
    </div>
  );
}
