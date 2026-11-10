"use client";

import { ClientMembershipDetail } from "@vitalfit/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { useTranslations, useLocale } from "next-intl";

interface ClientMembershipFormProps {
  data: ClientMembershipDetail;
}

export default function ClientMembershipForm({ data }: ClientMembershipFormProps) {
  const t = useTranslations("finance.MembershipManagement.form");
  const locale = useLocale();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
      return "N/A";
    }
    return new Date(dateStr).toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).replace(",", "");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active": return "success";
      case "Expired": return "warning";
      case "Cancelled": return "error";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <p className="text-muted-foreground text-sm font-medium">
            {t("header.instruction")} <span className="font-mono text-primary font-bold">{data.client_membership_id}</span>
          </p>
        </div>
        <Badge variant={getStatusVariant(data.status)} className="h-9 px-6 uppercase text-xs font-bold tracking-widest shadow-sm">
          {t(`statusLabels.${data.status.toLowerCase()}`)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          <Card className="shadow-none border-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t("clientInfo.sectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("clientInfo.fullName")}</Label>

                <Input 
                  readOnly 
                  value={data.user ? `${data.user.first_name} ${data.user.last_name}` : "Usuario Desconocido"} 
                  className="bg-slate-100 border-none h-11 font-medium focus-visible:ring-0" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("clientInfo.email")}</Label>

                <Input 
                  readOnly 
                  value={data.user?.email || "—"} 
                  className="bg-slate-100 border-none h-11 focus-visible:ring-0" 
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("clientInfo.systemId")}</Label>
                <Input readOnly value={data.user_id} className="bg-slate-100 border-none h-11 font-mono text-[11px] text-slate-500 focus-visible:ring-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t("subscription.sectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("subscription.membershipType")}</Label>

                  <Input 
                    readOnly 
                    value={data.membership_type?.name || "Sin Plan Asignado"} 
                    className="bg-slate-100 border-none h-11 font-bold focus-visible:ring-0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("subscription.price")}</Label>

                  <Input 
                    readOnly 
                    value={`$${(data.membership_type?.price ?? 0).toFixed(2)}`} 
                    className="bg-slate-100 border-none h-11 font-bold text-[#f28733] focus-visible:ring-0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("subscription.duration")}</Label>

                  <Input 
                    readOnly 
                    value={data.membership_type?.duration_days ?? 0} 
                    className="bg-slate-100 border-none h-11 focus-visible:ring-0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("subscription.invoiceId")}</Label>
                  <Input readOnly value={data.invoice_id || "N/A"} className="bg-slate-100 border-none h-11 font-mono text-[11px] focus-visible:ring-0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 ml-1">{t("subscription.description")}</Label>
                <p className="text-sm p-4 bg-slate-100 rounded-md text-slate-600 italic">

                  {data.membership_type?.description || t("subscription.defaultDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-none border-slate-100 bg-slate-50/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 italic">{t("timeline.sectionTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 italic">{t("timeline.startDate")}</Label>
                <Input readOnly value={formatDate(data.start_date)} className="bg-white border-none h-11 shadow-sm focus-visible:ring-0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-600 italic">{t("timeline.endDate")}</Label>
                <Input readOnly value={formatDate(data.end_date)} className="bg-white border-none h-11 shadow-sm focus-visible:ring-0" />
              </div>
            </CardContent>
          </Card>

          {data.status !== "Active" && (
            <Card className="border-red-100 bg-red-50/20 shadow-none animate-in fade-in zoom-in duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">{t("audit.sectionTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-red-500/70">{t("audit.reason")}</Label>
                  <Input readOnly value={data.cancellation_reason?.description || t("audit.defaultReason")} className="bg-white border-red-50 h-11 text-red-800 text-sm focus-visible:ring-0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-red-500/70">{t("audit.notes")}</Label>
                  <p className="text-xs italic p-3 bg-white rounded-md border border-red-50 text-red-900 leading-relaxed shadow-sm">
                    {data.cancellation_notes ? `"${data.cancellation_notes}"` : t("audit.noNotes")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}