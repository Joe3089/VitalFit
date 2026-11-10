"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import AudithTable from "@/components/modules/audith/AudithTable";
import { LogDetailsSheet } from "@/components/modules/audith/LogDetailsSheet";
import { PageHeader } from "@/components/ui/PageHeader";
import { Search, SlidersHorizontal, ArrowUpDown, ListFilter } from "lucide-react";
import { AuditLog } from "@vitalfit/sdk";
import { useAuditLogs } from "@/hooks/audith/useAuditLogs";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SecuritySessionsDialog } from "@/components/modules/audith/SecuritySessionsDialog";


const getDynamicActivity = (path: string) => {

  const segments = path.replace(/^\/v1\//, "").split("/");

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const cleanSegments = segments
    .filter(segment => segment.length > 0 && !uuidRegex.test(segment))
    .map(segment => segment.replace(/-/g, " ").toUpperCase());

  if (cleanSegments.length === 0) {
    return "SISTEMA";
  }
  if (cleanSegments.length > 1) {
    const [module, ...actions] = cleanSegments;
    return `${module}: ${actions.join(" ")}`;
  }

  return cleanSegments[0];
};

export default function AudithPage() {
  const t = useTranslations("user.audit");
  const { token, user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sessionTargetUserId, setSessionTargetUserId] = useState<string | null>(null);
  const [isSessionsDialogOpen, setIsSessionsDialogOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const filters = useMemo(() => ({
    page,
    limit,
    sort,
    search: debouncedSearch || undefined
  }), [page, limit, sort, debouncedSearch]);

  const { logs, totalPages, isLoading } = useAuditLogs(
    token || "",
    user?.user_id || "",
    filters
  );

  const processedLogs = useMemo(() => {
    if (!logs) {
      return [];
    }
    
    return logs.map((log: any) => ({
      ...log,
      displayPath: getDynamicActivity(log.path)
    }));
  }, [logs]);

  const handleViewSessions = (userId: string) => {
    setSessionTargetUserId(userId);
    setIsSessionsDialogOpen(true);
  };

  if (!token || !user) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 text-left animate-in fade-in duration-500">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <Card className="border-none bg-zinc-50/50 dark:bg-zinc-900/50 shadow-none border-b rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">

            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2 ml-1">
                <Search className="h-3 w-3" /> {t("filters.search")}
              </label>
              <Input
                placeholder={t("filters.searchPlaceholder")}
                className="h-10 pl-4 bg-background border-zinc-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full md:w-44 space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2 ml-1">
                <ArrowUpDown className="h-3 w-3" /> {t("filters.sort")}
              </label>
              <Select value={sort} onValueChange={(v: "asc" | "desc") => setSort(v)}>
                <SelectTrigger className="h-10 bg-background border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t("filters.sortDesc")}</SelectItem>
                  <SelectItem value="asc">{t("filters.sortAsc")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-36 space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2 ml-1">
                <SlidersHorizontal className="h-3 w-3" /> {t("filters.limit")}
              </label>
              <Select 
                value={String(limit)} 
                onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="h-10 bg-background border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num} {t("filters.limitRowsSuffix") || "filas"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <ListFilter className="h-4 w-4" />
            {t("status.results")}
            {isLoading && (
              <span className="ml-2 animate-pulse text-primary font-black italic">
                {t("status.loading")}...
              </span>
            )}
          </div>
        </div>
        
        <AudithTable
          data={processedLogs} 
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          limit={limit}
          onViewDetails={(log) => {
            setSelectedLog(log);
            setIsSheetOpen(true);
          }}
        />
      </div>

      <LogDetailsSheet
        log={selectedLog}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onViewSessions={handleViewSessions}
      />

      <SecuritySessionsDialog
        userId={sessionTargetUserId}
        open={isSessionsDialogOpen}
        onOpenChange={setIsSessionsDialogOpen}
      />
    </div>
  );
}