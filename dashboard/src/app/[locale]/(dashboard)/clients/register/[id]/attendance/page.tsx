"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale"; 
import { 
  Calendar as CalendarIcon, 
  CalendarX, 
  RefreshCcw, 
  ChevronLeft,
  AlertCircle
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import AttendanceTable from "@/components/modules/clients/AttendanceTable";
import { useAuth } from "@/context/AuthContext";
import { useClientAttendance } from "@/hooks/clients/useClientAttendance";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ClientAttendancePage() {
  const t = useTranslations("clients.AttendanceHistory");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const dateLocale = locale === "es" ? es : enUS;
  const userId = params.id as string;

  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const {
    attendance,
    totalPages,
    isLoading,
    isSyncing,
    isError,
    mutate
  } = useClientAttendance(userId, token, {
    page,
    limit: 10,
    start: startDate ? startDate.toISOString() : undefined,
    end: endDate ? endDate.toISOString() : undefined,
  });

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500 text-left">

      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="h-8 px-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("back") || "Volver"}
        </Button>
      </div>

      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-end gap-4">

          <div className="flex flex-col gap-1 lg:flex-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">
              {t("filters.from")}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 border-slate-200 shadow-none hover:bg-slate-50",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary/50" />
                  {startDate ? format(startDate, "dd MMM yyyy", { locale: dateLocale }) : t("filters.placeholder")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      date.setHours(0, 0, 0, 0);
                    }
                    setStartDate(date);
                    setPage(1);
                  }}
                  locale={dateLocale} 
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1 lg:flex-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">
              {t("filters.until")}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10 border-slate-200 shadow-none hover:bg-slate-50",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary/50" />
                  {endDate ? format(endDate, "dd MMM yyyy", { locale: dateLocale }) : t("filters.placeholder")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      date.setHours(23, 59, 59, 999);
                    }
                    setEndDate(date);
                    setPage(1);
                  }}
                  locale={dateLocale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 lg:w-auto">
            {(startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex-1 lg:flex-none text-destructive border-destructive/20 hover:bg-destructive/5 h-10 transition-colors font-bold uppercase text-[10px]"
              >
                <CalendarX className="h-4 w-4 mr-1.5" />
                {t("filters.clear")}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => mutate()}
              disabled={isLoading || isSyncing}
              className="h-10 w-10 border border-slate-100 hover:bg-slate-50"
            >
              <RefreshCcw 
                className={cn(
                  "h-4 w-4 text-muted-foreground",
                  isSyncing && "animate-spin text-primary"
                )} 
              />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden min-h-[400px]">
        {isError ? (
          <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
            <div className="bg-destructive/10 p-4 rounded-full">
               <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 font-bold italic uppercase tracking-tighter text-lg">
                {t("states.errorTitle")}
              </p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                {t("states.errorSubtitle")}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => mutate()} 
              className="font-bold uppercase text-[10px] tracking-widest"
            >
              <RefreshCcw className="h-3 w-3 mr-2" />
              {t("states.retry")}
            </Button>
          </div>
        ) : (
          <AttendanceTable
            data={attendance}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
      {!isLoading && !isError && isSyncing && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse pb-4">
          <div className="h-1.5 w-1.5 bg-primary rounded-full" />
          {t("states.loading")}
        </div>
      )}
    </div>
  );
}