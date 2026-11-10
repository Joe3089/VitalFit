"use client";

import { useState } from "react";
import { Gauge, Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ClientTag } from "@vitalfit/sdk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
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
import { apiErrorMessage, useTokenSWR } from "@/hooks/advanced/useTokenSWR";

const TAG_MANAGERS = [UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN];

const CATEGORY_VARIANT: Record<string, "success" | "info" | "warning" | "error"> = {
  VIP: "success",
  Regular: "info",
  New: "warning",
  AtRisk: "error",
};

/** HU-CLI-09 (scoring), HU-CLI-12 (segment) and HU-CLI-13 (tags) for a client. */
export function ClientCrmPanel({ clientId }: { clientId: string }) {
  const t = useTranslations("advanced.clientCrm");
  const { token, hasRole } = useAuth();
  const canManageTags = hasRole(TAG_MANAGERS);
  const [selected, setSelected] = useState("");
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: score } = useTokenSWR(["client-score", clientId], (jwt) =>
    api.crm.getClientScore(jwt, clientId),
  );
  const { data: clientTags, mutate: mutateClientTags } = useTokenSWR(
    canManageTags ? ["client-tags", clientId] : null,
    (jwt) => api.crm.getClientTags(jwt, clientId),
  );
  const { data: allTags, mutate: mutateAllTags } = useTokenSWR(
    canManageTags ? ["crm-tags"] : null,
    (jwt) => api.crm.listTags(jwt),
  );

  const assigned: ClientTag[] = clientTags?.data ?? [];
  const available = (allTags?.data ?? []).filter((tg) => !assigned.some((a) => a.tag_id === tg.tag_id));

  const run = async (fn: () => Promise<unknown>) => {
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      await fn();
      await Promise.all([mutateClientTags(), mutateAllTags()]);
    } catch (err) {
      toast.error(apiErrorMessage(err, t("error")));
    } finally {
      setBusy(false);
    }
  };

  const assign = () =>
    run(async () => {
      await api.crm.assignTag(token!, clientId, selected);
      setSelected("");
    });

  const createAndAssign = () =>
    run(async () => {
      const tag = await api.crm.createTag(token!, newTag.trim());
      await api.crm.assignTag(token!, clientId, tag.tag_id);
      setNewTag("");
    });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4 text-primary" />
            {t("scoreTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!score ? (
            <p className="text-sm text-muted-foreground">{t("noScore")}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black">{score.score}</span>
                <span className="text-muted-foreground">/ 100</span>
                <Badge variant={CATEGORY_VARIANT[score.category] ?? "info"}>
                  {t(`segments.${score.category}`)}
                </Badge>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${score.score}%` }} />
              </div>
              <ul className="space-y-1 text-sm">
                <li>{t("frequency", { points: score.frequency_score, visits: score.visits_90d })}</li>
                <li>
                  {t("punctuality", {
                    points: score.punctuality_score,
                    onTime: score.invoices_on_time,
                    total: score.invoices_total,
                  })}
                </li>
                <li className="text-muted-foreground">{t("referrals")}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {canManageTags && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-primary" />
              {t("tagsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {assigned.length === 0 && <p className="text-sm text-muted-foreground">{t("noTags")}</p>}
              {assigned.map((tag) => (
                <span
                  key={tag.tag_id}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button
                    type="button"
                    aria-label={t("remove")}
                    disabled={busy}
                    onClick={() => run(() => api.crm.unassignTag(token!, clientId, tag.tag_id))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t("selectTag")} />
                </SelectTrigger>
                <SelectContent>
                  {available.map((tg) => (
                    <SelectItem key={tg.tag_id} value={tg.tag_id}>
                      {tg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" disabled={!selected || busy} onClick={assign}>
                {t("assign")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                maxLength={60}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={t("newTagPlaceholder")}
              />
              <Button disabled={!newTag.trim() || busy} onClick={createAndAssign}>
                <Plus className="mr-1 h-4 w-4" />
                {t("create")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
