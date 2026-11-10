"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Fingerprint, 
  Calendar, 
  Phone, 
  Mail, 
  User as UserIcon, 
  Tag, 
  ShieldCheck,
  MailCheck,
  MailQuestion,
  CheckCircle2,
  XCircle,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  client: {
    user_id: string;
    first_name: string;
    last_name: string;
    identity_document: string;
    email: string;
    phone: string;
    birth_date: string;
    gender: string;
    category: string;
    role_name: string;
    profile_picture_url: string;
    has_active_membership: boolean;
    status: string; 
    is_validated: boolean;
  };
  t: any;
  formatDate: (date: string) => string;
  formatPhone: (phone: string) => string;
}

export const ClientPersonalInfo = ({ client, t, formatDate, formatPhone }: Props) => {
  const initials = `${client.first_name?.[0] || ""}${client.last_name?.[0] || ""}`.toUpperCase();
  const isActive = client.status === "Active";

  return (
    <Card className="w-full overflow-hidden border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-left bg-white rounded-2xl sm:rounded-3xl">

      <CardHeader className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 border-b bg-slate-50/50 p-4 sm:p-6 text-center sm:text-left">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-xl">
            <AvatarImage src={client.profile_picture_url} alt={client.first_name} className="object-cover" />
            <AvatarFallback className="bg-orange-500 text-white text-xl sm:text-2xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className={cn(
            "absolute bottom-0 right-0 sm:bottom-1 sm:right-1 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
            isActive ? "bg-emerald-500" : "bg-red-500"
          )}>
            {isActive ? <CheckCircle2 className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">
              {client.first_name} {client.last_name}
            </CardTitle>
            
            <div className="flex justify-center sm:justify-start">
              {client.has_active_membership && (
                <Badge variant="success" className="bg-orange-100 text-orange-700 border-orange-200 px-2 py-0 font-black uppercase text-[9px]">
                  {t("status.active_member")}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge className={cn(
              "font-bold uppercase text-[9px] sm:text-[10px] shadow-none py-0.5 whitespace-nowrap",
              isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
            )} variant="outline">
              {isActive ? t("status.active") : t("status.blocked")}
            </Badge>

            <Badge className={cn(
              "font-bold uppercase text-[9px] sm:text-[10px] shadow-none py-0.5 gap-1.5 whitespace-nowrap",
              client.is_validated ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-500 border-slate-200"
            )} variant="outline">
              {client.is_validated ? <MailCheck className="w-3 h-3" /> : <MailQuestion className="w-3 h-3" />}
              {client.is_validated ? t("status.verified") : t("status.pending")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-12 gap-y-6 sm:gap-y-8">
          
          <InfoItem 
            label={t("fields.user_id")} 
            value={client.user_id} 
            icon={<Hash className="h-4 w-4" />} 
            className="sm:col-span-2 md:col-span-1"
          />

          <InfoItem 
            label={t("fields.identity")} 
            value={client.identity_document} 
            icon={<Fingerprint className="h-4 w-4" />} 
          />

          <InfoItem 
            label={t("fields.email")} 
            value={client.email} 
            icon={<Mail className="h-4 w-4" />} 
            verified={client.is_validated}
          />

          <InfoItem 
            label={t("fields.phone")} 
            value={formatPhone(client.phone)} 
            icon={<Phone className="h-4 w-4" />} 
          />

          <InfoItem 
            label={t("fields.birth_date")} 
            value={formatDate(client.birth_date)} 
            icon={<Calendar className="h-4 w-4" />} 
          />

          <InfoItem 
            label={t("fields.category")} 
            value={client.category} 
            icon={<Tag className="h-4 w-4" />} 
          />

          <InfoItem 
            label={t("fields.gender")} 
            value={client.gender ? t(`gender_options.${client.gender.toLowerCase()}`) : "N/A"} 
            icon={<UserIcon className="h-4 w-4" />} 
          />

          <InfoItem 
            label={t("fields.role")} 
            value={client.role_name} 
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const InfoItem = ({ 
  label, 
  value, 
  icon, 
  verified,
  className
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
  verified?: boolean;
  className?: string;
}) => (
  <div className={cn("group space-y-1.5 min-w-0", className)}>
    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
      {label}
    </p>
    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all group-hover:bg-white group-hover:border-slate-200 group-hover:shadow-sm overflow-hidden">
      <div className="text-slate-400 group-hover:text-orange-500 transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        <span className="text-xs sm:text-sm font-bold text-slate-700 truncate">
          {value || "N/A"}
        </span>
        {verified !== undefined && (
          <div className="shrink-0 ml-2">
            {verified ? 
              <MailCheck className="w-4 h-4 text-emerald-500" /> : 
              <MailQuestion className="w-4 h-4 text-amber-500" />
            }
          </div>
        )}
      </div>
    </div>
  </div>
);