"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/Label";
import { 
  CreatePaymentMethod, 
  PaymentMethod, 
  ZelleConfig, 
  BankTransferConfig, 
  PagoMovilConfig 
} from "@vitalfit/sdk";

type FormMode = "create" | "edit" | "view";
type PaymentFormData = PaymentMethod | CreatePaymentMethod;

interface PaymentFormProps {
  formData: PaymentFormData;
  errors?: Record<string, string>;
  onChange: (field: string, value: any) => void;
  mode: FormMode;
}

export default function PaymentForm({ formData, errors, onChange, mode }: PaymentFormProps) {
  const t = useTranslations("catalog.payment_methods");
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const nameLower = (formData.name || "").toLowerCase();

  const isDetectedAsPagoMovil = nameLower.includes("pago movil") || nameLower.includes("pago móvil");
  const isDetectedAsZelle = nameLower.includes("zelle");

  const showPagoMovil = isDetectedAsPagoMovil;
  const showZelle = isDetectedAsZelle || (formData.type === "Other" && !isDetectedAsPagoMovil);
  const showBankTransfer = (formData.type === "Transfer" && !isDetectedAsPagoMovil && !isDetectedAsZelle);

  const updateConfig = (key: string, val: any) => {
    if (isView) {
      return;
    }
    const currentConfig = formData.configuration || {};
    onChange("configuration", { ...currentConfig, [key]: val });
  };

  return (
    <div className="space-y-6 text-left w-full overflow-x-hidden">
      {/* SECCIÓN 1: IDENTIFICACIÓN (RESPONSIVA) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("form.labels.name")}</Label>
            <Input
              id="name"
              placeholder={t("form.placeholders.name_example")}
              value={formData.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              disabled={isView}
              className={errors?.name ? "border-destructive w-full" : "w-full"}
            />
            {errors?.name && (
              <p className="text-[10px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_name">{t("form.labels.display_name")}</Label>
            <Input
              id="display_name"
              placeholder={t("form.placeholders.display_name")}
              value={(formData as any).display_name || formData.name || ""}
              onChange={(e) => onChange("display_name", e.target.value)}
              disabled={isView}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>{t("form.labels.type")}</Label>
            <Select
              value={formData.type || ""}
              onValueChange={(v) => {
                onChange("type", v);
                onChange("configuration", {});
              }}
              disabled={isView} 
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("form.placeholders.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">{t("table.types.cash")}</SelectItem>
                <SelectItem value="Card">{t("table.types.card")}</SelectItem>
                <SelectItem value="Transfer">{t("table.types.transfer")}</SelectItem>
                <SelectItem value="Other">{t("table.types.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t("form.labels.processing")}</Label>
            <Select
              value={formData.processing_type || "Offline"}
              onValueChange={(v) => onChange("processing_type", v)}
              disabled={isView}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Offline">Offline</SelectItem>
                <SelectItem value="Gateway">Gateway</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2 md:col-span-1">
            <Label>{t("form.labels.visibility")}</Label>
            <Select
              value={formData.visibility || "All"}
              onValueChange={(v) => onChange("visibility", v)}
              disabled={isView}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div className="rounded-lg border bg-muted/40 p-4 md:p-5 space-y-4">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          {t("form.sections.config_details")} ({
             showPagoMovil ? "Pago Móvil" : showZelle ? "Zelle" : showBankTransfer ? "Bank Transfer" : formData.type
          })
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {showPagoMovil && (
            <>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">{t("form.config.phone")}</Label>
                <Input 
                  placeholder="04141234567"
                  value={(formData.configuration as PagoMovilConfig).phone || ""} 
                  onChange={(e) => updateConfig("phone", e.target.value)} 
                  disabled={isView}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">{t("form.config.bank_id")}</Label>
                <Input 
                  placeholder="0102"
                  value={(formData.configuration as PagoMovilConfig).bank_id || ""} 
                  onChange={(e) => updateConfig("bank_id", e.target.value)} 
                  disabled={isView}
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="text-xs font-semibold">{t("form.config.tax_id")}</Label>
                <Input 
                  placeholder="V12345678"
                  value={(formData.configuration as PagoMovilConfig).tax_id || ""} 
                  onChange={(e) => updateConfig("tax_id", e.target.value)} 
                  disabled={isView}
                />
              </div>
            </>
          )}

          {showZelle && (
            <div className="grid gap-2 md:col-span-2">
              <Label className="text-xs font-semibold">{t("form.config.email")}</Label>
              <Input 
                type="email"
                placeholder="usuario@email.com"
                value={(formData.configuration as ZelleConfig).email || ""} 
                onChange={(e) => updateConfig("email", e.target.value)} 
                disabled={isView}
              />
            </div>
          )}

          {showBankTransfer && (
            <>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">{t("form.config.bank_name")}</Label>
                <Input 
                  placeholder="Banesco"
                  value={(formData.configuration as BankTransferConfig).bank_name || ""} 
                  onChange={(e) => updateConfig("bank_name", e.target.value)} 
                  disabled={isView}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">{t("form.config.account_number")}</Label>
                <Input 
                  placeholder="0134..."
                  value={(formData.configuration as BankTransferConfig).account_number || ""} 
                  onChange={(e) => updateConfig("account_number", e.target.value)} 
                  disabled={isView}
                />
              </div>
            </>
          )}

          {(formData.type === "Cash" || formData.type === "Card") && (
            <p className="text-sm text-muted-foreground italic md:col-span-2 py-2">
              {t("form.messages.no_config_required")}
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>{t("form.labels.surcharge_fixed")}</Label>
          <Input 
            type="number" 
            value={formData.surcharge_fixed ?? 0} 
            onChange={(e) => onChange("surcharge_fixed", Number(e.target.value))} 
            disabled={isView}
          />
        </div>
        <div className="grid gap-2">
          <Label>{t("form.labels.surcharge_percentage")}</Label>
          <Input 
            type="number" 
            value={formData.surcharge_percentage ?? 0} 
            onChange={(e) => onChange("surcharge_percentage", Number(e.target.value))} 
            disabled={isView}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>{t("form.labels.description")}</Label>
        <Textarea
          placeholder={t("form.placeholders.description")}
          value={formData.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          disabled={isView}
          className="resize-none"
        />
      </div>
    </div>
  );
}