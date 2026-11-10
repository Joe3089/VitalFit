"use client";

import { useAuth } from "@/context/AuthContext";
import BranchFormContainer from "./components/BranchFormContainer";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/sdk-config";
import { BranchDetails } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { UserRole } from "@/lib/roles";

export default function ViewBranchPage() {
  const t = useTranslations("branches");
  const params = useParams();
  const router = useRouter();
  const { token, user, hasRole } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState<BranchDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = useMemo(() => {
    if (hasRole(UserRole.SUPER_ADMIN)){
       return true;
    }
    if (hasRole(UserRole.BRANCH_ADMIN)){
       return true; 
    }
    return false;
  }, [hasRole]);

  const effectiveId = useMemo(() => {
    if (hasRole(UserRole.BRANCH_ADMIN)) {
      return user?.activeBranch?.id;
    }
    return params?.id as string | undefined;
  }, [params?.id, user?.activeBranch?.id, hasRole]);

  useEffect(() => {
    if (!effectiveId) {
      if (!loading && !user?.activeBranch) {
         router.replace("/dashboard");
      }
      return;
    }

    if (!token) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const branchData = await api.branch.getBranchById(effectiveId, token);
        if (!mounted) {
          return;
        }
        setBranch(branchData);
      } catch (err: any) {
        if (!mounted){
           return;
        }
        const status = err?.response?.status ?? err?.status ?? null;
        if (status === 404) {
          router.replace("/branches");
        } else {
          setError(t("details.error_loading"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, [effectiveId, token, router, user?.activeBranch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400 font-medium uppercase tracking-widest text-xs">
          {t("details.loading")}
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return <div className="p-6 text-red-500 font-bold">{error || "No se encontró la sucursal"}</div>;
  }

  return (
    <BranchFormContainer 
      mode="view"
      branch={branch} 
    />
  );
}