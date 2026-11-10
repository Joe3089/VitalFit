"use client";

import { useTranslations } from "next-intl";
import {
  Monitor,
  ShieldAlert,
  Trash2,
  Globe,
  Clock,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionsManager } from "@/hooks/audith/useSessionsManager";

export function SessionsList({
  userId,
  token,
}: {
  userId?: string;
  token: string;
}) {
  const t = useTranslations("user.audit.sessions");
  const { sessions, isLoading, handleRevokeOne, handleRevokeAll } =
    useSessionsManager(token, userId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-full text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-destructive tracking-tight">
              {t("title")}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight max-w-[250px] md:max-w-none">
              {t("description")}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="font-bold text-xs h-8 shadow-sm"
          onClick={() => confirm(t("confirmRevokeAll")) && handleRevokeAll()}
        >
          {t("btnRevokeAll")}
        </Button>
      </div>


      <div className="grid gap-3">
        {sessions.map((session) => {
          const isMobile = /mobile|android|iphone/i.test(session.user_agent);

          return (
            <Card
              key={session.id}
              className="group shadow-none border border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2.5 bg-muted rounded-lg text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {isMobile ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {session.client_ip}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/5 text-emerald-600 border-emerald-200 dark:border-emerald-900 text-[10px] h-4 px-1.5 font-bold"
                      >
                        {t("statusActive")}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Globe className="h-3 w-3 opacity-60" />
                        {session.user_agent.split(" ")[0]}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3 w-3 opacity-60" />
                        {t("expires")}:{" "}
                        {new Date(session.expires_at).toLocaleDateString(
                          undefined,
                          { dateStyle: "medium" }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() =>
                    confirm(t("confirmRevokeOne")) &&
                    handleRevokeOne(session.id)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl bg-muted/20">
            <Monitor className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground italic">{t("empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
