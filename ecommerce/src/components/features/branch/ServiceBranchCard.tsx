"use client";

import * as React from "react";
import { ServicePublicItem } from "@vitalfit/sdk";
import { Button } from "@/components/ui/button";
import {
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  TicketIcon,
} from "@heroicons/react/24/solid";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Dumbbell } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface ServiceBranchCardProps {
  service: ServicePublicItem;
}

export function ServiceBranchCard({ service }: ServiceBranchCardProps) {
  const t = useTranslations("ServiceBranchCard");
  const [imgError, setImgError] = React.useState(false);

  const displayImage =
    service.images?.find((img) => img.is_primary)?.image_url ||
    service.banners?.[0]?.image_url;

  return (
    <Card className="group overflow-hidden border-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full rounded-[2.5rem] bg-white border border-slate-50">
      <div className="relative h-64 w-full overflow-hidden bg-slate-100">
        {!displayImage || imgError ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-slate-50 to-slate-200">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
              <Dumbbell className="w-16 h-16 text-slate-300 relative z-10" />
            </div>
            <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              {t("brandPlaceholder")}
            </span>
          </div>
        ) : (
          <Image
            src={displayImage}
            alt={service.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={() => setImgError(true)}
            priority={service.is_featured}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        <div className="absolute top-6 left-6 flex gap-2">
          <span className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-xl">
            {service.service_category.name}
          </span>
          {service.is_featured && (
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl">
              <StarIcon className="w-4 h-4 text-yellow-400" />
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/20 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
          <ClockIcon className="w-4 h-4 text-primary" />
          <span className="text-[11px] font-black text-white uppercase tracking-tighter">
            {t("duration", { minutes: service.duration_minutes })}
          </span>
        </div>
      </div>

      <CardHeader className="p-8 pb-4">
        <CardTitle className="font-heading text-3xl uppercase italic tracking-tighter text-slate-900 group-hover:text-primary transition-colors leading-[0.9]">
          {service.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-8 pt-0 flex-grow">
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium italic opacity-70">
          {service.description}
        </p>
      </CardContent>

      <CardFooter className="p-8 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <TicketIcon className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {t("membershipLabel")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              ${service.lowest_price_member}
            </span>
            <span className="text-sm font-bold text-slate-300 line-through decoration-primary/30">
              ${service.lowest_price_no_member}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
