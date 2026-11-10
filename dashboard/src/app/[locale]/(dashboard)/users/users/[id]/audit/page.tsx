"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuditLogs } from "@/hooks/audith/useAuditLogs";
import { DataTable, type Column } from "@/components/ui/table/DataTable";
import type { AuditLog } from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function UserAuditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("user.management");
  const taudit = useTranslations("user.audit");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { logs, totalPages, isLoading } = useAuditLogs(
    token ?? "",
    id ?? "",
    { page, limit: pageSize, sort: "desc" },
    false
  );

  const columns: Column<AuditLog>[] = [
    { header: taudit("table.created_at"), accessor: "created_at", render: (v: any) => new Date(String(v)).toLocaleString() },
    { header: taudit("table.method"), accessor: "method" },
    { header: taudit("table.path"), accessor: "path" },
    { header: taudit("table.ip_address"), accessor: "ip_address" },
    { header: taudit("table.status"), accessor: "status" },
    { header: taudit("table.payload"), accessor: "payload", render: (v: any) => <pre className="whitespace-pre-wrap max-h-32 overflow-auto text-xs">{String(v ?? "")}</pre> },
  ];

  return (
    <div className="p-8 bg-white rounded-xl shadow flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("activities_modal.title", { name: "", lastname: "" })} subtitle={t("activities_modal.description")} />
        <div className="ml-4">
          <Button className="bg-orange-400" onClick={() => router.back()}>
            {t("actions.cancel")}
          </Button>
        </div>
      </div>

      <div className="w-full overflow-auto">
        <div className="min-w-[700px] md:min-w-0">
          <DataTable<AuditLog>
            columns={columns}
            data={logs}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
