import Wishlist from "@/components/features/dashboard/Wishlist";
import { HeartIcon } from "@heroicons/react/24/outline";

export default function WishlistCard() {
  return (
    <div className="mb-6 px-4">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-900 mb-2">
          <HeartIcon className="h-4 w-4 text-indigo-500" /> Wishlist
        </h4>

        <div className="text-xs text-indigo-700/80">
          <Wishlist />
        </div>
      </div>
    </div>
  );
}
