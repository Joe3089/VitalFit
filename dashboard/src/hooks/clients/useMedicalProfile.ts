"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { MedicalProfile } from "@vitalfit/sdk";

export function useMedicalProfile(userId: string, token: string | null) {
  const [medicalData, setMedicalData] = useState<MedicalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId || !token) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await api.user.getMedicalProfile(userId, token);

      if (response) {
        const data = response as unknown as MedicalProfile;

        setMedicalData({ ...data }); 
      }
    } catch (error: any) {
      if (error.status !== 404) {
        console.error("Error fetching medical profile:", error);
      }
      setMedicalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { medicalData, isLoading, refetch: fetchProfile };
}