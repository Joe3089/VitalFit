"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Download, Eye } from "lucide-react";
import { ClientMembershipItem } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface MembershipManagementTableProps {
  data: ClientMembershipItem[];
  isLoading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string; status: string };
  onFilterChange: (filters: { search?: string; status?: string }) => void;
}

export default function MembershipManagementTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: MembershipManagementTableProps) {
  const t = useTranslations("finance.MembershipManagement");
  const [searchInput, setSearchInput] = useState(filters.search);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, onFilterChange]);

const COLUMNS_MEMBERSHIPS: Column<ClientMembershipItem>[] = [
    {
      header: t("table.client"),
      accessor: "user" as any,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-slate-900">
            {row.user 
              ? `${row.user.first_name} ${row.user.last_name}` 
              : "Usuario desconocido"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.user?.email || "—"}
          </span>
        </div>
      ),
    },
    {
      header: t("table.plan"),
      accessor: "membership_type" as any,
      render: (_, row) => (
        <span className="font-medium text-sm text-slate-700">
          {row.membership_type?.name || "Sin plan asignado"}
        </span>
      ),
    },
    {
      header: t("table.price"),
      accessor: "price" as any,
      render: (_, row) => (
        <span className="text-sm font-medium">
          ${row.membership_type?.price ?? 0}
        </span>
      ),
    },
    {
      header: t("table.start"),
      accessor: "start_date",
      render: (value) => (
        <span className="text-sm text-slate-600">
          {value ? new Date(value as string).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      header: t("table.expiry"),
      accessor: "end_date",
      render: (value) => (
        <span className="text-sm text-slate-600">
           {value ? new Date(value as string).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      header: t("table.status"),
      accessor: "status",
      render: (value) => {
        const status = String(value || ""); 
        
        const styles: Record<string, string> = {
          Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
          Expired: "bg-amber-50 text-amber-700 border-amber-200",
          Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
        };
        
        const statusKey = Object.keys(styles).find(
            k => k.toLowerCase() === status.toLowerCase()
        ) || status;

        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[statusKey] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
            {status ? t(`statuses.${status.toLowerCase()}`) : "—"}
          </span>
        );
      },
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-[320px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9 h-10 border-slate-200"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange({ status: value })}
          >
            <SelectTrigger className="w-[180px] h-10 border-slate-200">
              <SelectValue placeholder={t("statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("statuses.all")}</SelectItem>
              <SelectItem value="Active">{t("statuses.active")}</SelectItem>
              <SelectItem value="Expired">{t("statuses.expired")}</SelectItem>
              <SelectItem value="Cancelled">{t("statuses.cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.status !== "all") && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-10 text-slate-500 hover:text-rose-600"
              onClick={() => { setSearchInput(""); onFilterChange({ search: "", status: "all" }); }}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={COLUMNS_MEMBERSHIPS}
        data={data}
        isLoading={isLoading}
        onPageChange={onPageChange}
        totalPages={totalPages}
        page={page}
        rowIdKey="client_membership_id"
        actions={(row) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full"
                onClick={() => router.replace(`/finance/memberships/${row.client_membership_id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">{t("viewDetails")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      />
    </TooltipProvider>
  );
}