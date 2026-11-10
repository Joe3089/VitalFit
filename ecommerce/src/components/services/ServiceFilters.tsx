"use client";

import {
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  XMarkIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import SearchInput from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils";
import { mainCurrencies } from "@vitalfit/sdk";

interface ServiceFiltersProps {
  t: any;
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  filters: { search: string; category: string; rating: number };
  setFilters: React.Dispatch<
    React.SetStateAction<{ search: string; category: string; rating: number }>
  >;
  maxPrice: number | "";
  setMaxPrice: (value: number | "") => void;
  sort: "asc" | "desc";
  setSort: (sort: "asc" | "desc") => void;
  currency: string;
  setCurrency: (currency: string) => void;
  categories: any[];
  onClear: () => void;
  showFiltersMobile: boolean;
  setShowFiltersMobile: (show: boolean) => void;
}

export function ServiceFilters({
  t,
  view,
  setView,
  filters,
  setFilters,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
  currency,
  setCurrency,
  categories,
  onClear,
  showFiltersMobile,
  setShowFiltersMobile,
}: ServiceFiltersProps) {
  const handleRatingClick = (rating: number) => {
    setFilters((prev) => ({
      ...prev,
      rating: prev.rating === rating ? 0 : rating,
    }));
  };

  return (
    <div className="sticky top-24 z-30 max-w-7xl mx-auto px-1">
      <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-[1.5rem] shadow-md p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-grow max-w-md">
            <SearchInput
              placeholder={t("filters.searchPlaceholder")}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  view === "grid"
                    ? "bg-white shadow-sm text-[#F27F2A]"
                    : "text-gray-400",
                )}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  view === "list"
                    ? "bg-white shadow-sm text-[#F27F2A]"
                    : "text-gray-400",
                )}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>

            <Button
              variant="outline"
              className="md:hidden rounded-xl border-gray-200"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            >
              <FunnelIcon className="w-4 h-4 mr-2 text-[#F27F2A]" />
              {t("filters.label")}
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "mt-5 grid grid-cols-1 md:flex md:flex-wrap items-end gap-4 animate-in fade-in slide-in-from-top-2 duration-300",
            showFiltersMobile ? "block" : "hidden md:flex",
          )}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
              {t("filters.categoryLabel") || "Categoría"}
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full md:w-48 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#F27F2A]/20 transition-all outline-none"
            >
              <option value="">{t("filters.categoryDefault")}</option>
              {categories.map(
                (cat) =>
                  cat && (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </option>
                  ),
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
              {t("filters.maxPriceLabel") || "Precio Máximo"}
            </label>
            <Input
              type="number"
              placeholder={t("filters.maxPrice")}
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full md:w-36 bg-gray-50 border-gray-100 rounded-xl h-[38px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
              {t("filters.ratingLabel") || "Rating Mínimo"}
            </label>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl h-[38px]">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="transition-transform active:scale-125 focus:outline-none"
                >
                  {star <= filters.rating ? (
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <StarOutline className="w-5 h-5 text-gray-300 hover:text-yellow-200" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
              {t("filters.sortLabel") || "Orden"}
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "asc" | "desc")}
              className="w-full md:w-40 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
            >
              <option value="desc">{t("filters.sortDesc")}</option>
              <option value="asc">{t("filters.sortAsc")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-wider">
              {t("filters.currencyLabel") || "Moneda"}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full md:w-28 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-[#F27F2A] outline-none"
            >
              {mainCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={onClear}
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-[38px] px-4 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            {t("filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
