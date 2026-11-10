"use client";

import { MapPin, Lock } from "lucide-react";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Branch {
  branch_id: string;
  name: string;
}

interface BranchSelectorProps {
  branches: Branch[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export const BranchSelector = ({
  branches,
  selectedId,
  onSelect,
  disabled,
}: BranchSelectorProps) => {
  const t = useTranslations("Checkout.BranchSelector");

  return (
    <div
      className={cn(
        "bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4 transition-all duration-500",
        disabled && "opacity-70 bg-slate-50/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-xl transition-colors",
              selectedId
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-400",
            )}
          >
            <MapPin size={18} />
          </div>
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {t("label")}
          </Label>
        </div>

        {disabled && selectedId && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full animate-in fade-in zoom-in">
            <Lock size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">
              {t("confirmed")}
            </span>
          </div>
        )}
      </div>

      <Select value={selectedId} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "h-16 rounded-2xl border-none font-black text-slate-700 text-base transition-all shadow-sm",
            selectedId
              ? "bg-slate-50"
              : "bg-orange-50/50 ring-2 ring-orange-500/10",
            "focus:ring-4 focus:ring-orange-500/10",
          )}
        >
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
          {branches.map((b) => (
            <SelectItem
              key={b.branch_id}
              value={b.branch_id}
              className="py-4 px-4 font-bold text-slate-600 rounded-xl focus:bg-orange-500 focus:text-white transition-colors cursor-pointer mb-1 last:mb-0"
            >
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedId && !disabled && (
        <div className="flex items-center gap-2 ml-1 animate-in slide-in-from-left-2">
          <div className="h-1 w-1 rounded-full bg-orange-500 animate-ping" />
          <p className="text-[10px] text-orange-600 font-black uppercase tracking-tight">
            {t("requiredNote")}
          </p>
        </div>
      )}
    </div>
  );
};
