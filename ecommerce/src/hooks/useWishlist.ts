import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { WishlistItemResponse, ServicePublicItem } from "@vitalfit/sdk";

export interface EnrichedWishlistItem extends WishlistItemResponse {
  serviceDetail?: ServicePublicItem;
}

export const useWishlist = () => {
  const { token } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<EnrichedWishlistItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const wishlistResponse = await api.wishList.getWishList(token, {
        page: 1,
        limit: 100,
        sort: "desc",
      });

      const itemsRaw = wishlistResponse?.data as any;
      const items = Array.isArray(itemsRaw)
        ? itemsRaw
        : itemsRaw
          ? [itemsRaw]
          : [];

      const servicesResponse = await api.public.getServices({
        limit: 100,
        currency: "USD",
        category: "",
        price: 0,
        sortby: "name",
      });
      const allServices = servicesResponse.data || [];

      const enriched = items.map((item: WishlistItemResponse) => ({
        ...item,
        serviceDetail: allServices.find(
          (s) => s.service_id === item.service_id,
        ),
      }));

      setWishlistItems(enriched);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Error al cargar la lista de deseos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const removeService = async (wishlistId: string) => {
    if (!token) {
      return;
    }
    try {
      await api.wishList.removeFromWishList(wishlistId, token);
      setWishlistItems((prev) =>
        prev.filter((item) => item.wishlist_id !== wishlistId),
      );
      toast.success("Eliminado de favoritos");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Error al eliminar de favoritos");
    }
  };

  const toggleFavorite = async (
    serviceId: string,
    isFavorite: boolean,
    wishlistId?: string,
  ) => {
    if (!token) {
      toast.error("Debes iniciar sesión para gestionar favoritos");
      return;
    }

    try {
      if (isFavorite && wishlistId) {
        await api.wishList.removeFromWishList(wishlistId, token);
        setWishlistItems((prev) =>
          prev.filter((item) => item.wishlist_id !== wishlistId),
        );
        toast.success("Eliminado de favoritos");
      } else {
        console.log("Adding to wishlist, serviceId:", serviceId);
        await api.wishList.addToWishList({ service_id: serviceId }, token);
        console.log("Add successful, refetching...");
        await fetchWishlist();
        console.log("Refetch done");
        toast.success("¡Agregado a favoritos!");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Error al procesar favoritos");
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return {
    wishlistItems,
    loading,
    error,
    removeService,
    toggleFavorite,
    refetch: fetchWishlist,
  };
};
