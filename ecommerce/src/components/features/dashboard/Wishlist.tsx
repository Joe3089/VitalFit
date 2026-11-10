"use client";

import { useTranslations } from "next-intl";
import { ShoppingCartIcon, HeartIcon, Loader2 } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter } from "@/i18n/routing";

export default function Wishlist() {
  const t = useTranslations("ServiceCard");
  const sidebarT = useTranslations("sidebar");
  const { wishlistItems, loading } = useWishlist();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="mt-8 border-t pt-6 text-center">
        <p className="text-xs text-gray-500">
          {sidebarT("wishlistSection.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h4 className="font-bold text-sm mb-3">
        {sidebarT("wishlistSection.title")}
      </h4>

      {wishlistItems.slice(0, 3).map((item) => {
        const detail = item.serviceDetail;
        return (
          <div
            key={item.wishlist_id}
            className="group bg-white border border-gray-100 rounded-xl p-3 mb-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => router.push("/wishlist")}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-xs text-gray-900 line-clamp-1">
                {item.service_name}
              </span>
              <HeartIcon className="h-4 w-4 text-red-500 fill-red-500" />
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium">
                {detail?.service_category?.name || "Fitness"}
              </span>
              <span className="font-bold text-gray-900">
                ${detail?.lowest_price_no_member || "0"}{" "}
                {detail?.base_currency || "USD"}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-400">
              <ShoppingCartIcon className="h-3 w-3" />
              <span>Ver en mi lista</span>
            </div>
          </div>
        );
      })}

      {wishlistItems.length > 3 && (
        <button
          onClick={() => router.push("/wishlist")}
          className="w-full text-center text-[10px] text-orange-500 font-bold hover:underline py-1"
        >
          Ver todos (+{wishlistItems.length - 3})
        </button>
      )}
    </div>
  );
}
