"use client";

import { useMemo } from "react";
import PolicyCard from "@/components/modules/Policy/PolicyCard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { usePoliciesConfiguration } from "@/hooks/Policies/usePoliciesConfiguration";
import { useTranslations } from "next-intl";
import { UserRole } from "@/lib/roles";
import {
  Loader2,
  RefreshCw,
  Lock,
  ShieldCheck
} from "lucide-react";

const CATEGORY_META: Record<
  string,
  { titleKey: string; descriptionKey: string }
> = {
  INVOICE: {
    titleKey: "categories.invoice.title",
    descriptionKey: "categories.invoice.description",
  },
  CLASS: {
    titleKey: "categories.class.title",
    descriptionKey: "categories.class.description",
  },
  ACCESS: {
    titleKey: "categories.access.title",
    descriptionKey: "categories.access.description",
  },
  MEMBERSHIP: {
    titleKey: "categories.membership.title",
    descriptionKey: "categories.membership.description",
  },
  DISCOUNT: {
    titleKey: "categories.discount.title",
    descriptionKey: "categories.discount.description",
  },
};

export default function CommercialPolicies() {
  const { token, user, hasRole } = useAuth();
  const t = useTranslations("settings.Policies");
  if (!user) {
    return null;
  }
  const canEdit = hasRole(UserRole.SUPER_ADMIN);

  const { policies, isLoading, update, isUpdating, refresh } = 
    usePoliciesConfiguration.useCommercialPolicies(token);

  const categories = useMemo(() => {
    return Object.keys(CATEGORY_META).filter((key) =>
      policies?.some((p) => p.category.includes(key))
    );
  }, [policies]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold italic uppercase text-muted-foreground">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-theme min-h-screen bg-background p-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actionButton={
          <div className="flex items-center gap-3">
            {!canEdit ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border text-muted-foreground text-xs font-bold uppercase">
                <Lock size={14} />
                {t("readOnly") || "Solo Lectura"}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md border border-primary/20 text-primary text-xs font-bold uppercase">
                <ShieldCheck size={14} />
                {t("fullAccess") || "Editor"}
              </div>
            )}

            <Button
              onClick={() => refresh()}
              variant="outline"
              className="flex items-center gap-2 font-bold uppercase"
            >
              <RefreshCw
                size={16}
                className={isUpdating ? "animate-spin" : ""}
              />
              {t("actions.refresh")}
            </Button>
          </div>
        }
      />

      {isUpdating && (
        <div className="mt-4 rounded-md bg-primary/5 px-4 py-2 text-xs font-bold uppercase text-primary animate-pulse">
          {t("saving")}
        </div>
      )}

      <div className="mt-10 space-y-14">
        {categories.length === 0 && (
          <div className="rounded-xl border border-dashed p-20 text-center">
            <p className="italic text-muted-foreground">
              {t("empty")}
            </p>
          </div>
        )}

        {categories.map((key) => {
          const meta = CATEGORY_META[key];

          return (
            <section key={key} className="space-y-6">
              <header className="flex items-start gap-3 border-l-4 border-primary pl-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">
                    {t(meta.titleKey)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t(meta.descriptionKey)}
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {policies
                  ?.filter((p) => p.category.includes(key))
                  .map((policy) => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      isSaving={isUpdating}
                      readOnly={!canEdit}
                      onSave={(newValue) => {
                        if (canEdit) {
                          update(policy.id, newValue);
                        }
                      }}
                    />
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}