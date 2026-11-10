"use client";

import useSWR from "swr";
import { api } from "@/lib/sdk-config";
import { ClientBookingResponse, BranchScheduleResponse } from "@vitalfit/sdk";

export function useClientBookings(
  token: string | null,
  userId: string | null,
  branchId?: string | null
) {
  const historyKey = token && userId ? ["bookings/client", userId] : null;

  const availabilityKey = token && userId && branchId 
    ? ["schedule/branch", branchId, "client", userId] 
    : null;
  const history = useSWR(historyKey, async () => {
    const res = await api.booking.getClientBooking(userId!, token!);
    return res.data as ClientBookingResponse[];
  });

  const availability = useSWR(availabilityKey, async () => {
    const res = await api.booking.getClientBranchBooking(branchId!, userId!, token!);
    return res.data as BranchScheduleResponse[];
  });

  return {
    clientHistory: history.data || [],
    isHistoryLoading: history.isLoading,
    availableClasses: availability.data || [],
    isAvailabilityLoading: availability.isLoading,
    refreshHistory: history.mutate,
    refreshAvailability: availability.mutate,
    error: history.error || availability.error
  };
}