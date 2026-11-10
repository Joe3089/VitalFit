"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Ticket, AlertCircle, Zap } from "lucide-react";

interface BalanceCardProps {
  data: {
    balance: number;
    updated_at: string;
    service: {
      Name: string;
      IsFeatured: boolean;
      DurationMinutes: number;
      Category?: { Name: string };
    };
  };
}

export const BalanceCard = ({ data }: BalanceCardProps) => {
  const t = useTranslations("clients.balances.status");
  const { balance, service, updated_at } = data;
  
  const serviceName = service.Name || t("defaultServiceName");
  const isLowBalance = balance <= 5 && balance > 0;
  const isEmpty = balance === 0;

  return (
    <Card className={cn(
      "group relative border-none shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:-translate-y-2",
      isEmpty ? "bg-zinc-100 grayscale" : "bg-white"
    )}>
      
      <div className="absolute bottom-[52px] -left-3 w-6 h-6 bg-background rounded-full z-20 shadow-inner" />
      <div className="absolute bottom-[52px] -right-3 w-6 h-6 bg-background rounded-full z-20 shadow-inner" />

      <CardContent className="p-0 text-left flex flex-col h-full">
        <div className="p-8 flex-1 space-y-6">

          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-zinc-200 text-zinc-400 py-1">
                {service.Category?.Name || t("fitnessService")}
              </Badge>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-[1.1] max-w-[220px]">
                {serviceName}
              </h3>
            </div>
            
            {service.IsFeatured && (
              <Zap className="h-5 w-5 text-primary fill-primary opacity-20 group-hover:opacity-100 transition-opacity" />
            )}
          </div>

          <div className="flex items-end justify-between pt-2">
            <div className="flex items-baseline gap-3">
              <span className={cn(
                "text-7xl font-black italic tracking-tighter leading-none",
                isEmpty ? "text-zinc-300" : isLowBalance ? "text-orange-500" : "text-slate-900"
              )}>
                {balance}
              </span>
              <div className="flex flex-col gap-1.5 mb-1">
                <span className="text-[11px] font-black uppercase text-muted-foreground/60 italic leading-none tracking-tight">
                  {t("credits")}
                </span>
                <div className="flex gap-1">
                    <div className={cn("h-1 w-4 rounded-full", !isEmpty ? (isLowBalance ? "bg-orange-500" : "bg-primary") : "bg-zinc-200")} />
                    <div className="h-1 w-4 rounded-full bg-zinc-100" />
                    <div className="h-1 w-4 rounded-full bg-zinc-100" />
                </div>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-zinc-50 rounded-2xl text-[10px] font-black italic border border-zinc-100 flex items-center gap-2 shadow-sm">
                <Clock className="h-3.5 w-3.5 text-primary" /> 
                {service.DurationMinutes} MIN
            </div>
          </div>
        </div>

        <div className={cn(
          "w-full px-8 py-4 flex items-center justify-between border-t-2 border-dashed transition-colors",
          isEmpty ? "bg-zinc-200 text-zinc-500 border-zinc-300" : 
          isLowBalance ? "bg-orange-500 text-white border-orange-400" : "bg-[#121212] text-white border-zinc-800"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg flex items-center justify-center",
              isLowBalance ? "bg-orange-400" : "bg-white/10"
            )}>
               {isLowBalance ? <AlertCircle className="h-3.5 w-3.5 animate-bounce" /> : <Ticket className="h-4 w-4" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">
              {isEmpty ? t("empty") : isLowBalance ? t("critical") : t("available")}
            </span>
          </div>
          
          <div className="flex flex-col items-end leading-none">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">UPD:</span>
            <span className="text-[9px] font-black italic">
               {new Date(updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};