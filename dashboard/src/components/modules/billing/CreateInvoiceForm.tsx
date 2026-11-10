"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Save,
  Loader2,
  Building2,
  User,
  Search,
  Mail,
  IdCard,
  RefreshCcw,
  X,
  Zap,
  Trash2,
  ReceiptText,

} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import useGetBranch from "@/hooks/branches/useGetBranch";
import { useExchangeRate } from "@/hooks/billing/useExchangeRate";
import { mainCurrencies } from "@vitalfit/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InvoiceItem {
  item_id: string;
  item_type: string;
  quantity: number;
}

interface CreateInvoiceFormProps {
  token: string | null;
  branches: any[];
  memberships: any[];
  packages: any[];
  services: any[];
  userData: any | null;
  paymentMethods: any[];
  loadingMethods: boolean;
  loadingMems: boolean;
  loadingPkgs: boolean;
  loadingServices: boolean;
  loadingTax?: boolean;
  taxRate?: { rate: number; name: string } | null;
  isSubmitting: boolean;
  isSearchingUser: boolean;
  canSelectBranch: boolean;
  onSearchUser: (email: string) => void;
  onClearUser: () => void;
  onBranchChange?: (branchId: string) => void;
  onSubmit: (
    branchId: string,
    items: InvoiceItem[],
    paymentMethodId: string,
    totalUSD: number,
    amountPaid: number,
    currencyPaid: string
  ) => void;
  onCancel: () => void;
  initialBranchId?: string;
}

