"use client";

import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/table/DataTable";
import { Eye, Download } from "lucide-react";
import { RowActions } from "@/components/ui/table/RowActions";
import { Input } from "@/components/ui/Input";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/routing";

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const t = useTranslations("MembershipHistory");

  const [planName, setPlanName] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const showClearFilters = useMemo(() => {
    return planName || status !== "all" || startDate || endDate;
  }, [planName, status, startDate, endDate]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  const clearFilters = () => {
    setPlanName("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const memberships = [
    {
      id: "m1",
      planName: t("plans.monthly"),
      startDate: "10/11/2025",
      endDate: "10/11/2025",
      totalPrice: "$250.00",
      status: t("status.active"),
    },
    {
      id: "m2",
      planName: t("plans.monthly"),
      startDate: "10/11/2025",
      endDate: "10/11/2025",
      totalPrice: "$250.00",
      status: t("status.cancelled"),
    },
    {
      id: "m3",
      planName: t("plans.monthly"),
      startDate: "10/11/2025",
      endDate: "10/11/2025",
      totalPrice: "$250.00",
      status: t("status.expired"),
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case t("status.active"):
        return "border border-green-300 text-green-600";
      case t("status.cancelled"):
        return "border border-red-300 text-red-500";
      case t("status.expired"):
        return "border border-gray-300 text-gray-500";
      default:
        return "border border-gray-300 text-gray-800";
    }
  };

  const columns = [
    {
      header: t("columns.planName"),
      accessor: "planName" as const,
    },
    {
      header: t("columns.startDate"),
      accessor: "startDate" as const,
    },
    {
      header: t("columns.endDate"),
      accessor: "endDate" as const,
    },
    {
      header: t("columns.totalPrice"),
      accessor: "totalPrice" as const,
    },
    {
      header: t("columns.status"),
      accessor: "status" as const,
      render: (value: string) => (
        <span
          className={`${getStatusStyle(value)} px-3 py-1 rounded text-xs font-semibold`}
        >
          {value}
        </span>
      ),
    },
  ];

  const actions = (row: any) => (
    <RowActions
      menuLabel={""}
      actions={[
        {
          label: t("actions.viewDetails"),
          icon: Eye,
          onClick: () => {
            router.replace(`/history/${row.id}`);
          },
        },
        {
          label: t("actions.downloadReceipt"),
          icon: Download,
          onClick: () => {
            console.log("Descargar recibo de:", row);
          },
        },
      ]}
    />
  );

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
                placeholder={t("filters.planName")}
                className="w-64 pl-9"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.status")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="cancelled">
                  {t("status.cancelled")}
                </SelectItem>
                <SelectItem value="expired">{t("status.expired")}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={t("filters.startDate")}
              className="w-40"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder={t("filters.endDate")}
              className="w-40"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            {showClearFilters && (
              <Button variant="outline" onClick={clearFilters}>
                {t("filters.clear")}
              </Button>
            )}
          </div>

          <DataTable
            columns={columns}
            data={memberships}
            actions={actions}
            enableRowSelection={false}
          />
        </div>
      </main>
    </div>
  );
}
