import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { isAPIError } from "@vitalfit/sdk";

export function useGetUser(userId: string | undefined, token: string | null) {
  const [user, setUser] = useState<any>(null);
  const [loading, setIsLoading] = useState(false);
  const [error, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId || !token) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorStatus(null);
      setErrorMessage(null); 

      const response = await api.user.GetUserByID(userId, token);
      
      if (response?.data) {
        setUser(response.data);
      }
    } catch (err: any) {
      if (isAPIError(err)) {
        setErrorStatus(err.status);
        setErrorMessage(err.messages.join(", "));
      } else {
        setErrorMessage(err.message || "Error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]); 

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { 
    user, 
    loading, 
    error, 
    errorMessage, 
    reload: fetchUser 
  };
}