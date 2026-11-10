"use client";

import React, { Dispatch, SetStateAction } from "react";
import { DataTable, Column } from "@/components/ui/table/DataTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, CalendarCheck, Eye } from "lucide-react";
import { AssignedClientResponse } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; 

interface InstructorClientsTableProps {
  data: AssignedClientResponse[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}

export function InstructorClientsTable({ 
  data, 
  isLoading, 
  page, 
  totalPages, 
  onPageChange,
  searchInput,
  setSearchInput 
}: InstructorClientsTableProps) {
  
  const router = useRouter();
  const t = useTranslations("instructor_clients.table");

  const handleView = (id: string) => {
    router.replace(`/clients/register/${id}`);
  };

  const columns: Column<AssignedClientResponse>[] = [
    {
      header: t("columns.client"),
      accessor: "first_name",
      render: (_, row) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-9 w-9 border shadow-sm">
            <AvatarImage src={row.profile_picture_url} alt={row.first_name} />
            <AvatarFallback className="text-[10px] font-bold bg-slate-50 text-slate-500">
              {row.first_name?.[0]}{row.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-sm text-slate-900 leading-none">
              {row.first_name} {row.last_name}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: t("columns.contact"),
      accessor: "phone",
      render: (value) => (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          {value || "---"}
        </div>
      ),
    },
    {
      header: t("columns.bookings"),
      accessor: "total_bookings" as any,
      render: (value) => (
        <Badge variant="secondary" className="font-bold bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100 transition-colors">
          <CalendarCheck className="w-3.5 h-3.5 mr-1.5 opacity-70" />
          {value} {t("bookings_unit")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="w-full">
      <TooltipProvider> 
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rowIdKey="user_id"
          actions={(row) => (
            <div className="flex justify-end pr-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => handleView(row.user_id)}
                    className="flex items-center justify-center p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50/50 transition-all shadow-sm active:scale-90 group"
                  >
                    <Eye className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl">
                  {t("view_details")}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        />
      </TooltipProvider>
    </div>
  );
}