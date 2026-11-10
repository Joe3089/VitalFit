"use client";

import { useState } from "react";
import { AlertTriangle, Check, RefreshCw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import type { BenchmarkMetric } from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { UserRole } from "@/lib/roles";
import { apiErrorMessage, isoDate, useTokenSWR } from "@/hooks/advanced/useTokenSWR";

const METRICS: BenchmarkMetric[] = ["revenue", "new_clients", "active_members", "check_ins", "occupancy_rate", "nps"];

/**
 * HU-ANALYTICS-03 conversion, -06 NPS, -11 RevPAS, -19 anomaly alerts,
 * -20 churn risk, -21 benchmarking and HU-CLI-12 segments.
 */
export default function InsightsPage() {
  const t = useTranslations("advanced.insights");
  const locale = useLocale();
  const { token, hasRole, user } = useAuth();
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);
  const branchId = isSuperAdmin ? undefined : user?.activeBranch?.id;

  const today = new Date();
  const [start, setStart] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)));
  const [end, setEnd] = useState(isoDate(today));
  const range = { start, end };

  const conversion = useTokenSWR(["ins-conv", start, end], (jwt) => api.insights.getConversion(jwt, range));
  const nps = useTokenSWR(["ins-nps", start, end], (jwt) => api.insights.getNPS(jwt, range));
  const revpas = useTokenSWR(["ins-revpas", start, end, branchId], (jwt) =>
    api.insights.getRevPAS(jwt, { ...range, branch_id: branchId }),
  );
  const bench = useTokenSWR(["ins-bench", start, end], (jwt) => api.insights.getBenchmark(jwt, range));
  const churn = useTokenSWR(["ins-churn", branchId], (jwt) =>
    api.insights.getChurnRisk(jwt, { branch_id: branchId, min_score: 40 }),
  );
  const segments = useTokenSWR(["ins-segments", branchId], (jwt) => api.crm.getSegments(jwt, branchId));
  const alerts = useTokenSWR(["ins-alerts", branchId], (jwt) =>
    api.insights.listAlerts(jwt, { open: true, branch_id: branchId }),
  );

  const num = (v: number | undefined, digits = 2) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v ?? 0);
  const money = (v: number | undefined) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(v ?? 0);

  const ack = async (id: string) => {
    if (!token) {
      return;
    }
    try {
      await api.insights.acknowledgeAlert(token, id);
      await alerts.mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  const detect = async () => {
    if (!token) {
      return;
    }
    try {
      const res = await api.insights.detectAlerts(token);
      toast.success(t("detected", { count: res.data.length }));
      await alerts.mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-background p-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actionButton={
          <div className="flex items-center gap-2">
            <Input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} className="w-40" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="w-40" />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title={t("conversion")} value={`${num(conversion.data?.conversion_rate)}%`}
          hint={t("conversionHint", { visitors: conversion.data?.visitors ?? 0, purchases: conversion.data?.purchases ?? 0 })} />
        <Kpi title={t("signupRate")} value={`${num(conversion.data?.signup_rate)}%`}
          hint={t("signupHint", { signups: conversion.data?.signups ?? 0 })} />
        <Kpi title={t("nps")} value={num(nps.data?.nps, 1)}
          hint={t("npsHint", { responses: nps.data?.responses ?? 0, promoters: nps.data?.promoters ?? 0, detractors: nps.data?.detractors ?? 0 })} />
        <Kpi title={t("revpas")} value={money(revpas.data?.revpas)}
          hint={t("revpasHint", { spaces: num(revpas.data?.available_spaces, 0), revenue: money(revpas.data?.revenue) })} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("alerts")}
            </CardTitle>
            {isSuperAdmin && (
              <Button size="sm" variant="outline" onClick={detect}>
                <RefreshCw className="mr-2 h-3 w-3" />
                {t("detect")}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {(alerts.data?.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("noAlerts")}</p>}
            {(alerts.data?.data ?? []).map((a) => (
              <div key={a.alert_id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.severity === "high" ? "error" : a.severity === "medium" ? "warning" : "info"}>
                      {t(`severity.${a.severity}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{a.branch_name} · z={num(a.z_score)}</span>
                  </div>
                  <p className="text-sm">{a.message}</p>
                </div>
                <Button size="icon" variant="ghost" title={t("acknowledge")} onClick={() => ack(a.alert_id)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("segments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(segments.data?.data ?? []).map((s) => (
              <div key={s.category} className="flex items-center justify-between text-sm">
                <span>{t(`segment.${s.category}`)}</span>
                <span className="font-bold">{s.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            {t("benchmark")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t("benchmarkHint")}</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">#</th>
                <th>{t("branch")}</th>
                {METRICS.map((m) => <th key={m}>{t(`metric.${m}`)}</th>)}
                <th>{t("score")}</th>
              </tr>
            </thead>
            <tbody>
              {(bench.data?.branches ?? []).map((b) => (
                <tr key={b.branch_id} className="border-t">
                  <td className="py-2 font-bold">{b.rank}</td>
                  <td className="font-medium">{b.branch_name}</td>
                  {METRICS.map((m) => {
                    const raw = m === "nps" ? b.nps : (b[m as keyof typeof b] as number);
                    const best = b.best_in.includes(m);
                    return (
                      <td key={m} className={best ? "font-bold text-green-700" : ""}>
                        {raw === null || raw === undefined ? "-" : m === "revenue" ? money(raw) : num(raw)}
                        {b.indexes[m] !== undefined && (
                          <span className="ml-1 text-xs text-muted-foreground">({num(b.indexes[m], 0)})</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="font-bold">{num(b.score, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("revpasByService")}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">{t("service")}</th><th>{t("branch")}</th><th>{t("occupancy")}</th><th>RevPAS</th></tr>
              </thead>
              <tbody>
                {(revpas.data?.by_service ?? []).map((r) => (
                  <tr key={`${r.branch_id}-${r.service_id}`} className="border-t">
                    <td className="py-2">{r.service_name}</td>
                    <td>{r.branch_name}</td>
                    <td>{num(r.occupancy_rate)}%</td>
                    <td className="font-semibold">{money(r.revpas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("churn")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("churnHint")}</p>
          </CardHeader>
          <CardContent className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">{t("client")}</th><th>{t("risk")}</th><th>{t("factors")}</th></tr>
              </thead>
              <tbody>
                {(churn.data?.data ?? []).map((c) => (
                  <tr key={c.user_id} className="border-t align-top">
                    <td className="py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td>
                      <Badge variant={c.risk_score >= 70 ? "error" : "warning"}>{c.risk_score}</Badge>
                    </td>
                    <td className="text-xs">{c.factors.join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(churn.data?.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t("noChurn")}</p>}
          </CardContent>
        </Card>
      </div>

      {(nps.data?.recent_comments ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("npsComments")}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {nps.data!.recent_comments.map((c, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <Badge variant={c.score >= 9 ? "success" : c.score >= 7 ? "info" : "error"}>{c.score}/10</Badge>
                <span className="ml-2 text-xs text-muted-foreground">{c.branch_name}</span>
                <p className="mt-1">{c.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
