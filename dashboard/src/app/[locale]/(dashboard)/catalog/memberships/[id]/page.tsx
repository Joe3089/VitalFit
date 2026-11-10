"use client";

import { useAuth } from "@/context/AuthContext";
import ViewMembership from "./ViewMembership";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import { MembershipType, DataResponse } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function ViewMembershipPage() {
  const t = useTranslations("catalog.memberships");
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const id = params?.id as string | undefined;
  const [loading, setLoading] = useState(true);
  const [membership, setmembership] = useState<MembershipType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.replace("/catalog/memberships");
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }

    let mounted = true;

    setLoading(true);
    setError(null);
    setmembership(null);

    const fetchMembership = async () => {
      try {
        const membershipData: DataResponse<MembershipType> =
          await api.membership.getMembershipTypeByID(id, token);

        if (mounted) {
          setmembership(membershipData.data);
        }
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        const status = err?.response?.status ?? err?.status ?? null;

        if (status === 404) {
          router.replace("/catalog/memberships");
        } else if (status === 401) {
          setError(
            t("view.error_auth"),
          );
        } else {
          console.error("Error cargando membresia:", err);
          setError(t("view.error_load"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMembership();

    return () => {
      mounted = false;
    };
  }, [id, token, router]);

  if (loading) {
    return <div className="p-6">{t("view.loading")}</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!membership) {
    return (
      <div className="p-6 text-gray-500">
        {t("view.not_found")}
      </div>
    );
  }

  return <ViewMembership membership={membership} />;
}
