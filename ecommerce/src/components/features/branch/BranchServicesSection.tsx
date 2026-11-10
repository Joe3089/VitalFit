"use client";

import * as React from "react";
import { ServicePublicItem } from "@vitalfit/sdk";
import { ServiceBranchCard } from "./ServiceBranchCard";
import { ServiceCardSkeleton } from "./ServiceCardSkeleton";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface BranchServicesSectionProps {
  services: ServicePublicItem[];
  isLoading: boolean;
  branchName?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function BranchServicesSection({
  services,
  isLoading,
  branchName,
  hasMore,
  onLoadMore,
}: BranchServicesSectionProps) {
  const t = useTranslations("BranchServices");
  const observerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const currentObserver = observerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (!isLoading && services.length === 0) {
    return null;
  }

  return (
    <section className="py-24 scroll-mt-10">
      {/* Header de la Sección */}
      <div className="flex flex-col mb-12 relative">
        <div className="flex items-center gap-4 mb-2">
          <span className="h-[2px] w-8 bg-primary rounded-full" />
          <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            {t("exclusiveOffer", { name: branchName ?? "" })}
          </p>
        </div>

        <h2 className="text-4xl md:text-5xl font-heading italic uppercase tracking-tighter text-slate-900 leading-none">
          {t.rich("title", {
            span: (chunks) => (
              <span className="text-slate-400 font-light not-italic text-3xl md:text-4xl prevent-clip">
                {chunks}
              </span>
            ),
          })}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {services.map((service, index) => (
          <div
            key={`${service.service_id}-${index}`}
            className="animate-in fade-in slide-in-from-bottom-6 duration-700"
            style={{
              // Escalonamos la animación para los primeros elementos
              animationDelay: `${(index % 6) * 100}ms`,
            }}
          >
            <ServiceBranchCard service={service} />
          </div>
        ))}

        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <ServiceCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      <div
        ref={observerRef}
        className="w-full h-24 flex flex-col items-center justify-center mt-12"
      >
        {isLoading && services.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {t("loadingMore")}
            </p>
          </div>
        )}

        {!hasMore && services.length > 0 && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="h-[1px] w-1/4 bg-slate-100" />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">
              {t("endOfCatalog")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
