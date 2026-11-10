"use client";

import React from "react";
import { 
  X, Mail, UserCheck, Loader2, User, 
  IdCard, Target, Plus, ShieldCheck, 
  ShieldAlert, Crown, Fingerprint 
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface UserSelectionCardProps {
  user: {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    identity_document?: string;
    profile_picture_url?: string;
    role_name?: string;
    category?: string; 
    has_active_membership?: boolean;
  };
  onConfirm: () => void;
  onClear: () => void;
  isProcessing?: boolean;
  variant?: "enroll" | "focus"; 
}

export function UserSelectionCard({
  user,
  onConfirm,
  onClear,
  isProcessing = false,
  variant = "enroll",
}: UserSelectionCardProps) {
  const t = useTranslations("user.UserSelectionCard");

  if (!user) {
    return null;
  }

  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 border-slate-200 shadow-sm",
      variant === "focus" ? "border-none shadow-none" : "hover:shadow-md hover:border-slate-300"
    )}>
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-1 items-center gap-5 p-5">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-background shadow-inner ring-1 ring-slate-100">
              <AvatarImage src={user.profile_picture_url} className="object-cover" />
              <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-xl">
                {initials || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background shadow-sm text-white",
              user.has_active_membership ? "bg-green-500" : "bg-destructive"
            )}>
              {user.has_active_membership ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900 leading-none truncate">
                {user.first_name} {user.last_name}
              </h3>
              
              {user.category === "VIP" && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 gap-1 px-2 py-0 h-5">
                  <Crown className="h-3 w-3 fill-amber-600" />
                  <span className="text-[10px] font-black uppercase">VIP</span>
                </Badge>
              )}
              
              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter px-2 h-5 text-slate-400 border-slate-200">
                {user.role_name}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold">{user.identity_document}</span>
                <Separator orientation="vertical" className="h-3 bg-slate-200" />
                <Mail className="h-3.5 w-3.5 text-slate-400 ml-1" />
                <span className="text-xs font-medium truncate max-w-[150px]">{user.email}</span>
              </div>
              
              <div className="mt-1">
                <Badge 
                  variant={user.has_active_membership ? "default" : "error"} 
                  className={cn(
                    "h-5 px-2 text-[9px] font-bold uppercase tracking-widest",
                    user.has_active_membership ? "bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20" : ""
                  )}
                >
                  {user.has_active_membership ? "Acceso Autorizado" : "Membresía Inactiva"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className={cn(
          "flex items-center justify-center gap-3 px-6 py-4 md:py-0 border-t md:border-t-0 md:border-l border-slate-100",
          variant === "focus" ? "bg-transparent border-none" : "bg-slate-50/50"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClear} 
            disabled={isProcessing}
            className="rounded-full text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button 
            size="sm" 
            onClick={onConfirm} 
            disabled={isProcessing || !user.user_id}
            className={cn(
              "rounded-xl px-6 font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95",
              variant === "focus" 
                ? "bg-slate-900 hover:bg-black" 
                : "bg-orange-600 hover:bg-orange-700 shadow-orange-200"
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              variant === "focus" ? <Target className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
            )}
            {isProcessing ? t("actions.waiting") : (variant === "focus" ? t("actions.focus") : t("actions.enroll"))}
          </Button>
        </div>
      </div>
    </Card>
  );
}