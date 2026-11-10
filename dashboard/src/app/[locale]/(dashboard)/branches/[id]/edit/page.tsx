"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/roles";
import { BranchDetails } from "@vitalfit/sdk";

import BranchFormContainer from "../components/BranchFormContainer";

export default function EditBranchPage() {
  const t = useTranslations("branches");
  const params = useParams();
  const router = useRouter();
  const { token, user, hasRole, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<BranchDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveId = useMemo(() => {
    if (authLoading || !user) {
      return null;
    }

    if (hasRole(UserRole.BRANCH_ADMIN) || params?.id === "active") {
      return user.activeBranch?.id;
    }

    return params?.id as string | undefined;
  }, [params?.id, user, hasRole, authLoading]);

  useEffect(() => {
    if (authLoading || !effectiveId || !token) {
      if (!authLoading && !effectiveId) {
        router.replace("/");
      }
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const branchData = await api.branch.getBranchById(effectiveId, token);
        if (mounted) {
          setBranch(branchData);
        }
      } catch (err) {
        if (mounted) {
          setError(t("details.error_loading"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, [effectiveId, token, router, authLoading, t]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-slate-400">
          Sincronizando permisos...
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-500 font-bold uppercase text-xs tracking-widest">
          {error || "Acceso Denegado"}
        </p>
      </div>
    );
  }

  return <BranchFormContainer mode="edit" branch={branch} />;
}