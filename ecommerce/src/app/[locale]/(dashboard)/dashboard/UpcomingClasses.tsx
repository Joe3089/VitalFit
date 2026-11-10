"use client";

import { useState, useMemo } from "react";
import Logo from "@/components/features/Logo";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Calendar,
  Loader2,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { useFormatter } from "next-intl";
import { useClientBookings } from "@/hooks/useClientBookings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/Card";

function ImageWithFallback({
  src,
  alt,
  className = "",
  showLoader = true,
}: {
  src?: string;
  alt: string;
  className?: string;
  showLoader?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  if (!src || src.trim() === "") {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100`}
      >
        <Logo slogan={false} width={120} theme="dark" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100`}
      >
        <Logo slogan={false} width={120} theme="dark" />
      </div>
    );
  }

  return (
    <>
      {isLoading && showLoader && !hasLoaded && (
        <div
          className={`${className} flex items-center justify-center bg-gray-100`}
        >
          <Loader2 className="animate-spin text-gray-300" size={24} />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`${className} ${!hasLoaded && showLoader ? "opacity-0 absolute" : "opacity-100"}`}
        onLoad={() => {
          setIsLoading(false);
          setHasLoaded(true);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onLoadStart={() => setIsLoading(true)}
        loading="lazy"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </>
  );
}

export default function UpcomingClasses() {
  const t = useTranslations("classes");
  const format = useFormatter();
  const { bookings, loading, error } = useClientBookings();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return bookings
      .filter((booking) => {
        const bookingDate = new Date(booking.starts_at);
        return bookingDate >= now;
      })
      .sort((a, b) => {
        return (
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        );
      });
  }, [bookings]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format.dateTime(date, {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-6">{t("title")}</h3>
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="animate-spin text-orange-600 mb-2" size={32} />
          <p className="text-gray-500 text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-6">{t("title")}</h3>
        <div className="text-center py-6">
          <p className="text-red-500 text-sm">{t("error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">{t("title")}</h3>
      </div>

      {upcomingBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">{t("noClasses")}</p>
          <p className="text-gray-400 text-xs mt-1">{t("reservePrompt")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {upcomingBookings.slice(0, 3).map((booking, index) => (
              <div
                key={booking.booking_id}
                className="relative rounded-lg overflow-hidden h-40 group"
              >
                <ImageWithFallback
                  src={booking.imageUrl}
                  alt={booking.service_name}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  showLoader={false}
                />

                <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/30 transition-all"></div>

                <div className="absolute inset-0 z-20 flex flex-col justify-end p-4">
                  <p className="text-white font-bold text-sm leading-tight mb-0.5">
                    {booking.service_name}
                  </p>
                  <p className="text-gray-100 text-[10px] font-medium opacity-90">
                    {booking.instructor}
                  </p>
                  <p className="text-gray-200 text-xs mt-1 font-medium">
                    {formatDate(booking.starts_at)}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="bg-orange-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {booking.branch_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className="hover:text-orange-600 font-semibold text-sm items-center gap-1 w-full group transition-all">
                <div className="flex justify-center items-center py-2">
                  {t("viewAll")}
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-md">
              <DialogHeader className="p-6 border-b bg-white">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="text-orange-600" />
                  {t("title")}
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  {upcomingBookings.map((booking) => (
                    <Card
                      key={booking.booking_id}
                      className="overflow-hidden border-gray-100 hover:border-orange-200 transition-colors shadow-sm"
                    >
                      <CardContent className="p-5 flex flex-col justify-center h-full">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                                {booking.service_name}
                              </h4>
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <User size={14} className="text-orange-500" />
                                <span className="font-medium">
                                  {booking.instructor}
                                </span>
                              </div>
                            </div>
                            <span className="bg-orange-50 text-orange-600 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-orange-100 flex items-center gap-1 shrink-0">
                              <MapPin size={10} />
                              {booking.branch_name}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-50 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                              <Clock size={14} className="text-orange-400" />
                              <span className="text-xs uppercase tracking-tight">
                                {formatDate(booking.starts_at)}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                              ID: {booking.booking_id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
