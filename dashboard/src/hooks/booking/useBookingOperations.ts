"use client";

import { useState } from "react";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function useBookingOperations(token: string | null) {
  const [isProcessing, setIsProcessing] = useState(false);
  const t = useTranslations("booking");

  const getFriendlyMessage = (error: any) => {
  const status = error?.status || error?.response?.status;

  if (status === 402) {
    return t("errors.payment_required");
  }
  if (status === 403) {
    return t("errors.forbidden");
  }
  if (status === 401){
     return t("errors.unauthorized");
  }

  const serverMessage = 
    error?.response?.data?.message || 
    error?.response?.data?.error || 
    error?.error || 
    error?.message || 
    "";

  const msg = serverMessage.toLowerCase();

  if (msg.includes("restricted time window") || msg.includes("cannot cancel")) {
    return t("errors.restricted_time") !== "errors.restricted_time" 
      ? t("errors.restricted_time") 
      : serverMessage;
  }

  if (msg.includes("past class")) {
    return t("errors.past_class");
  }
  if (msg.includes("full")){
     return t("errors.full");
  }

  return serverMessage || t("errors.unexpected");
};

  const executeBooking = async (classId: string, userId: string) => {
    if (!token || !classId || !userId){
       return false;
    }
    setIsProcessing(true);
    
    try {
      await api.booking.bookClass({ user_id: userId }, classId, token);
      toast.success(t("success.booked"));
      return true;
    } catch (error: any) {
      toast.error(getFriendlyMessage(error));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCancellation = async (bookingId: string) => {
    if (!token || !bookingId){
       return false;
    }
    setIsProcessing(true);
    try {
      await api.booking.cancelBooking(bookingId, token);
      toast.success(t("success.cancelled"));
      return true;
    } catch (error: any) {

      toast.error(getFriendlyMessage(error));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    book: executeBooking, 
    cancel: executeCancellation, 
    isProcessing 
  };
}