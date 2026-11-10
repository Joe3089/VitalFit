"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";

export function useUserByEmail(token: string | null, email: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !email || !email.includes("@") || !email.includes(".")) {
        setUserData(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.user.getUserByEmail(email, token);
        setUserData(response);
      } catch (error: any) {
        setUserData(null);
        if (error.status !== 404) {
          console.error("Error buscando usuario:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [email, token]);

  const clearUser = () => setUserData(null);

  return { userData, isLoading, clearUser };
}