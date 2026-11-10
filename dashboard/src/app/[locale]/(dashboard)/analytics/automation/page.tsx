"use client";

import { useState } from "react";
import { Copy, Download, KeyRound, Link2, Mail, Palette, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReportFormat,
  ReportFrequency,
  ReportTemplateRequest,
  ReportType,
} from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { UserRole } from "@/lib/roles";
import { apiErrorMessage, isoDate, saveBlob, useTokenSWR } from "@/hooks/advanced/useTokenSWR";

const TYPES: ReportType[] = ["financial", "sales", "clients", "benchmark"];
const FORMATS: ReportFormat[] = ["pdf", "excel", "csv"];
const FREQUENCIES: ReportFrequency[] = ["daily", "weekly", "monthly"];
const DEFAULT_TEMPLATE = "default";

function useOptions() {
  const t = useTranslations("advanced.automation");
  const { data } = useTokenSWR(["report-templates"], (jwt) => api.insights.listTemplates(jwt));
  const templates = data?.data ?? [];
  const TypeSelect = ({ value, onChange }: { value: ReportType; onChange: (v: ReportType) => void }) => (
    <Select value={value} onValueChange={(v) => onChange(v as ReportType)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{TYPES.map((x) => <SelectItem key={x} value={x}>{t(`type.${x}`)}</SelectItem>)}</SelectContent>
    </Select>
  );
  const FormatSelect = ({ value, onChange }: { value: ReportFormat; onChange: (v: ReportFormat) => void }) => (
    <Select value={value} onValueChange={(v) => onChange(v as ReportFormat)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{FORMATS.map((x) => <SelectItem key={x} value={x}>{x.toUpperCase()}</SelectItem>)}</SelectContent>
    </Select>
  );
  const TemplateSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT_TEMPLATE}>{t("defaultTemplate")}</SelectItem>
        {templates.map((x) => <SelectItem key={x.template_id} value={x.template_id}>{x.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
  return { TypeSelect, FormatSelect, TemplateSelect, templates };
}

const templateParam = (v: string) => (v === DEFAULT_TEMPLATE ? undefined : v);

/** HU-ANALYTICS-15/16/17/18/22: exports, schedules, shared URLs, BI API and templates. */
export default function AutomationPage() {
  const t = useTranslations("advanced.automation");
  const { hasRole } = useAuth();
  const canManage = hasRole(UserRole.SUPER_ADMIN);

  return (
    <div className="min-h-screen bg-background p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Tabs defaultValue="download" className="space-y-6">
        <TabsList>
          <TabsTrigger value="download">{t("tabs.download")}</TabsTrigger>
          {canManage && <TabsTrigger value="schedules">{t("tabs.schedules")}</TabsTrigger>}
          {canManage && <TabsTrigger value="links">{t("tabs.links")}</TabsTrigger>}
          {canManage && <TabsTrigger value="templates">{t("tabs.templates")}</TabsTrigger>}
          {canManage && <TabsTrigger value="api">{t("tabs.api")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="download"><DownloadTab /></TabsContent>
        {canManage && <TabsContent value="schedules"><SchedulesTab /></TabsContent>}
        {canManage && <TabsContent value="links"><LinksTab /></TabsContent>}
        {canManage && <TabsContent value="templates"><TemplatesTab /></TabsContent>}
        {canManage && <TabsContent value="api"><ApiKeysTab /></TabsContent>}
      </Tabs>
    </div>
  );
}

function DateRange({ start, end, setStart, setEnd }: { start: string; end: string; setStart: (v: string) => void; setEnd: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
      <span className="text-muted-foreground">—</span>
      <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
    </div>
  );
}

function useDefaultRange() {
  const today = new Date();
  const [start, setStart] = useState(isoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)));
  const [end, setEnd] = useState(isoDate(today));
  return { start, end, setStart, setEnd };
}

function DownloadTab() {
  const t = useTranslations("advanced.automation");
  const { token } = useAuth();
  const { TypeSelect, FormatSelect, TemplateSelect } = useOptions();
  const range = useDefaultRange();
  const [type, setType] = useState<ReportType>("sales");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      const { blob, filename } = await api.insights.downloadReport(token, {
        type, format, template_id: templateParam(template), start: range.start, end: range.end,
      });
      saveBlob(blob, filename || `${type}_report.${format === "excel" ? "xlsx" : format}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("downloadTitle")}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end">
        <Field label={t("reportType")}><TypeSelect value={type} onChange={setType} /></Field>
        <Field label={t("format")}><FormatSelect value={format} onChange={setFormat} /></Field>
        <Field label={t("template")}><TemplateSelect value={template} onChange={setTemplate} /></Field>
        <Field label={t("period")}><DateRange {...range} /></Field>
        <Button onClick={download} disabled={busy}>
          <Download className="mr-2 h-4 w-4" />
          {busy ? t("generating") : t("download")}
        </Button>
      </CardContent>
    </Card>
  );
}

function SchedulesTab() {
  const t = useTranslations("advanced.automation");
  const locale = useLocale();
  const { token } = useAuth();
  const { TypeSelect, FormatSelect, TemplateSelect } = useOptions();
  const { data, mutate } = useTokenSWR(["report-schedules"], (jwt) => api.insights.listSchedules(jwt));
  const [name, setName] = useState("");
  const [type, setType] = useState<ReportType>("sales");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [frequency, setFrequency] = useState<ReportFrequency>("weekly");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [recipients, setRecipients] = useState("");

  const call = async (fn: () => Promise<unknown>, ok: string) => {
    if (!token) {
      return;
    }
    try {
      await fn();
      toast.success(ok);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  const create = () =>
    call(async () => {
      await api.insights.createSchedule(token!, {
        name, report_type: type, format, frequency, template_id: templateParam(template),
        recipients: recipients.split(/[,;\s]+/).filter(Boolean),
      });
      setName("");
      setRecipients("");
    }, t("scheduleCreated"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">{t("newSchedule")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label={t("name")}><Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t("reportType")}><TypeSelect value={type} onChange={setType} /></Field>
          <Field label={t("format")}><FormatSelect value={format} onChange={setFormat} /></Field>
          <Field label={t("frequency")}>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportFrequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{t(`frequencies.${f}`)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t("template")}><TemplateSelect value={template} onChange={setTemplate} /></Field>
          <Field label={t("recipients")}>
            <Input value={recipients} placeholder="gerencia@vitalfit.com, finanzas@vitalfit.com" onChange={(e) => setRecipients(e.target.value)} />
          </Field>
          <div className="md:col-span-3">
            <Button onClick={create} disabled={!name.trim() || !recipients.trim()}>
              <Mail className="mr-2 h-4 w-4" />
              {t("createSchedule")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(data?.data ?? []).map((s) => (
          <div key={s.schedule_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {t(`type.${s.report_type}`)} · {s.format.toUpperCase()} · {t(`frequencies.${s.frequency}`)} · {s.recipients.join(", ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("lastSent")}: {s.last_sent_at ? new Date(s.last_sent_at).toLocaleString(locale) : t("never")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={s.is_active}
                onCheckedChange={(v) =>
                  call(() => api.insights.updateSchedule(token!, s.schedule_id, {
                    name: s.name, report_type: s.report_type, format: s.format, frequency: s.frequency,
                    recipients: s.recipients, branch_id: s.branch_id ?? undefined, template_id: s.template_id ?? undefined, is_active: v,
                  }), t("saved"))
                }
              />
              <Button size="sm" variant="outline" onClick={() => call(() => api.insights.sendScheduleNow(token!, s.schedule_id), t("sent"))}>
                <Send className="mr-1 h-3 w-3" />{t("sendNow")}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => call(() => api.insights.deleteSchedule(token!, s.schedule_id), t("deleted"))}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinksTab() {
  const t = useTranslations("advanced.automation");
  const locale = useLocale();
  const { token } = useAuth();
  const { TypeSelect, FormatSelect, TemplateSelect } = useOptions();
  const range = useDefaultRange();
  const { data, mutate } = useTokenSWR(["share-links"], (jwt) => api.insights.listShareLinks(jwt));
  const [type, setType] = useState<ReportType>("financial");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [hours, setHours] = useState(48);
  const [created, setCreated] = useState<string | null>(null);

  const create = async () => {
    if (!token) {
      return;
    }
    try {
      const res = await api.insights.createShareLink(token, {
        report_type: type, format, template_id: templateParam(template), expires_in_hours: hours, start: range.start, end: range.end,
      });
      setCreated(res.url);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  const revoke = async (id: string) => {
    if (!token) {
      return;
    }
    try {
      await api.insights.deleteShareLink(token, id);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">{t("newLink")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label={t("reportType")}><TypeSelect value={type} onChange={setType} /></Field>
          <Field label={t("format")}><FormatSelect value={format} onChange={setFormat} /></Field>
          <Field label={t("template")}><TemplateSelect value={template} onChange={setTemplate} /></Field>
          <Field label={t("period")}><DateRange {...range} /></Field>
          <Field label={t("expiresInHours")}>
            <Input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </Field>
          <div className="flex items-end">
            <Button onClick={create} disabled={hours < 1 || hours > 720}>
              <Link2 className="mr-2 h-4 w-4" />{t("createLink")}
            </Button>
          </div>
          {created && (
            <div className="md:col-span-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
              <code className="flex-1 truncate">{created}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(created); toast.success(t("copied")); }}>
                <Copy className="mr-1 h-3 w-3" />{t("copy")}
              </Button>
            </div>
          )}
          {created && <p className="md:col-span-3 text-xs text-muted-foreground">{t("linkOnce")}</p>}
        </CardContent>
      </Card>
      <div className="space-y-2">
        {(data?.data ?? []).map((l) => (
          <div key={l.link_id} className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
            <span>
              {t(`type.${l.report_type}`)} · {l.format.toUpperCase()} · {l.period_start.slice(0, 10)} → {l.period_end.slice(0, 10)}
              <span className="ml-2 text-xs text-muted-foreground">
                {t("expires")} {new Date(l.expires_at).toLocaleString(locale)} · {t("accesses", { count: l.access_count })}
              </span>
            </span>
            <Button size="sm" variant="ghost" onClick={() => revoke(l.link_id)}>{t("revoke")}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

const EMPTY_TEMPLATE: ReportTemplateRequest = {
  name: "", primary_color: "#f58a24", header_text: "VitalFit", footer_text: "", orientation: "L", is_default: false,
};

function TemplatesTab() {
  const t = useTranslations("advanced.automation");
  const { token } = useAuth();
  const { data, mutate } = useTokenSWR(["report-templates"], (jwt) => api.insights.listTemplates(jwt));
  const [form, setForm] = useState<ReportTemplateRequest>(EMPTY_TEMPLATE);
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = async () => {
    if (!token) {
      return;
    }
    try {
      if (editingId) {
        await api.insights.updateTemplate(token, editingId, form);
      } else {
        await api.insights.createTemplate(token, form);
      }
      toast.success(t("saved"));
      setForm(EMPTY_TEMPLATE);
      setEditingId(null);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  const remove = async (id: string) => {
    if (!token) {
      return;
    }
    try {
      await api.insights.deleteTemplate(token, id);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("cannotDeleteDefault")));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" />{editingId ? t("editTemplate") : t("newTemplate")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={t("name")}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t("color")}>
            <div className="flex gap-2">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-14 rounded border" />
              <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </div>
          </Field>
          <Field label={t("header")}><Input value={form.header_text} maxLength={255} onChange={(e) => setForm({ ...form, header_text: e.target.value })} /></Field>
          <Field label={t("footer")}><Input value={form.footer_text} maxLength={255} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} /></Field>
          <Field label={t("orientation")}>
            <Select value={form.orientation} onValueChange={(v) => setForm({ ...form, orientation: v as "L" | "P" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">{t("landscape")}</SelectItem>
                <SelectItem value="P">{t("portrait")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <label className="flex items-center justify-between text-sm font-medium">
            {t("isDefault")}
            <Switch checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: v })} />
          </label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={!form.name.trim()}>{t("save")}</Button>
            {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_TEMPLATE); }}>{t("cancel")}</Button>}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {(data?.data ?? []).map((tp) => (
          <div key={tp.template_id} className="flex items-center justify-between rounded-xl border bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded" style={{ backgroundColor: tp.primary_color }} />
              <div>
                <p className="font-semibold">{tp.name} {tp.is_default && <Badge variant="success">{t("default")}</Badge>}</p>
                <p className="text-xs text-muted-foreground">{tp.header_text} · {tp.orientation === "L" ? t("landscape") : t("portrait")}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => {
                setEditingId(tp.template_id);
                setForm({ name: tp.name, primary_color: tp.primary_color, header_text: tp.header_text, footer_text: tp.footer_text, orientation: tp.orientation, is_default: tp.is_default });
              }}>{t("edit")}</Button>
              {!tp.is_default && (
                <Button size="icon" variant="ghost" onClick={() => remove(tp.template_id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const t = useTranslations("advanced.automation");
  const locale = useLocale();
  const { token } = useAuth();
  const { data, mutate } = useTokenSWR(["bi-keys"], (jwt) => api.insights.listAPIKeys(jwt));
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("");
  const [plain, setPlain] = useState<string | null>(null);

  const create = async () => {
    if (!token) {
      return;
    }
    try {
      const res = await api.insights.createAPIKey(token, name.trim(), expires || undefined);
      setPlain(res.api_key);
      setName("");
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  const revoke = async (id: string) => {
    if (!token) {
      return;
    }
    try {
      await api.insights.revokeAPIKey(token, id);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" />{t("newKey")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("apiHint")}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 md:items-end">
          <Field label={t("name")}><Input value={name} placeholder="Power BI" onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t("expiresAt")}><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>
          <Button onClick={create} disabled={!name.trim()}>{t("createKey")}</Button>
          {plain && (
            <div className="md:col-span-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all">{plain}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(plain); toast.success(t("copied")); }}>
                  <Copy className="mr-1 h-3 w-3" />{t("copy")}
                </Button>
              </div>
              <p className="text-xs text-amber-800">{t("keyOnce")}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="space-y-2">
        {(data?.data ?? []).map((k) => (
          <div key={k.key_id} className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
            <span>
              <span className="font-semibold">{k.name}</span> <code className="ml-2 text-xs">{k.key_prefix}…</code>
              <span className="ml-2 text-xs text-muted-foreground">
                {t("lastUsed")}: {k.last_used_at ? new Date(k.last_used_at).toLocaleString(locale) : t("never")}
              </span>
            </span>
            {k.revoked_at ? (
              <Badge variant="outline">{t("revoked")}</Badge>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => revoke(k.key_id)}>{t("revoke")}</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
