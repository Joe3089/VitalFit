
import { cn } from "@/lib/utils";
import React from "react";


type PageHeaderProps = {
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  actionButton?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  subtitle,
  children,
  actionButton,
  className,
}: PageHeaderProps) => {
  return (
    <header 
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-100",
        className
      )}
    >
      <div className="space-y-1">

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {actionButton && (
          <div className="flex-none">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
};