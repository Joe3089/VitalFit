import {
  ClockIcon,
  HeartIcon as HeartIconOutline,
  StarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Button } from "../ui/button";

interface CardContentProps {
  title: string;
  rating: number;
  category: string;
  desc: string;
  duration: number;
  priceMember: string;
  priceNonMember: string;
  refPriceMember?: string | number;
  refPriceNonMember?: string | number;
  refCurrency?: string;
  showReferencePrice?: boolean;
  t: any;
  isFavorite: boolean;
  onLearnMore?: () => void;
  onWishList: (e: React.MouseEvent) => void;
}

export const ServiceCardContent = ({
  title,
  rating,
  category,
  desc,
  duration,
  priceMember,
  priceNonMember,
  refPriceMember,
  refPriceNonMember,
  refCurrency,
  showReferencePrice,
  t,
  isFavorite,
  onLearnMore,
  onWishList,
}: CardContentProps) => (
  <div className="p-5 flex flex-col flex-1 justify-between bg-white">
    <div>
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="text-gray-900 font-bold text-lg leading-normal line-clamp-3 uppercase py-0.5 flex-1 pr-4 tracking-normal">
          {title}
        </h3>

        <button
          onClick={onWishList}
          className="p-2 rounded-full hover:bg-red-50 transition-all active:scale-90 shrink-0 border border-transparent hover:border-red-100"
          title={isFavorite ? t("wishlistRemove") : t("wishListSuccess")}
        >
          {isFavorite ? (
            <HeartIconSolid className="text-red-500 w-6 h-6" />
          ) : (
            <HeartIconOutline className="text-gray-300 w-6 h-6" />
          )}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#F27F2A] text-[10px] font-extrabold uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
          {category}
        </span>
        <div className="flex items-center gap-1 text-gray-400 font-bold text-xs">
          <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span>{rating}</span>
        </div>
      </div>

      <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
        {desc}
      </p>
    </div>

    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
        <ClockIcon className="w-4 h-4 text-[#F27F2A]" />
        {duration} {t("minutes")}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            {t("member")}
          </span>
          <span className="text-xl font-black text-black leading-none">
            {priceMember}
          </span>
          {showReferencePrice && refPriceMember && (
            <span className="text-[9px] text-gray-400 mt-1 font-medium italic">
              {t("refPrice")}: {refCurrency} {refPriceMember}
            </span>
          )}
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            {t("nonMember")}
          </span>
          <span className="text-sm font-bold text-gray-400 line-through leading-none">
            {priceNonMember}
          </span>
          {showReferencePrice && refPriceNonMember && (
            <span className="text-[9px] text-gray-300 mt-1">
              {t("refPrice")}: {refCurrency} {refPriceNonMember}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={onLearnMore}
        className="w-full rounded-xl font-bold py-6 bg-gray-900 hover:bg-[#F27F2A] transition-colors"
      >
        {t("learnMore")}
      </Button>
    </div>
  </div>
);
