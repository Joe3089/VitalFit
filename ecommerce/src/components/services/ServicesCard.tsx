"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ServiceCardContent } from "./ServiceCardContent";

const logoVitalFit = "/images/gym-training-chile.png";

interface ServiceCardProps {
  service: any;
  view?: "grid" | "list";
  isFavorite?: boolean;
  wishlistId?: string;
  onToggleFavorite?: (
    serviceId: string,
    isFavorite: boolean,
    wishlistId?: string,
  ) => Promise<void>;
  onLearnMore?: () => void;
  className?: string;
  showReferencePrice?: boolean;
}

export default function ServiceCard({
  service,
  view = "grid",
  isFavorite = false,
  wishlistId,
  onToggleFavorite,
  onLearnMore,
  className,
  showReferencePrice,
}: ServiceCardProps) {
  const t = useTranslations("ServiceCard");
  const { token } = useAuth();

  const initialRating =
    service.rating ?? Math.round(service.priority_score / 20);

  const finalRating = Math.min(Math.max(initialRating, 1), 5);

  const [localRating, setLocalRating] = useState<number>(finalRating);
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(isFavorite);

  useEffect(() => {
    setOptimisticFavorite(isFavorite);
    setLocalRating(finalRating);
  }, [isFavorite, finalRating]);

  const formatPrice = (price: number, currency?: string) => {
    const curr = currency ?? service.base_currency ?? "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr === "VES" ? "USD" : curr,
    })
      .format(price)
      .replace("USD", curr === "VES" ? "Bs." : curr);
  };

  const handleWishList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      return toast.error(t("loginRequired"));
    }
    if (isProcessing || !onToggleFavorite) {
      return;
    }

    setIsProcessing(true);
    const wasFavorite = optimisticFavorite;
    setOptimisticFavorite(!wasFavorite);

    try {
      await onToggleFavorite(service.service_id, wasFavorite, wishlistId);
    } catch (error) {
      setOptimisticFavorite(wasFavorite);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeBanner = service.banners?.find((b: any) => b.is_active);
  const imgSrc =
    activeBanner?.image_url || service.images?.[0]?.image_url || logoVitalFit;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex transition-all hover:shadow-md",
        view === "grid" ? "flex-col" : "flex-row w-full min-h-[250px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          view === "grid" ? "h-52 w-full" : "w-1/3 min-w-[200px]",
        )}
      >
        <Image src={imgSrc} alt={service.name} fill className="object-cover" />
        {activeBanner && (
          <div className="absolute top-3 left-3 bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded">
            {t("promoBadge")}
          </div>
        )}
      </div>

      <ServiceCardContent
        title={service.name}
        rating={localRating}
        category={service.service_category?.name || t("categoryDefault")}
        desc={service.description}
        duration={service.duration_minutes}
        priceMember={formatPrice(service.lowest_price_member)}
        priceNonMember={formatPrice(service.lowest_price_no_member)}
        refPriceMember={service.ref_lowest_price_member}
        refPriceNonMember={service.ref_lowest_price_no_member}
        refCurrency={service.ref_base_currency}
        showReferencePrice={showReferencePrice}
        t={t}
        isFavorite={optimisticFavorite}
        onLearnMore={onLearnMore || (() => {})}
        onWishList={handleWishList}
      />
    </div>
  );
}
