"use client";

import { SetStateAction, useMemo } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Eye, Trash2, MailCheck, MailQuestion} from "lucide-react";
import { useTranslations } from "next-intl";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useClientActions } from "@/hooks/clients/useClientActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ClientFromAPI } from "@/hooks/clients/useClients";

export interface ClientFilters {
  search: string;
}

interface ClientsTableProps {
  data: ClientFromAPI[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems?: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  filters: ClientFilters;
  onFilterChange: (f: Partial<ClientFilters>) => void;
}

export default function ClientsTable({
  data,
  onReload,
  page,
  pageSize,
  totalPages,
  isLoading = false,
  onPageChange,
  searchInput,
  setSearchInput,
  filters,
  onFilterChange,
}: ClientsTableProps) {
  const t = useTranslations("clients");
  const { token } = useAuth();

  const { 
    isDeleting, 
    deleteRowId, 
    setDeleteRowId, 
    deleteClient, 
    handleView 
  } = useClientActions(token);

  const selectedClient = useMemo(() => 
    data.find(c => c.user_id === deleteRowId), 
  [data, deleteRowId]);

  const columns = useMemo<Column<ClientFromAPI>[]>(() => [
    {
      header: t("table.columns.name"),
      accessor: "first_name",
      render: (_, row) => (
        <div className="flex items-center gap-3 py-1 text-left">
          <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
            <AvatarImage src={row.profile_picture_url} alt={row.first_name} />
            <AvatarFallback className="bg-orange-50 text-orange-600 font-bold text-xs uppercase">
              {row.first_name[0]}{row.last_name[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-none lowercase first-letter:uppercase">
              {`${row.first_name} ${row.last_name}`}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-medium">
              DOC: {row.identity_document || "N/A"}
            </span>
          </div>
        </div>
      )
    },
    { 
      header: t("table.columns.email"), 
      accessor: "email",
      render: (val, row) => (
        <div className="flex items-center gap-2 group">
          <span className="text-sm text-slate-600 lowercase">{String(val)}</span>
          {row.is_validated ? (
            <MailCheck className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <MailQuestion className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
      )
    },
    { 
      header: t("table.columns.role"), 
      accessor: "role_name", 
      render: (val) => (
        <Badge variant="secondary" className="font-bold uppercase text-[9px] bg-slate-100 text-slate-500 border-slate-200">
          {String(val) || "client"}
        </Badge>
      )
    },
    {
      header: t("table.columns.status"),
      accessor: "status",
      render: (val) => {
        const isActive = val === "Active";
        return (
          <Badge 
            variant="outline" 
            className={cn(
              "font-bold shadow-none gap-1.5 py-0.5 uppercase text-[10px]",
              isActive 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-red-50 text-red-700 border-red-200"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            {isActive ? t("table.status.active") : t("table.status.blocked")}
          </Badge>
        );
      }
    },
    {
      header: t("table.columns.validation"),
      accessor: "is_validated",
      render: (val) => (
        <Badge 
          variant="outline" 
          className={cn(
            "font-black  uppercase tracking-tighter",
            val ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100"
          )}
        >
          {val ? t("table.status.verified") : t("table.status.pending")}
        </Badge>
      )
    }
  ], [t]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="relative w-full sm:w-[320px] group">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <Input
            placeholder={t("table.filter_placeholder")}
            className="pl-10 h-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <DataTable<ClientFromAPI>
        columns={columns}
        data={data}
        onPageChange={onPageChange}
        totalPages={totalPages}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        rowIdKey="user_id" 
        actions={(row) => (
          <div className="flex items-center justify-end gap-1 pr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-blue-50 rounded-lg transition-all"
              onClick={() => handleView(row.user_id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              onClick={() => setDeleteRowId(row.user_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <GeneralAlertDialog
        open={!!deleteRowId}
        onOpenChange={(open) => !open && setDeleteRowId(null)}
        title={t("table.delete_dialog.title")}
        description={`${t("table.delete_dialog.description")} ${selectedClient?.first_name || ""}?`}
        actionText={isDeleting ? t("table.delete_dialog.action_deleting") : t("table.delete_dialog.action_delete")}
        cancelText={t("table.delete_dialog.action_cancel")}
        onAction={() => deleteClient(deleteRowId!, onReload)}
        actionVariant="destructive"
      />
    </div>
  );
}