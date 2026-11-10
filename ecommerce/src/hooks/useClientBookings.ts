import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { ClientBookingResponse } from "@vitalfit/sdk";

export interface BookingWithImage extends ClientBookingResponse {
  imageUrl?: string;
}

export const useClientBookings = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token || !user?.user_id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingsResponse = await api.booking.getClientBooking(
        user.user_id,
        token,
      );
      const bookingsData = bookingsResponse.data || [];

      if (bookingsData.length > 0) {
        const servicesResponse = await api.public.getServices({
          limit: 100,
          currency: "USD",
          category: "",
          price: 0,
          sortby: "name",
        });
        const services = servicesResponse.data || [];

        const enrichedBookings = bookingsData.map((booking) => {
          const service = services.find((s) => s.name === booking.service_name);
          const primaryImage =
            service?.images.find((img) => img.is_primary) || service?.images[0];

          return {
            ...booking,
            imageUrl: primaryImage?.image_url,
          };
        });

        setBookings(enrichedBookings);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Error fetching client bookings:", err);
      setError("Error al cargar las clases reservadas");
    } finally {
      setLoading(false);
    }
  }, [token, user?.user_id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  };
};
