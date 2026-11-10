"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useFormatter, useNow } from "next-intl";
import { Bell, CheckCheck, MessageSquare, Loader2, Calendar, ExternalLink } from "lucide-react";
import { isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/notification/useNotifications";

interface NotificationCenterProps {
  jwt: string;
}

export function NotificationCenter({ jwt }: NotificationCenterProps) {
  const t = useTranslations("Notifications.Center");
  const format = useFormatter();
  const router = useRouter();
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadMore,
    hasMore,
    isLoading,
    isSyncing,
  } = useNotifications(jwt);

  const now = useNow();

  const formatMessageTime = (message: string) => {
    return message.replace(/(\d+h)?(\d+m)?(\d+)(\.\d+)?s$/, (match, h, m, s) => {
      const hours = h ? `${h} ` : "";
      const minutes = m ? `${m} ` : "";
      const seconds = s ? `${s}s` : "";
      return `${hours}${minutes}${seconds}`.trim();
    });
  };

 const formatRelativeTime = (dateString: string) => {
    if (!dateString) {
      return "";
    }
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "";
    }
    return format.relativeTime(date, now); 
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="error" 
              className="absolute -right-1 -top-1 h-4 w-4 justify-center rounded-full p-0 text-[10px] border-2 border-background"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 sm:w-[400px] shadow-xl" align="end">
        <div className="flex items-center justify-between p-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-foreground">
              {t("title")}
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium">
              {t("unread", { count: unreadCount })}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs text-primary hover:bg-primary/5"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              {t("markAll")}
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[380px]">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`flex w-full flex-col gap-1 border-b p-4 text-left transition-colors hover:bg-muted/40 last:border-0 ${
                    !n.is_read ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-full p-1.5 ${!n.is_read ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {n.type === "class_reminder" ? <Calendar className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                      </div>
                      <span className={`text-sm leading-none ${!n.is_read ? "font-semibold" : "text-muted-foreground font-medium"}`}>
                        {n.title}
                      </span>
                    </div>
                    {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  
                  <p className="pl-8 text-xs text-muted-foreground/90 leading-relaxed">
                    {formatMessageTime(n.message)}
                  </p>
                  
                  <div className="pl-8 mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground/50">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              {t("empty")}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2 bg-muted/20 space-y-1">
          {hasMore && (
            <Button
              variant="ghost"
              className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
              disabled={isSyncing}
              onClick={() => loadMore()}
            >
              {isSyncing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
              {isSyncing ? t("loading") : t("loadMore")}
            </Button>
          )}
          
          <Button
            variant="outline"
            className="w-full text-xs h-9 font-semibold shadow-sm"
            onClick={() => router.push("/settings/profile?tab=activity")}
          >
            {t("viewAll")}
            <ExternalLink className="ml-2 h-3 w-3 opacity-70" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}