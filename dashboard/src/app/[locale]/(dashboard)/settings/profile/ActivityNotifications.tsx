"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useFormatter } from "next-intl"; 
import { Inbox, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/notification/useNotifications";

export function ActivityNotifications() {
  const { token } = useAuth();
 const t = useTranslations("Notifications.ActivityNotifications");
  const format = useFormatter(); 

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    isLoading, 
    isSyncing, 
    unreadCount,
    hasMore,
    loadMore,
  } = useNotifications(token || "");

  const formatMessage = (msg: string) => msg?.replace(/\.\d+s/, "s") || "";

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] w-full bg-background overflow-hidden border rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-4 py-4 border-b border-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-foreground tracking-tight">
            {t("title")}
          </h4>
          {unreadCount > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-600 h-5 px-1.5 rounded-full animate-in zoom-in duration-300">
              {unreadCount}
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-semibold transition-colors"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 w-full overflow-y-auto">
        <div className="p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
              <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {t("emptyTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                {t("emptyDescription")}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                    !n.is_read
                      ? "bg-orange-50/40 border-orange-100 shadow-sm ring-1 ring-orange-500/5"
                      : "bg-background border-muted/40 opacity-70 hover:opacity-100 hover:border-muted/80",
                  )}
                >
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {!n.is_read ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.4)] animate-pulse" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm truncate tracking-tight",
                            !n.is_read
                              ? "font-bold text-foreground"
                              : "font-medium text-muted-foreground",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums font-medium whitespace-nowrap">
                          {format.dateTime(new Date(n.created_at), {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-2">
                        {formatMessage(n.message)}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold tracking-wider py-0 px-1.5 bg-background"
                          >
                            {n.metadata?.service_name || t("systemName")}
                          </Badge>
                          {n.metadata?.booking_id && (
                            <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                              #{n.metadata.booking_id.slice(-6).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="pt-2 pb-6">
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50/50 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadMore();
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        {t("loadingMore")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-2" />
                        {t("loadMore")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t border-muted/50 bg-muted/5 shrink-0">
        <p className="text-[10px] text-muted-foreground text-center italic font-medium">
          {t("footerNote")}
        </p>
      </div>
    </div>
  );
}