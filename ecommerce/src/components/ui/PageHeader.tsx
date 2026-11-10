"use client";

import { cn } from "@/lib/utils";
import { typography } from "@/styles/styles";
import React from "react";

type PageHeaderProps = {
  title: string;
  children?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionButton?: React.ReactNode;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  children,
  subtitle,
  actionButton,
}) => {
  return (
    <div className="flex items-start justify-between pb-4 border-b">
      <div>
        <h2 className={cn(typography.heading, "text-4xl")}>{title}</h2>
        {subtitle && <p className="mt-1 text-base text-gray-600">{subtitle}</p>}
      </div>
      <div className="flex items-center space-x-2">
        {children}
        {actionButton}
      </div>
    </div>
  );
};
