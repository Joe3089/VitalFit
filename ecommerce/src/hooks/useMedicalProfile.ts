"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import type { MedicalProfile as SDKMedicalProfile } from "@vitalfit/sdk";

export type MedicalProfile = SDKMedicalProfile;

export function useMedicalProfile() {
  const { token, user } = useAuth();
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!token || !user?.user_id) {
      setMedicalProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.user.getMedicalProfile(user.user_id, token);

      if (response && typeof response === "object") {
        const data = "data" in response ? response.data : response;

        if (data && typeof data === "object") {
          const hasMedicalFields =
            "medical_conditions" in data ||
            "allergies" in data ||
            "emergency_contact" in data;

          if (hasMedicalFields) {
            setMedicalProfile(data as MedicalProfile);
          } else {
            setMedicalProfile(null);
          }
        } else {
          setMedicalProfile(null);
        }
      } else {
        setMedicalProfile(null);
      }
    } catch (err) {
      console.error("Error fetching medical profile:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";

      if (
        errorMessage.toLowerCase().includes("medical information not found")
      ) {
        setMedicalProfile(null);
        setError(null);
      } else {
        setError(errorMessage);
        setMedicalProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const save = useCallback(
    async (data: MedicalProfile) => {
      if (!token || !user?.user_id) {
        throw new Error("No autorizado");
      }

      try {
        setIsSaving(true);
        setError(null);

        if (medicalProfile) {
          await api.user.updateMedicalProfile(user.user_id, data, token);
        } else {
          await api.user.createMedicalProfile(user.user_id, data, token);
        }

        await fetch();
        toast.success("Información médica guardada correctamente");
      } catch (err) {
        console.error("Error saving medical profile:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al guardar la información médica";
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [token, user, medicalProfile, fetch],
  );

  return {
    medicalProfile,
    isLoading,
    isSaving,
    error,
    refresh: fetch,
    save,
  } as const;
}

export default useMedicalProfile;
