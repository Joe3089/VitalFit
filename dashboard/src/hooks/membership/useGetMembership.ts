import { api } from "@/lib/sdk-config";
import { MembershipType } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

export default function useGetMembership(
  membershipId: string | undefined,
  token: string | null
) {
  const [membershipDetail, setMembershipDetail] = useState<MembershipType>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {

    if (!membershipId || !token) {
        return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.membership.getMembershipTypeByID(membershipId, token);

      if (response?.data) {
        setMembershipDetail(response.data);
      } else {
        setError("No se encontró el detalle de la membresia.");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la membresia.");
    } finally {
      setLoading(false);
    }
  }, [membershipId, token]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return { membershipDetail, loading, error, refetch: fetchMembership };
}
