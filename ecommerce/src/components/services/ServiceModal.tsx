"use client";

import Image from "next/image";
import {
  XMarkIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/features/Logo";
import { useRouter } from "next/navigation";

const ServiceImage = ({ url, alt }: { url: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Logo slogan={true} theme="dark" width={150} />
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      fill
      className="object-cover"
      priority
      sizes="(max-width: 768px) 100vw, 800px"
      onError={() => setHasError(true)}
    />
  );
};

export default function ServiceModal({
  service,
  isOpen,
  onClose,
  showReferencePrice,
  isFavorite = false,
  wishlistId,
  onToggleFavorite,
}: any) {
  const t = useTranslations("ServiceModal");
  const { token } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(isFavorite);
  const [localRating, setLocalRating] = useState(0);

  useEffect(() => {
    setOptimisticFavorite(isFavorite);
    if (service) {
      setLocalRating(service.priority_score);
    }
  }, [isFavorite, service]);

  if (!isOpen || !service) {
    return null;
  }

  const handleWishList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      toast.error(t("loginRequired"));
      return;
    }
    if (isProcessing || !onToggleFavorite) {
      return;
    }
    setIsProcessing(true);
    const wasFavorite = optimisticFavorite;
    setOptimisticFavorite(!wasFavorite);
    setLocalRating((prev: number) => (wasFavorite ? prev - 1 : prev + 1));
    try {
      await onToggleFavorite(service.service_id, wasFavorite, wishlistId);
    } catch (error) {
      setOptimisticFavorite(wasFavorite);
      setLocalRating((prev: number) => (wasFavorite ? prev + 1 : prev - 1));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBooking = () => {
    if (!token) {
      toast.error(t("loginRequired"));
      return;
    }
    router.push(`/checkout?serviceId=${service.service_id}`);
  };

  const activeBanner = service.banners?.find((b: any) => b.is_active);
  const displayImages = [];
  if (activeBanner) {
    displayImages.push({
      id: activeBanner.banner_id,
      url: activeBanner.image_url,
      alt: activeBanner.name,
    });
  }
  if (service.images && service.images.length > 0) {
    const sortedImages = [...service.images].sort(
      (a: any, b: any) => a.display_order - b.display_order,
    );
    sortedImages.forEach((img: any) => {
      displayImages.push({
        id: img.image_id,
        url: img.image_url,
        alt: img.alt_text,
      });
    });
  }
  if (displayImages.length === 0) {
    displayImages.push({
      id: "default",
      url: "/images/gym-training-chile.png",
      alt: service.name,
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-y-auto relative custom-scrollbar"
        >
          <div className="relative w-full shrink-0">
            {displayImages.length > 1 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {displayImages.map((img) => (
                    <CarouselItem key={img.id}>
                      <div className="relative w-full h-64 sm:h-80">
                        <ServiceImage url={img.url} alt={img.alt} />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 border-none text-white z-30" />
                <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 border-none text-white z-30" />
              </Carousel>
            ) : (
              <div className="relative w-full h-64 sm:h-80">
                <ServiceImage
                  url={displayImages[0].url}
                  alt={displayImages[0].alt}
                />
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-xl z-40 transition-transform active:scale-90"
            >
              <XMarkIcon className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[#F27F2A] font-black italic tracking-widest text-[10px] uppercase">
                {service.service_category?.name}
              </span>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-100">
                  <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{localRating}</span>
                </div>
                <button
                  onClick={handleWishList}
                  className="bg-red-50 p-1.5 rounded-full transition-transform active:scale-90"
                >
                  {optimisticFavorite ? (
                    <HeartIconSolid className="text-red-500 w-5 h-5" />
                  ) : (
                    <HeartIconOutline className="text-gray-300 w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <h2 className="text-3xl font-black italic text-[#1A1A1A] uppercase leading-none mb-6 tracking-tighter">
              {service.name}
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 bg-white border-2 border-[#F27F2A] rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#F27F2A] text-white text-[8px] font-black px-2 py-0.5 rounded-bl-md uppercase">
                  {t("memberBadge") || "MIEMBRO"}
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black">
                    ${service.lowest_price_member}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {service.base_currency}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <span className="text-[9px] font-black text-gray-400 uppercase mb-1 block">
                  {t("nonMember") || "No Miembro"}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-300 italic line-through">
                    ${service.lowest_price_no_member}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mb-6 text-xs font-bold text-gray-600 border-y border-gray-50 py-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-[#F27F2A]" />
                <span>{service.duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-[#F27F2A]" />
                <span>{t("inStudio") || "En Estudio"}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-black italic uppercase text-sm mb-2 tracking-tight">
                {t("description") || "Descripción"}
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                {service.description}
              </p>
            </div>

            <Button
              onClick={handleBooking}
              className="w-full h-14 bg-orange-400 hover:bg-black text-white rounded-2xl font-black italic text-xl uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]"
            >
              {t("bookNow") || "Reservar Ahora"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
