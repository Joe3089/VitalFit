"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ForbiddenError from "@/components/errors/ForbiddenError";
import { UserRole } from "@/lib/roles";
import Loading from "@/app/[locale]/loading";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: UserRole[];
}) {
  const t = useTranslations("ProtectedRoute");
  const { isAuthenticated, loading, hasRole, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated && mounted) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router, mounted]);

  if (!mounted || loading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isSuperAdmin =
    user.role === UserRole.SUPER_ADMIN || user.role === ("super_admin" as any);

  const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
  const branchId =
    typeof user.activeBranch === "string"
      ? user.activeBranch
      : user.activeBranch?.id;

  const hasValidBranch = branchId && branchId !== EMPTY_GUID;

  if (!isSuperAdmin && !hasValidBranch) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-10 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Building2 className="h-10 w-10" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight">
          {t("noBranchTitle")}
        </h2>

        <p className="mt-2 max-w-[400px] text-muted-foreground text-lg">
          {t.rich("noBranchDescription", {
            roleValue: user.role_label, 
            role: (chunks) => <strong>{chunks}</strong>, 
          })}
        </p>

        <div className="mt-8 flex gap-4">
          <Button variant="default" onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("retry")}
          </Button>
          <Button variant="outline" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <ForbiddenError />;
  }

  return <>{children}</>;
}
