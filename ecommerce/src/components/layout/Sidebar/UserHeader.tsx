import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useClientBookings } from "@/hooks/useClientBookings";

export default function UserHeader({ user }: any) {
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();

  const category = user.ClientProfile?.category || "Sin categoría";
  const scoring = user.ClientProfile?.scoring ?? 0;

  const { bookings } = useClientBookings();
  const { token } = useAuth();
  const [qrToken, setQrToken] = useState<string>("");
  const [countDown, setCountDown] = useState<number>(30);

  const fetchQrToken = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const res = await api.user.QrToken(token);
      const tokenValue =
        typeof res === "object" ? JSON.stringify(res) : String(res);
      setQrToken(tokenValue);
      setCountDown(30);
    } catch (error) {
      console.error("Error fetching QR token:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const initialFetchTimer = setTimeout(() => {
      fetchQrToken();
    }, 0);

    const refreshInterval = setInterval(() => {
      fetchQrToken();
    }, 30000);

    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(refreshInterval);
      clearInterval(timer);
    };
  }, [token, fetchQrToken]);

  return (
    <div className="flex flex-col items-center text-center px-6 pt-10 pb-6 bg-white">
      <div className="relative mb-4">
        <Avatar className="h-40 w-40 shadow-md border-2 border-gray-200 rounded-full">
          <AvatarImage src={user.profile_picture_url} alt={fullName} />
          <AvatarFallback className="bg-gray-300 text-white text-2xl rounded-full">
            {initials}
          </AvatarFallback>
        </Avatar>

        <Badge
          className="
            absolute -bottom-2 left-1/2 -translate-x-1/2
            bg-amber-400 text-amber-900 
            rounded-full px-3 py-0.5 text-[10px] font-semibold shadow-sm
          "
        >
          {category}
        </Badge>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 leading-tight">
        {fullName}
      </h2>

      <p className="text-xs text-gray-500">{user.email}</p>

      <p className="mt-2 text-sm font-medium text-gray-700">
        ⭐ {scoring} puntos
      </p>
      <div className="qrshow my-2 text-center">
        <p className="text-xs text-gray-500 mb-4 mt-1">
          Miembro desde:{" "}
          {(() => {
            if (!user.created_at) {
              return "";
            }
            const date = new Date(user.created_at);
            const months = [
              "Ene",
              "Feb",
              "Mar",
              "Abr",
              "May",
              "Jun",
              "Jul",
              "Ago",
              "Sep",
              "Oct",
              "Nov",
              "Dic",
            ];
            return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
          })()}
        </p>

        <div className="qrcode">
          {qrToken ? (
            <div className="w-full flex items-center justify-center">
              <QRCode size={128} value={qrToken} />
            </div>
          ) : (
            <div className="w-full h-[128px] flex items-center justify-center bg-gray-100 rounded-md">
              <span className="text-xs text-gray-400">Cargando...</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4 mt-1 w-full">
          Muestra este código en la entrada del gimnasio
        </p>

        <p className="text-xs text-gray-500 mb-4 mt-1 w-full font-bold">
          Expira en: {countDown}s
        </p>

        <div className="flex gap-2 justify-center mb-4">
          <Button
            onClick={() => fetchQrToken()}
            className="bg-black text-white hover:bg-gray-800 h-8 text-xs font-semibold px-4"
          >
            Generar
          </Button>
        </div>

        <p className="text-xs text-black font-bold mb-4 mt-1">
          Válido hasta:{" "}
          {(() => {
            if (!user.client_membership?.end_date) {
              return "";
            }
            const date = new Date(user.client_membership.end_date);
            const months = [
              "Ene",
              "Feb",
              "Mar",
              "Abr",
              "May",
              "Jun",
              "Jul",
              "Ago",
              "Sep",
              "Oct",
              "Nov",
              "Dic",
            ];
            return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
          })()}
        </p>
      </div>

      <div className="w-full mt-2 border-t pt-2">
        <div className="grid grid-cols-2 text-sm">
          <span className="flex-col text-left">Clases este mes: </span>
          <span className="flex-col text-end">
            {
              bookings.filter((booking) => {
                const bookingDate = new Date(booking.starts_at);
                const now = new Date();
                return (
                  bookingDate.getMonth() === now.getMonth() &&
                  bookingDate.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </span>
        </div>
      </div>
    </div>
  );
}
