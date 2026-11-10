"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const capitalize = (s: string) => {
  if (!s) {
    return "";
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const DynamicBreadcrumb: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const getSegmentLabel = (segment: string) => {
    const isId = /^[0-9a-fA-F-]{24,36}$/.test(segment) || !isNaN(Number(segment));

    if (isId) {
      return `Detalle #${segment.slice(0, 4)}`;
    }

    return capitalize(segment);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const label = getSegmentLabel(segment);

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};