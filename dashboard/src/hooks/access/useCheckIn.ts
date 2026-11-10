import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { CheckIn, CheckInResponse } from "@vitalfit/sdk";

export const useCheckIn = (token: string) => {
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const processCheckIn = async (
    userId: string,
    branchId: string,
  ): Promise<CheckInResponse | null> => {
    setIsCheckingIn(true);
    const data: CheckIn = {
      user_id: userId,
      branch_id: branchId,
    };

    try {
      const response = await api.access.checkInManual(token, data);
      
      toast.success(`Acceso Permitido: ${response.service_name}`, {
        description: `Entrada registrada a las ${new Date().toLocaleTimeString()}`,
      });
      return response;
    } catch (error: any) {
      const status = error.status || error.response?.status;

      switch (status) {
        case 400:
          toast.error(
            "Datos inválidos: Verifique el ID del usuario o la sucursal.",
          );
          break;
        case 401:
          toast.error("Sesión expirada: Por favor, vuelva a iniciar sesión.");
          break;
        case 402:
          toast.error(
            "Pago Requerido: El socio tiene deudas pendientes y no puede ingresar.",
          );
          break;
        case 403:
          toast.error(
            "Acceso Prohibido: El socio no tiene permiso para este servicio en esta sede.",
          );
          break;
        case 500:
          toast.error(
            "Error de servidor: No se pudo registrar la asistencia en la base de datos.",
          );
          break;
        default:
          toast.error(
            "Error desconocido: Intente realizar el check-in nuevamente.",
          );
      }

      return null;
    } finally {
      setIsCheckingIn(false);
    }
  };

  return { processCheckIn, isCheckingIn };
};
