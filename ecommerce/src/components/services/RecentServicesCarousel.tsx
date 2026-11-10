"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ServiceCard from "@/components/services/ServicesCard";

export function RecentServicesCarousel({
  services,
  wishlistItems = [],
  onToggleFavorite,
  onOpen,
  showReferencePrice,
}: {
  services: any[];
  wishlistItems?: any[];
  onToggleFavorite?: (
    id: string,
    isFav: boolean,
    wishId?: string,
  ) => Promise<void>;
  onOpen: (service: any) => void;
  showReferencePrice?: boolean;
}) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="flex gap-2 -ml-2">
          {services.map((service) => {
            const wishlistItem = wishlistItems.find(
              (item) => item.service_id === service.service_id,
            );
            return (
              <CarouselItem
                key={service.service_id}
                className="flex-shrink-0 w-[80%] sm:w-[45%] md:w-[30%] lg:w-[22%]"
              >
                <ServiceCard
                  service={service}
                  view="grid"
                  isFavorite={!!wishlistItem}
                  wishlistId={wishlistItem?.wishlist_id}
                  onToggleFavorite={onToggleFavorite}
                  onLearnMore={() => onOpen(service)}
                  showReferencePrice={showReferencePrice}
                  className="w-full h-auto"
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
    </div>
  );
}
