"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useWishlist, EnrichedWishlistItem } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export default function WishlistPage() {
  const t = useTranslations("Wishlist");
  const { token } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const { wishlistItems, loading, removeService } = useWishlist();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  const handleRemoveService = async (wishlistId: string) => {
    await removeService(wishlistId);
  };

  const filteredServices = wishlistItems.filter((item: EnrichedWishlistItem) =>
    item.service_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-gray-500 mt-2">{t("description")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("filterPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setSearchQuery("")}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm"
          >
            {t("clearFilters")}
          </button>
        </div>

        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2 text-center">
              {searchQuery ? t("noResults") : t("empty")}
            </p>
            <p className="text-gray-500 mb-8 max-w-sm text-center">
              {searchQuery ? t("searchSuggestion") : t("emptySuggestion")}
            </p>
            <button
              onClick={() => router.push("/services")}
              className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 active:scale-95"
            >
              {t("viewServices")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((item) => {
              const detail = item.serviceDetail;
              const hasDetail = !!detail;

              const isAvailable = hasDetail;

              return (
                <Card
                  key={item.wishlist_id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border-gray-100"
                >
                  <div className="relative h-52 bg-gray-100 overflow-hidden">
                    <img
                      src={
                        detail?.images?.[0]?.image_url ||
                        "/images/gym-training-chile.png"
                      }
                      alt={item.service_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {detail?.is_featured && (
                      <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        {t("featured")}
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                        {item.service_name}
                      </CardTitle>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {isAvailable ? t("available") : t("notAvailable")}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 flex flex-col flex-grow">
                    <CardDescription className="text-sm text-gray-500 leading-relaxed mb-6">
                      {item.description || detail?.description}
                    </CardDescription>

                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-2xl font-black text-gray-900">
                          ${detail?.lowest_price_no_member || "0"}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">
                          {detail?.base_currency || "USD"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <Button
                          onClick={() => handleRemoveService(item.wishlist_id)}
                          variant="outline"
                          className="rounded-xl font-bold h-11 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          {t("remove")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
