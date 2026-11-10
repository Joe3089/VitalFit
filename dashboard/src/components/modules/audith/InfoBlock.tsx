"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InfoBlockProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  isMono?: boolean;
  className?: string;
}

export default function InfoBlock({
  icon,
  label,
  value,
  isMono = false,
  className,
}: InfoBlockProps) {
  const displayValue = value ?? "—";

  return (
    <div className={cn("flex flex-col gap-2 group", className)}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 transition-colors group-hover:text-primary/80">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "text-sm leading-snug break-words selection:bg-primary/10",
          isMono 
            ? "font-mono text-[11px] bg-muted/40 px-3 py-2 rounded-md border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 shadow-sm" 
            : "font-semibold text-zinc-900 dark:text-zinc-100 pl-1"
        )}
      >
        {displayValue}
      </div>
    </div>
  );
}