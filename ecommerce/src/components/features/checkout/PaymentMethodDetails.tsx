"use client";

import { useState } from "react";
import {
  Copy,
  CheckCheck,
  Landmark,
  Phone,
  FileText,
  Mail,
  Hash,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { usePaymentMethodDetail } from "@/hooks/usePaymentMethodDetail";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Props {
  methodId: string;
  token: string;
}

export const PaymentMethodDetails = ({ methodId, token }: Props) => {
  const t = useTranslations("Checkout.PaymentMethodDetails");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { method, loading } = usePaymentMethodDetail(methodId, token);

  if (loading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!method) {
    return null;
  }

  const copyToClipboard = (text: string, field: string) => {
    if (!text) {
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const config = (method.configuration || {}) as Record<
    string,
    string | number
  >;
  const configKeys = Object.keys(config).filter(
    (key) =>
      config[key] !== null && config[key] !== undefined && config[key] !== "",
  );

  const getIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("bank") || k.includes("banco")) {
      return <Landmark className="h-4 w-4" />;
    }
    if (k.includes("phone") || k.includes("telefono") || k.includes("movil")) {
      return <Phone className="h-4 w-4" />;
    }
    if (
      k.includes("tax") ||
      k.includes("rif") ||
      k.includes("cedula") ||
      k.includes("id")
    ) {
      return <FileText className="h-4 w-4" />;
    }
    if (k.includes("email") || k.includes("correo")) {
      return <Mail className="h-4 w-4" />;
    }
    return <Hash className="h-4 w-4" />;
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="space-y-2">
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1"
        >
          {method.name || "Instrucciones"}
        </Badge>
        <h2 className="text-xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
          {t("transferTitle")}
        </h2>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[90%]">
          {t("transferSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {configKeys.map((key) => (
          <div
            key={key}
            className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 group-hover:text-orange-500 group-hover:border-orange-100 shadow-sm transition-all">
                {getIcon(key)}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                  {t(`labels.${key}`) !==
                  `Checkout.PaymentMethodDetails.labels.${key}`
                    ? t(`labels.${key}`)
                    : key.replace(/_/g, " ").toUpperCase()}
                </span>
                <span className="text-sm font-black text-slate-800 tabular-nums truncate tracking-tight">
                  {config[key]}
                </span>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip open={copiedField === key}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-slate-300 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    onClick={() => copyToClipboard(config[key].toString(), key)}
                  >
                    {copiedField === key ? (
                      <CheckCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="text-[10px] font-black bg-slate-900 text-white border-none px-3 py-1.5 rounded-lg"
                >
                  {t("copied")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-start p-5 rounded-3xl bg-orange-50 border border-orange-100/50">
        <div className="bg-orange-500 p-1.5 rounded-full text-white mt-0.5 shrink-0">
          <Info className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-orange-950 uppercase tracking-widest">
            {t("footerTitle")}
          </p>
          <p className="text-[11px] text-orange-800/80 leading-relaxed font-semibold">
            {t("footerDesc")}
          </p>
        </div>
      </div>
    </div>
  );
};
