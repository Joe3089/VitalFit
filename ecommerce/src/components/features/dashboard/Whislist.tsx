"use client";

import { useTranslations } from "next-intl";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function Wishlist() {
  const t = useTranslations("sidebar");

  const wishlistItems = [
    {
      title: t("wishlistSection.pilatesClass"),
      typeFit: "Yoga",
      price: 12,
    },
    {
      title: t("wishlistSection.pilatesClass"),
      typeFit: "Yoga",
      price: 12,
    },
    {
      title: t("wishlistSection.pilatesClass"),
      typeFit: "Yoga",
      price: 12,
    },
  ];

  return (
    <div className="mt-8 border-t pt-6">
      <h4 className="font-bold text-sm mb-3">{t("wishlistSection.title")}</h4>
      <p className="text-xs text-gray-500 mb-4">
        {t("wishlistSection.description")}
      </p>

      {wishlistItems.map((item, index) => (
        <div key={index} className="bg-gray-50 rounded p-3 mb-2 shadow">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold">{item.title}</span>
            <ShoppingCartIcon className="h-4 w-4" />
            <HeartIcon className="h-4 w-4 text-red-500" />
          </div>
          <span className="text-sm text-gray-400">
            {t("wishlistSection.price")}: ${item.price}
          </span>
          <p className="text-xs text-gray-500 mt-1 font-semibold">
            {item.typeFit}
          </p>
        </div>
      ))}
    </div>
  );
}