export function CreateInvoiceForm({
  token,
  branches,
  memberships,
  packages,
  services,
  userData,
  paymentMethods = [],
  loadingMethods,
  loadingServices,
  loadingTax,
  taxRate,
  isSubmitting,
  isSearchingUser,
  canSelectBranch,
  onSearchUser,
  onClearUser,
  onBranchChange,
  onSubmit,
  onCancel,
  initialBranchId,
}: CreateInvoiceFormProps) {
  const t = useTranslations("finance.Billing");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || "");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [items, setItems] = useState<InvoiceItem[]>([
    { item_id: "", item_type: "membership", quantity: 1 },
  ]);

  const { rate: exchangeRate, isLoading: loadingRate } = useExchangeRate(token, displayCurrency);
  const { branchDetail, loading: loadingBranch } = useGetBranch(!canSelectBranch ? initialBranchId : undefined, token);

  const client = userData?.data || userData;
  const hasActiveMembership = client?.has_active_membership === true;

  const getItemPrice = (item: InvoiceItem) => {
    if (!item.item_id) {
      return 0;
    }
    
    if (item.item_type === "membership") {
      const prod = memberships.find((m: any) => m.membership_type_id === item.item_id);
      return prod?.price || 0;
    } 
    
    if (item.item_type === "package") {
      const prod = packages.find((p: any) => p.packageId === item.item_id);
      return prod?.price || 0;
    } 
    
    if (item.item_type === "service") {
      const prod = services.find((s: any) => s.service_id === item.item_id);
      return hasActiveMembership ? (prod?.price_for_member || 0) : (prod?.price_for_non_member || 0);
    }
    
    return 0;
  };

  const { subtotal, taxAmount, totalUSD } = useMemo(() => {
    const sub = items.reduce((acc, item) => {
      const price = getItemPrice(item);
      return acc + price * item.quantity;
    }, 0);

    const tax = sub * (taxRate?.rate || 0);
    return { subtotal: sub, taxAmount: tax, totalUSD: sub + tax };
  }, [items, memberships, packages, services, taxRate, hasActiveMembership]);

  const totalConverted = useMemo(() => {
    if (displayCurrency === "USD") {
      return totalUSD;
    }
    return Math.round(totalUSD * (exchangeRate || 0) * 100) / 100;
  }, [totalUSD, exchangeRate, displayCurrency]);

  const currencyInfo = useMemo(() => mainCurrencies.find((c: any) => c.code === displayCurrency), [displayCurrency]);

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const next = [...items];
    const currentItem = next[index];
    const newType = updates.item_type || currentItem.item_type;
    let newQuantity = updates.quantity !== undefined ? updates.quantity : currentItem.quantity;

    if (newType === "membership") {
      newQuantity = Math.min(Math.max(newQuantity, 1), 3);
    }

    next[index] = { ...currentItem, ...updates, quantity: newQuantity };
    setItems(next);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-6">

        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {t("form.branch")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canSelectBranch ? (
              <Select value={selectedBranchId} onValueChange={(id) => { setSelectedBranchId(id); onBranchChange?.(id); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("form.selectBranch")} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {branches.map((b: any) => (
                    <SelectItem key={b.branch_id} value={b.branch_id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-dashed">
                <span className="text-sm font-medium">{loadingBranch ? <Loader2 className="h-3 w-3 animate-spin" /> : branchDetail?.name}</span>
                <Badge variant="secondary" className="text-[10px]">Sede Activa</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {t("form.client")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!client ? (
              <div className="flex gap-2">
                <Input
                  placeholder={t("form.emailPlaceholder")}
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onSearchUser(emailSearch))}
                />
                <Button variant="secondary" onClick={() => onSearchUser(emailSearch)} disabled={isSearchingUser || !emailSearch}>
                  {isSearchingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="relative rounded-xl border bg-card p-4 transition-all hover:shadow-md">
                <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full border bg-background shadow-sm hover:bg-destructive hover:text-white" onClick={onClearUser}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={client.profile_picture_url} />
                    <AvatarFallback className="font-bold bg-primary/5 text-primary">
                      {client.first_name?.[0]}{client.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold leading-none">{client.first_name} {client.last_name}</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{client.role_name || "Cliente"}</Badge>
                      {hasActiveMembership && (
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] px-1.5 h-4 border-none text-white">
                          <Zap className="h-2.5 w-2.5 mr-1 fill-current" /> {t("form.memberPrice")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 pt-3 border-t border-muted text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {client.email}</div>
                  <div className="flex items-center gap-2"><IdCard className="h-3 w-3" /> {client.identity_document || "Sin Documento"}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-6">

        <Card className="shadow-sm border-muted/60 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
              {t("form.concepts")}
            </CardTitle>
            <Button size="sm" variant="outline" className="h-8 text-xs bg-background" onClick={() => setItems([...items, { item_id: "", item_type: "membership", quantity: 1 }])}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> {t("form.addItem")}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-muted">
              {items.map((item, index) => {
                const unitPrice = getItemPrice(item);
                return (
                  <div key={index} className="group flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors">
                    <div className="grid grid-cols-12 gap-3 flex-1 items-center">

                      <div className="col-span-3">
                        <Select value={item.item_type} onValueChange={(v) => updateItem(index, { item_type: v, item_id: "" })}>
                          <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="membership">{t("form.membership")}</SelectItem>
                            <SelectItem value="package">{t("form.package")}</SelectItem>
                            <SelectItem value="service">{t("form.service")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-5">
                        <Select value={item.item_id} onValueChange={(v) => updateItem(index, { item_id: v })} disabled={item.item_type === "service" && loadingServices}>
                          <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder={t("form.selectProduct")} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            {item.item_type === "membership" && memberships.map((m: any) => <SelectItem key={m.membership_type_id} value={m.membership_type_id}>{m.name}</SelectItem>)}
                            {item.item_type === "package" && packages.map((p: any) => <SelectItem key={p.packageId} value={p.packageId}>{p.name}</SelectItem>)}
                            {item.item_type === "service" && services.map((s: any) => <SelectItem key={s.service_id} value={s.service_id}>{s.service_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none mb-1">Precio</span>
                          <span className="text-xs font-black tabular-nums">
                            ${unitPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          max={item.item_type === "membership" ? 3 : undefined}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
                          className="h-9 text-center font-semibold"
                        />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => setItems(items.filter((_, i) => i !== index))} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60">
          <CardContent className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">{t("form.currency")}</label>
                    <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                      <SelectTrigger className="bg-muted/30 border-none font-semibold"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {mainCurrencies.map((c: any) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">{t("form.paymentMethod")}</label>
                    <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId} disabled={loadingMethods}>
                      <SelectTrigger className="bg-muted/30 border-none font-semibold"><SelectValue placeholder={t("form.choose")} /></SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {paymentMethods.map((m: any) => (
                          <SelectItem key={m.method_id || m.payment_method_id} value={m.method_id || m.payment_method_id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {displayCurrency !== "USD" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 text-primary border border-primary/10">
                    <RefreshCcw className={`h-4 w-4 ${loadingRate ? "animate-spin" : ""}`} />
                    <span className="text-xs font-bold italic">1 USD = {exchangeRate?.toFixed(4)} {displayCurrency}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-right">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("form.subtotal")}</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{taxRate?.name || t("form.taxes")}</span>
                    <span className="font-medium text-destructive">+{taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-sm font-bold uppercase tracking-tighter">{t("form.totalCharge")}</span>
                    <div className="text-right">
                      <div className="text-4xl font-black tracking-tighter text-foreground tabular-nums">${totalUSD.toFixed(2)}</div>
                      {displayCurrency !== "USD" && !loadingRate && (
                        <div className="text-sm font-bold text-primary">≈ {totalConverted.toLocaleString()} {displayCurrency}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-muted">
              <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} className="font-semibold">{t("form.cancel")}</Button>
              <Button
                size="lg"
                disabled={isSubmitting || !client || totalUSD === 0 || (loadingRate && displayCurrency !== "USD") || !selectedPaymentMethodId || items.some(i => !i.item_id)}
                onClick={() => onSubmit(selectedBranchId, items, selectedPaymentMethodId, totalUSD, totalConverted, displayCurrency)}
                className="px-8 font-bold shadow-md shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {t("form.finishSale")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}