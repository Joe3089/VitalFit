"use client";
import { useTranslations } from "next-intl";
import { DataTable, Column } from "@/components/ui/table/DataTable";
import { InvoiceItemDetail } from "@vitalfit/sdk";

interface InvoiceItemsTableProps {
  data: InvoiceItemDetail[];
}

export default function InvoiceItemsTable({
  data = [],
}: InvoiceItemsTableProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const it = useTranslations("invoiceDetails.itemsTable");

  const columns: Column<InvoiceItemDetail>[] = [
    {
      header: it("type"),
      accessor: "quantity",
      render: (_, row) => {
        if (row.membership_type_id) {
          return (
            <span className="font-medium text-gray-600">
              {it("membership")}
            </span>
          );
        }
        if (row.package_id) {
          return (
            <span className="font-medium text-gray-600">{it("package")}</span>
          );
        }
        if (row.service_id) {
          return (
            <span className="font-medium text-gray-600">{it("service")}</span>
          );
        }
        return <span className="text-gray-400">{it("item")}</span>;
      },
    },
    {
      header: it("itemName"),
      accessor: "invoice_item_id",
      render: (_, row) => {
        let name = it("defaultItemName");
        let subId = row.invoice_item_id;

        if (row.membership_type_id) {
          name = it("premiumSubscription");
          subId = row.membership_type_id;
        } else if (row.package_id) {
          name = it("classPackage");
          subId = row.package_id;
        } else if (row.service_id) {
          name = it("generalService");
          subId = row.service_id;
        }

        return (
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">{name}</span>
            <span className="text-[10px] text-gray-400 font-mono uppercase">
              ID: {subId?.substring(0, 8)}
            </span>
          </div>
        );
      },
    },
    {
      header: it("quantity"),
      accessor: "quantity",
      render: (val) => (
        <div className="text-center font-medium">{String(val)}</div>
      ),
    },
    {
      header: it("unitPrice"),
      accessor: "unit_price",
      render: (val) => (
        <div className="text-right text-gray-600">
          {formatMoney(Number(val))}
        </div>
      ),
    },
    {
      header: it("discount"),
      accessor: "discount_applied",
      render: (val) => {
        const num = Number(val);
        return (
          <div className="text-right text-gray-500">
            {num > 0 ? formatMoney(num) : "-"}
          </div>
        );
      },
    },
    {
      header: it("subtotal"),
      accessor: "total_line",
      render: (val) => (
        <div className="text-right font-bold text-gray-900 text-base">
          {formatMoney(Number(val))}
        </div>
      ),
    },
  ];

  columns[0].accessor = "membership_type_id";

  return (
    <div className="mt-0">
      <DataTable
        data={data}
        columns={columns}
        enableRowSelection={false}
        rowIdKey="invoice_item_id"
        page={1}
        totalPages={1}
        pageSize={100}
      />
    </div>
  );
}
