"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuditLog } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Fingerprint,
  Globe,
  User,
  Terminal,
  Monitor,
  Code2,
  Copy,
  ShieldAlert,
  Mail,
  Smartphone,
  ArrowRight
} from "lucide-react";
import InfoBlock from "./InfoBlock";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetUser } from "@/hooks/users/useGetUser";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LogDetailsSheetProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewSessions?: (userId: string) => void;
}

export function LogDetailsSheet({
  log,
  open,
  onOpenChange,
  onViewSessions,
}: LogDetailsSheetProps) {
  const t = useTranslations("user.audit.details");
  const { token } = useAuth();

  const { user: userData, loading: userLoading } = useGetUser(log?.user_id || "", token);

  if (!log){
     return null;
  }

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const parsedPayload = (() => {
    if (!log.payload) {
      return null;
    }
    try {
      return typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload;
    } catch { return log.payload; }
  })();

  const isError = log.status >= 400;
  const methodColors: Record<string, string> = {
    POST: "bg-emerald-500 text-white",
    PUT: "bg-amber-500 text-white",
    PATCH: "bg-orange-500 text-white",
    DELETE: "bg-rose-500 text-white",
    GET: "bg-blue-500 text-white",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 flex flex-col gap-0 border-l shadow-2xl bg-background">
        <SheetHeader className={cn(
          "p-8 text-left transition-colors border-b",
          isError ? "bg-red-50/40 dark:bg-red-950/20" : "bg-zinc-50 dark:bg-zinc-900"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2">
              <Badge className={cn(
                
                methodColors[log.method] 
              )}>
                {log.method}
              </Badge>
              <Badge 
                variant="outline"
                className={cn(
                  "font-mono text-[10px] bg-background font-bold",
                  isError ? "text-red-600 border-red-200" : "text-emerald-600 border-emerald-200"
                )}
              >
                {log.status} {isError ? "×" : "✓"}
              </Badge>
            </div>
            <Button
              variant="outline" size="icon" className="h-8 w-8 rounded-full bg-background shadow-sm"
              onClick={() => copyToClipboard(JSON.stringify(log, null, 2), t("payload.copied"))}
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
          <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter">
            {t("title")}
          </SheetTitle>
          <SheetDescription className="text-[10px] font-mono opacity-60 flex items-center gap-1.5 mt-1">
             ID: {log.id}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8">

            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> {t("userSection")}
              </h4>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={userData?.profile_picture_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">
                      {userData ? `${userData.first_name[0]}${userData.last_name[0]}` : "SYS"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    {userLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-black italic uppercase tracking-tight text-foreground">
                          {userData ? `${userData.first_name} ${userData.last_name}` : t("systemProcess")}
                        </p>
                        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground font-medium">
                          {userData?.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {userData.email}</span>}
                          <span className="flex items-center gap-1.5 font-mono text-[10px] opacity-70 truncate max-w-[180px]">
                            <Fingerprint className="h-3 w-3" /> {log.user_id || "SYSTEM"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {log.user_id && onViewSessions && (
                  <Button 
                    variant="ghost" size="sm" 
                    className="h-8 text-[10px] font-black uppercase italic tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    onClick={() => onViewSessions(log.user_id!)}
                  >
                    <ShieldAlert className="h-3 w-3 mr-2" />
                    {t("viewSessions")}
                  </Button>
                )}
              </div>
            </section>

            <Separator className="opacity-50" />

            <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <InfoBlock 
                icon={<ArrowRight className="h-4 w-4 text-primary/70" />} 
                label={t("metadata.endpoint")} 
                value={log.path} 
                isMono 
              />
              <InfoBlock 
                icon={<Calendar className="h-4 w-4 text-primary/70" />} 
                label={t("metadata.dateTime")} 
                value={new Date(log.created_at).toLocaleString()} 
              />
              <InfoBlock 
                icon={<Globe className="h-4 w-4 text-primary/70" />} 
                label={t("metadata.ipAddress")} 
                value={log.ip_address} 
                isMono 
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5" /> {t("payload.label")}
                </label>
              </div>
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl ring-1 ring-white/5">
                <pre className="overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-zinc-800">
                  <code className="text-[11px] font-mono leading-relaxed text-emerald-400/90">
                    {parsedPayload ? JSON.stringify(parsedPayload, null, 2) : "// " + t("payload.empty")}
                  </code>
                </pre>
              </div>
            </section>

            <section className="p-5 rounded-2xl bg-muted/30 border border-zinc-200/40 dark:border-zinc-800/40">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("client.userAgent")}
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed break-all">
                {log.user_agent || t("client.unknown")}
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end">
          <Button 
            variant="ghost" 
            className="text-[11px] font-bold uppercase tracking-widest" 
            onClick={() => onOpenChange(false)}
          >
            {t("close")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}