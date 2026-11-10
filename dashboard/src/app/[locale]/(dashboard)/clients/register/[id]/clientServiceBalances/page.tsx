"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useClientBalances } from "@/hooks/clients/useClientBalances";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, RefreshCw, Ticket, Ban, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { BalanceCard } from "@/components/modules/clients/BalanceCard";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ClientServiceBalances() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { token } = useAuth();
  const t = useTranslations("clients.balances");
  
  const { balances, isLoading, refetch } = useClientBalances(userId, token);
  const [searchTerm, setSearchTerm] = useState("");

  const processedBalances = useMemo(() => {
    const filtered = balances.filter((b) =>
      b.service.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (a.balance === 0 && b.balance !== 0) {
        return -1;
      }
      if (a.balance !== 0 && b.balance === 0) {
        return 1;
      }
      if (a.balance <= 5 && b.balance > 5) {
        return -1;
      }
      if (a.balance > 5 && b.balance <= 5) {
        return 1;
      }
      if (a.service.IsFeatured && !b.service.IsFeatured) {
        return -1;
      }
      if (!a.service.IsFeatured && b.service.IsFeatured) {
        return 1;
      }
      return 0;
    });
  }, [balances, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
          {t("syncing")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
          {t("backButton") || "Volver al Perfil"}
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter">
                {t("walletTitle")}
              </h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-14">
              {t("walletSubtitle") || "Gestión de créditos y consumo de servicios"}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-10 h-11 text-[11px] font-bold uppercase italic tracking-tighter bg-white border-slate-200 shadow-sm rounded-xl focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="h-11 w-11 rounded-xl bg-white border-slate-200 hover:bg-primary/5 active:scale-95 transition-all"
              title={t("updateButton")}
            >
              <RefreshCw className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />
      {balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
          <Ticket className="h-16 w-16 mb-4 text-slate-300" />
          <p className="text-xs font-black uppercase italic tracking-widest text-slate-400">
            {t("emptyWallet")}
          </p>
        </div>
      ) : processedBalances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-muted-foreground animate-in zoom-in-95 duration-300">
          <Ban className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">
            {t("noResults")}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)] pr-4 -mr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {processedBalances.map((item) => (
              <BalanceCard key={item.service_id} data={item} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}