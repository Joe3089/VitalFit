"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { SecuritySettings } from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { UserRole } from "@/lib/roles";
import { apiErrorMessage, useTokenSWR } from "@/hooks/advanced/useTokenSWR";

type Form = Omit<SecuritySettings, "updated_by" | "updated_at">;

const TOGGLES: (keyof Form)[] = [
  "require_uppercase",
  "require_lowercase",
  "require_number",
  "require_special",
];

/** HU-ADMIN-07 (password policy) and HU-ADMIN-03 (mandatory 2FA). */
export default function SecuritySettingsPage() {
  const t = useTranslations("advanced.security");
  const { token, hasRole } = useAuth();
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);
  const { data, isLoading, mutate } = useTokenSWR(isSuperAdmin ? ["security-settings"] : null, (jwt) =>
    api.auth.getSecuritySettings(jwt),
  );
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        min_length: data.min_length,
        require_uppercase: data.require_uppercase,
        require_lowercase: data.require_lowercase,
        require_number: data.require_number,
        require_special: data.require_special,
        expiration_days: data.expiration_days,
        two_factor_required: data.two_factor_required,
      });
    }
  }, [data]);

  if (!isSuperAdmin) {
    return <div className="p-8 text-muted-foreground">{t("forbidden")}</div>;
  }
  if (isLoading || !form) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const save = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    try {
      await api.auth.updateSecuritySettings(token, form);
      toast.success(t("saved"));
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actionButton={
          <Button onClick={save} disabled={saving}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            {saving ? t("saving") : t("save")}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("passwordPolicy")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex items-center justify-between gap-4 text-sm font-medium">
              {t("minLength")}
              <Input
                type="number"
                min={6}
                max={72}
                className="w-24"
                value={form.min_length}
                onChange={(e) => setForm({ ...form, min_length: Number(e.target.value) })}
              />
            </label>
            {TOGGLES.map((key) => (
              <label key={key} className="flex items-center justify-between gap-4 text-sm font-medium">
                {t(key)}
                <Switch
                  checked={Boolean(form[key])}
                  onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                />
              </label>
            ))}
            <label className="flex items-center justify-between gap-4 text-sm font-medium">
              <span>
                {t("expirationDays")}
                <span className="block text-xs font-normal text-muted-foreground">{t("expirationHint")}</span>
              </span>
              <Input
                type="number"
                min={0}
                max={3650}
                className="w-24"
                value={form.expiration_days}
                onChange={(e) => setForm({ ...form, expiration_days: Number(e.target.value) })}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("twoFactor")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between gap-4 text-sm font-medium">
              {t("twoFactorRequired")}
              <Switch
                checked={form.two_factor_required}
                onCheckedChange={(v) => setForm({ ...form, two_factor_required: v })}
              />
            </label>
            <p className="text-sm text-muted-foreground">{t("twoFactorHint")}</p>
            {data?.updated_at && (
              <p className="text-xs text-muted-foreground">
                {t("lastUpdate", { date: new Date(data.updated_at).toLocaleString() })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
