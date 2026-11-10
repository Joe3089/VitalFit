"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/sdk-config";
import type { PublicMembershipResponse } from "@vitalfit/sdk";

export function usePublicMemberships(currency: string, token: string = "") {
  const [memberships, setMemberships] = useState<PublicMembershipResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function load() {
      if (!currency) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await api.membership.publicGetMemberships(
          token,
          { limit: 50, page: 1 },
          currency,
        );

        if (isMounted.current) {
          setMemberships(res.data || []);
        }
      } catch (err: any) {
        if (isMounted.current) {
          console.error("❌ Error loading memberships:", err);
          setError(err);
          setMemberships([]);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted.current = false;
    };
  }, [currency, token]);
  return { memberships, loading, error };
}
