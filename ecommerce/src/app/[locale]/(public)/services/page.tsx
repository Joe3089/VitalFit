"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ServiceCard from "@/components/services/ServicesCard";
import ServiceModal from "@/components/services/ServiceModal";
import { FunnelIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RecentServicesCarousel } from "@/components/services/RecentServicesCarousel";
import { useWishlist } from "@/hooks/useWishlist";
import { ServiceFilters } from "@/components/services/ServiceFilters";

const ServiceSkeleton = ({ view }: { view: "grid" | "list" }) => (
  <div
    className={cn(
      "animate-pulse bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm",
      view === "list" ? "flex h-40" : "h-[330px]",
    )}
  >
    <div
      className={cn(
        "bg-gray-200",
        view === "list" ? "w-48 h-full" : "w-full h-40",
      )}
    />
    <div className="p-4 flex-1 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-10 bg-gray-200 rounded mt-4" />
    </div>
  </div>
);

export default function ServicesPage() {
  const t = useTranslations("ServicesPage");

  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    rating: 0,
  });
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [currency, setCurrency] = useState("USD");

  const { wishlistItems, toggleFavorite } = useWishlist();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const limit = 100;
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedView = localStorage.getItem("services_view_mode");
    if (storedView === "grid" || storedView === "list") {
      setView(storedView);
    }
  }, []);

  const changeView = (newView: "grid" | "list") => {
    setView(newView);
    localStorage.setItem("services_view_mode", newView);
  };

  const fetchServices = useCallback(async () => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: any = {
        page,
        limit,
        search: filters.search,
        category: filters.category,
        currency,
        sortby: "price",
        sort,
      };

      if (filters.rating > 0) {
        params.min_priority_score = (filters.rating - 1) * 20;
        params.max_priority_score = filters.rating * 20;
      }

      if (maxPrice !== "") {
        params.price = Number(maxPrice);
      }

      const response = await api.public.getServices(params);

      const rawData = response.data || [];

      const transformedData = rawData
        .map((service: any) => ({
          ...service,
          calculatedRating: Math.max(1, Math.ceil(service.priority_score / 20)),
        }))
        .filter((service: any) => {
          if (filters.rating > 0) {
            return service.calculatedRating === filters.rating;
          }
          return true;
        })
        .map((service) => ({
          ...service,
          rating: service.calculatedRating,
        }));

      setServices((prev) => {
        if (page === 1) {
          return transformedData;
        }

        const combined = [...prev, ...transformedData];
        return combined.filter(
          (service, index, self) =>
            index ===
            self.findIndex((s) => s.service_id === service.service_id),
        );
      });

      setTotalPages(
        Math.ceil((response.total || response.data?.length || 0) / limit),
      );
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingMore(false);
      }, 300);
    }
  }, [page, filters, sort, maxPrice, currency, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          page < totalPages
        ) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.5 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [filters, sort, maxPrice, currency]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("recent_services") || "[]",
      );
      setRecentServices(stored);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentService = (service: any) => {
    const filtered = recentServices.filter(
      (s: any) => s.service_id !== service.service_id,
    );
    const updated = [service, ...filtered].slice(0, 10);
    localStorage.setItem("recent_services", JSON.stringify(updated));
    setRecentServices(updated);
  };

  const handleOpenModal = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
    saveRecentService(service);
  };

  const handleClearFilters = () => {
    setFilters({ search: "", category: "", rating: 0 });
    setMaxPrice("");
    setSort("desc");
    setCurrency("USD");
    setPage(1);
  };

  const uniqueCategories = [
    ...new Map(
      services.map((s) => [
        s.service_category?.category_id,
        s.service_category,
      ]),
    ).values(),
  ];

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-4 md:px-8 bg-gray-50 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto mb-12 text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            {t.rich("title", {
              highlight: (chunk) => (
                <span className="text-[#F27F2A] prevent-clip">{chunk}</span>
              ),
            })}
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <ServiceFilters
          t={t}
          view={view}
          setView={changeView}
          filters={filters}
          setFilters={setFilters}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sort={sort}
          setSort={setSort}
          currency={currency}
          setCurrency={setCurrency}
          categories={uniqueCategories}
          onClear={handleClearFilters}
          showFiltersMobile={showFiltersMobile}
          setShowFiltersMobile={setShowFiltersMobile}
        />

        <div className="max-w-7xl mx-auto mt-12">
          {recentServices.length > 0 && !loading && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-[#F27F2A] rounded-full" />
                <h2 className="text-xl font-bold text-gray-800">
                  {t("recentlyViewed")}
                </h2>
              </div>
              <RecentServicesCarousel
                services={recentServices}
                wishlistItems={wishlistItems}
                onToggleFavorite={toggleFavorite}
                onOpen={handleOpenModal}
                showReferencePrice={currency !== "USD"}
              />
            </div>
          )}

          {loading ? (
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-6"
              }
            >
              {[...Array(6)].map((_, i) => (
                <ServiceSkeleton key={i} view={view} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <FunnelIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-bold text-gray-900">
                {t("empty.noResults")}
              </h3>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                {t("empty.adjustFilters")}
              </p>
              <Button className="mt-6" onClick={handleClearFilters}>
                {t("empty.showAll")}
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "animate-in fade-in duration-500",
                view === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "flex flex-col gap-6",
              )}
            >
              {services.map((service, index) => {
                const wishlistItem = wishlistItems.find(
                  (item) => item.service_id === service.service_id,
                );
                return (
                  <ServiceCard
                    key={`${service.service_id}-${index}`}
                    service={service}
                    view={view}
                    isFavorite={!!wishlistItem}
                    wishlistId={wishlistItem?.wishlist_id}
                    onToggleFavorite={toggleFavorite}
                    onLearnMore={() => handleOpenModal(service)}
                    showReferencePrice={currency !== "USD"}
                  />
                );
              })}
            </div>
          )}

          <div ref={observerTarget} className="h-20 w-full" />

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#F27F2A] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </main>

      <ServiceModal
        service={selectedService}
        isOpen={isModalOpen}
        showReferencePrice={currency !== "USD"}
        isFavorite={
          selectedService &&
          !!wishlistItems.find(
            (i) => i.service_id === selectedService.service_id,
          )
        }
        wishlistId={
          selectedService
            ? wishlistItems.find(
                (i) => i.service_id === selectedService.service_id,
              )?.wishlist_id
            : undefined
        }
        onToggleFavorite={toggleFavorite}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedService(null);
        }}
      />
      <Footer />
    </>
  );
}
