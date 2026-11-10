"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Policy } from "@vitalfit/sdk";
import {
  Check,
  X,
  Info,
  Loader2,
  Clock,
  CalendarDays,
  BadgePercent,
  Wallet,
  Lock, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface PolicyCardProps {
  policy: Policy;
  onSave: (newValue: string) => Promise<void> | void;
  isSaving?: boolean;
  readOnly?: boolean;
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  INVOICE: <Wallet className="size-5" />,
  DISCOUNT: <BadgePercent className="size-5" />,
  CLASS: <Clock className="size-5" />,
  ACCESS: <Clock className="size-5" />,
  MEMBERSHIP: <CalendarDays className="size-5" />,
};

export default function PolicyCard({
  policy,
  onSave,
  isSaving = false,
  readOnly = false, 
}: PolicyCardProps) {
  const t = useTranslations("settings.Policies.card");

  const [value, setValue] = useState(policy.value);
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setValue(policy.value);
    setIsEditing(false);
  }, [policy.value]);

  const categoryIcon = useMemo(() => {
    const key = Object.keys(CATEGORY_ICON_MAP).find((k) =>
      policy.category.includes(k)
    );
    return key ? CATEGORY_ICON_MAP[key] : <Info className="size-5" />;
  }, [policy.category]);

  const unit = useMemo(() => {
    if (policy.data_type === "PERCENTAGE") {
      return "%";
    }
    const name = policy.name.toLowerCase();
    if (name.includes("day")) {
      return t("units.days");
    }
    if (name.includes("hour")){
       return t("units.hours");
    }
    if (name.includes("minute")){
       return t("units.minutes");
    }
    return "";
  }, [policy.data_type, policy.name, t]);

  const inputProps = useMemo(() => {
    switch (policy.data_type) {
      case "PERCENTAGE":
        return { min: 0, max: 100, step: 1 };
      case "INTEGER":
        return { min: 0, step: 1 };
      default:
        return {};
    }
  }, [policy.data_type]);

  const hasChanged = value !== policy.value;

  useEffect(() => {
    if (!isSaving && isEditing && !hasChanged) {
      setJustSaved(true);
      const timer = setTimeout(() => setJustSaved(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSaving, isEditing, hasChanged]);

  return (
    <Card
      className={cn(
        "admin-theme group transition-all duration-300 border-border shadow-sm",
        isEditing
          ? "ring-2 ring-primary/20 border-primary"
          : !readOnly && "hover:border-primary/40", 
        !policy.active && "opacity-60 grayscale pointer-events-none"
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50 transition-colors",
              isEditing
                ? "border-primary text-primary"
                : "text-muted-foreground group-hover:text-primary"
            )}
          >
            {categoryIcon}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest opacity-60">
                {policy.category.replace(/_/g, " ")}
              </span>
              {readOnly && (
                <Lock size={10} className="text-muted-foreground/50" />
              )}
            </div>
            <CardTitle className="text-sm font-black italic tracking-tight uppercase">
              {policy.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2 rounded-lg bg-muted/40 p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-primary" />
          <CardDescription className="text-[11px] font-medium leading-relaxed text-foreground/80">
            {policy.description}
          </CardDescription>
        </div>

        {!isEditing ? (
          <div
            onClick={() => !readOnly && setIsEditing(true)}
            className={cn(
              "w-full h-12 rounded-md border border-dashed border-input bg-muted/30 px-4 flex items-center justify-between",
              "text-lg font-black italic tracking-tighter transition-colors",
              readOnly 
                ? "cursor-default opacity-80" 
                : "cursor-pointer hover:border-primary/40 hover:bg-muted/50"
            )}
          >
            <span>
              {value} {unit}
            </span>
            {readOnly && <Lock size={14} className="text-muted-foreground/30" />}
          </div>
        ) : (
          <div className="relative">
            <input
              autoFocus
              type={policy.data_type === "STRING" ? "text" : "number"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              {...inputProps}
              className="flex h-12 w-full rounded-md border border-input bg-background px-4
                         text-lg font-black tracking-tighter outline-none
                         focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
            {unit && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black italic text-primary">
                {unit}
              </span>
            )}
          </div>
        )}
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden transition-all",
            isEditing ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <button
            onClick={async () => {
              await onSave(value);
              setIsEditing(false);
            }}
            disabled={isSaving || !hasChanged}
            className="flex-1 h-10 rounded-md bg-primary text-primary-foreground
                       text-xs font-black italic uppercase transition-all
                       hover:brightness-110 active:scale-95
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Check size={16} /> {t("actions.save")}
              </>
            )}
          </button>

          <button
            onClick={() => {
              setValue(policy.value);
              setIsEditing(false);
            }}
            disabled={isSaving}
            className="h-10 px-4 rounded-md border border-input transition-colors
                       hover:bg-destructive/10 hover:text-destructive"
          >
            <X size={16} />
          </button>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/20 py-2">
        <span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/50">
          {t("footer.label")}
        </span>

        {justSaved ? (
          <span className="text-[9px] font-bold uppercase text-emerald-600">
            {t("status.saved")}
          </span>
        ) : (
          <div className="flex items-center gap-2">
             {readOnly && (
               <span className="text-[8px] font-bold uppercase text-muted-foreground/40">
                 {t("status.readOnly") || "READ ONLY"}
               </span>
             )}
             <span className="text-[9px] font-black italic uppercase text-primary/60">
              {policy.data_type}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}