"use client";

import { cn } from "@/lib/utils";
import React from "react";

export type EntityItemProps = {
  initials: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export default function EntityItem({
  initials,
  title,
  description,
  action,
  className,
  onClick,
}: EntityItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-lg border bg-card p-4 shadow-sm",
        onClick && "cursor-pointer transition-colors hover:bg-muted/50",
        className,
      )}
    >
      <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
        <span className="text-sm font-medium uppercase text-muted-foreground">
          {initials}
        </span>
      </div>

      <div className="flex-grow min-w-0">
        <p className="truncate font-medium text-card-foreground">{title}</p>

        {description && (
          <p className="truncate text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}
