"use client";

import { Info, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MembershipType } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface Props {
  plan: MembershipType;
  onRemove: () => void;
  isLocked?: boolean;
}

export const MembershipSummary = ({ plan, onRemove, isLocked }: Props) => {
  const t = useTranslations("Checkout.MembershipSummary");

  return (
    <div
      className={cn(
        "bg-white shadow-sm border border-slate-100 overflow-hidden transition-all duration-300",
        isLocked && "opacity-80",
      )}
    >
      <div className="p-8 border-b border-slate-50 flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            {plan.name}
            <span className="bg-orange-100 text-orange-600 p-1.5 rounded-full shrink-0">
              <Info size={14} />
            </span>
          </h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
            {plan.description || t("defaultDescription")}
          </p>
        </div>

        {!isLocked && (
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0 rounded-xl transition-colors"
            onClick={onRemove}
          >
            <Trash2 size={20} />
          </Button>
        )}
      </div>

      <div className="bg-slate-50/50 p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            {t("totalPrice")}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-slate-400">$</span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {Number(plan.price).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {plan.duration_days && (
          <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="bg-emerald-100 p-1 rounded-full">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                {t("duration")}
              </span>
              <span className="text-sm font-bold text-slate-700 leading-none">
                {plan.duration_days} {t("days")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
