"use client";

import { useState } from "react";
import { MessageSquareWarning, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import type {
  ClientFeedback,
  ContactMessage,
  ContactMessageStatus,
  FeedbackStatus,
  FeedbackType,
} from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { apiErrorMessage, useTokenSWR } from "@/hooks/advanced/useTokenSWR";

const STATUSES: FeedbackStatus[] = ["open", "in_progress", "resolved", "closed"];
const TYPES: FeedbackType[] = ["complaint", "suggestion", "compliment"];
const STATUS_VARIANT: Record<FeedbackStatus, "warning" | "info" | "success" | "outline"> = {
  open: "warning",
  in_progress: "info",
  resolved: "success",
  closed: "outline",
};
const ALL = "all";

/** HU-CLI-08 complaints & suggestions and HU-ECOMMERCE-23 contact inbox. */
export default function FeedbackPage() {
  const t = useTranslations("advanced.feedback");
  return (
    <div className="min-h-screen bg-background p-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Tabs defaultValue="feedback" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feedback">{t("tabs.feedback")}</TabsTrigger>
          <TabsTrigger value="contact">{t("tabs.contact")}</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
        <TabsContent value="contact">
          <ContactTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeedbackTab() {
  const t = useTranslations("advanced.feedback");
  const locale = useLocale();
  const { token } = useAuth();
  const [status, setStatus] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClientFeedback | null>(null);

  const { data, mutate, isLoading } = useTokenSWR(["crm-feedback", status, type, page], (jwt) =>
    api.crm.listFeedback(jwt, {
      status: status === ALL ? undefined : (status as FeedbackStatus),
      type: type === ALL ? undefined : (type as FeedbackType),
      page,
      limit: 15,
    }),
  );
  const rows = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 15));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allStatuses")}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allTypes")}</SelectItem>
            {TYPES.map((s) => <SelectItem key={s} value={s}>{t(`type.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">{t("date")}</th>
              <th>{t("client")}</th>
              <th>{t("typeLabel")}</th>
              <th>{t("subject")}</th>
              <th>{t("branch")}</th>
              <th>{t("statusLabel")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("empty")}</td></tr>
            )}
            {rows.map((f) => (
              <tr key={f.feedback_id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">{new Date(f.created_at).toLocaleDateString(locale)}</td>
                <td>
                  <div className="font-medium">{f.client_name}</div>
                  <div className="text-xs text-muted-foreground">{f.client_email}</div>
                </td>
                <td>{t(`type.${f.type}`)}</td>
                <td className="max-w-xs">
                  <div className="font-medium">{f.subject}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{f.description}</div>
                </td>
                <td>{f.branch_name || "-"}</td>
                <td><Badge variant={STATUS_VARIANT[f.status]}>{t(`status.${f.status}`)}</Badge></td>
                <td className="pr-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditing(f)}>{t("manage")}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("prev")}</Button>
        <span>{page} / {totalPages}</span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t("next")}</Button>
      </div>

      {creating && <CreateFeedbackDialog token={token} onClose={() => setCreating(false)} onSaved={() => mutate()} />}
      {editing && <UpdateFeedbackDialog token={token} feedback={editing} onClose={() => setEditing(null)} onSaved={() => mutate()} />}
    </div>
  );
}

function CreateFeedbackDialog({ token, onClose, onSaved }: { token: string | null; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("advanced.feedback");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<{ user_id: string; first_name: string; last_name: string; identity_document?: string }[]>([]);
  const [type, setType] = useState<FeedbackType>("complaint");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const findClients = async () => {
    if (!token || search.trim().length < 2) {
      return;
    }
    try {
      const res = await api.user.getClientUsers(token, { page: 1, limit: 10, search: search.trim() });
      setClients(res.data ?? []);
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  const save = async () => {
    if (!token || !clientId) {
      return;
    }
    setSaving(true);
    try {
      await api.crm.createFeedback(token, {
        user_id: clientId,
        type,
        subject,
        description,
        branch_id: user?.activeBranch?.id || undefined,
      });
      toast.success(t("created"));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("new")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchClient")}
              onKeyDown={(e) => e.key === "Enter" && findClients()} />
            <Button variant="outline" onClick={findClients}>{t("search")}</Button>
          </div>
          {clients.length > 0 && (
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder={t("selectClient")} /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.first_name} {c.last_name} {c.identity_document ? `(${c.identity_document})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((s) => <SelectItem key={s} value={s}>{t(`type.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={subject} maxLength={255} onChange={(e) => setSubject(e.target.value)} placeholder={t("subject")} />
          <Textarea value={description} maxLength={5000} rows={4} onChange={(e) => setDescription(e.target.value)} placeholder={t("description")} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving || !clientId || !subject.trim() || !description.trim()}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdateFeedbackDialog({ token, feedback, onClose, onSaved }: { token: string | null; feedback: ClientFeedback; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("advanced.feedback");
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [notes, setNotes] = useState(feedback.resolution_notes || "");
  const [saving, setSaving] = useState(false);
  const needsNotes = status === "resolved" || status === "closed";

  const save = async () => {
    if (!token) {
      return;
    }
    setSaving(true);
    try {
      await api.crm.updateFeedback(token, feedback.feedback_id, { status, resolution_notes: notes });
      toast.success(t("updated"));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-primary" />
            {feedback.subject}
          </DialogTitle>
        </DialogHeader>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{feedback.description}</p>
        <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Textarea value={notes} rows={4} onChange={(e) => setNotes(e.target.value)} placeholder={t("resolutionNotes")} />
        {needsNotes && !notes.trim() && <p className="text-xs text-amber-600">{t("notesRequired")}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving || (needsNotes && !notes.trim())}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactTab() {
  const t = useTranslations("advanced.feedback");
  const locale = useLocale();
  const { token } = useAuth();
  const [status, setStatus] = useState<string>(ALL);
  const { data, mutate } = useTokenSWR(["contact-messages", status], (jwt) =>
    api.crm.listContactMessages(jwt, status === ALL ? undefined : (status as ContactMessageStatus), 1, 50),
  );
  const rows: ContactMessage[] = data?.data ?? [];

  const setMsgStatus = async (id: string, s: ContactMessageStatus) => {
    if (!token) {
      return;
    }
    try {
      await api.crm.updateContactMessage(token, id, s);
      await mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    }
  };

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("allStatuses")}</SelectItem>
          {(["new", "read", "answered"] as const).map((s) => <SelectItem key={s} value={s}>{t(`contactStatus.${s}`)}</SelectItem>)}
        </SelectContent>
      </Select>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{t("emptyContact")}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((m) => (
          <div key={m.message_id} className="rounded-xl border bg-white p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{m.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString(locale)}
                </p>
              </div>
              <Badge variant={m.status === "new" ? "warning" : m.status === "answered" ? "success" : "info"}>
                {t(`contactStatus.${m.status}`)}
              </Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm">{m.message}</p>
            <div className="flex gap-2">
              {m.status !== "read" && <Button size="sm" variant="outline" onClick={() => setMsgStatus(m.message_id, "read")}>{t("markRead")}</Button>}
              {m.status !== "answered" && <Button size="sm" onClick={() => setMsgStatus(m.message_id, "answered")}>{t("markAnswered")}</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
