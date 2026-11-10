import { RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mainCurrencies } from "@vitalfit/sdk";

interface PaymentSummarySectionProps {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  selectedPaymentMethodId: string;
  setSelectedPaymentMethodId: (id: string) => void;
  paymentMethods: any[];
  loadingMethods: boolean;
  exchangeRate: number | null;
  loadingRate: boolean;
  subtotal: number;
  taxAmount: number;
  totalUSD: number;
  totalConverted: number;
  currencyInfo: any;
  t: (key: string) => string;
}

const PaymentSummarySection = ({
  displayCurrency,
  setDisplayCurrency,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
  paymentMethods,
  loadingMethods,
  exchangeRate,
  loadingRate,
  subtotal,
  taxAmount,
  totalUSD,
  totalConverted,
  currencyInfo,
  t,
}: PaymentSummarySectionProps) => {
  return (
    <Card className="shadow-sm border-muted/60 overflow-hidden bg-card">
      <CardContent className="p-6">
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DE PAGO */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* MONEDA */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t("form.currency")}
                </label>
                <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                  <SelectTrigger className="bg-muted/40 border-none font-semibold focus:ring-1 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCurrencies.map((c: any) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MÉTODO DE PAGO */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t("form.paymentMethod")}
                </label>
                <Select 
                  value={selectedPaymentMethodId} 
                  onValueChange={setSelectedPaymentMethodId} 
                  disabled={loadingMethods}
                >
                  <SelectTrigger className="bg-muted/40 border-none font-semibold focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder={t("form.choose")} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m: any) => (
                      <SelectItem key={m.method_id || m.payment_method_id} value={m.method_id || m.payment_method_id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TIPO DE CAMBIO (Contextual) */}
            {displayCurrency !== "USD" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 text-primary border border-primary/10 animate-in fade-in slide-in-from-left-2">
                <RefreshCcw className={`h-4 w-4 ${loadingRate ? "animate-spin" : ""}`} />
                <span className="text-xs font-bold italic">
                  1 USD = {exchangeRate?.toFixed(4) || "..."} {displayCurrency}
                </span>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: DESGLOSE FINANCIERO */}
          <div className="space-y-4 text-right flex flex-col justify-end">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">{t("form.subtotal")}</span>
                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">{t("form.taxes")}</span>
                <span className="font-medium text-destructive">
                  +{taxAmount.toFixed(2)}
                </span>
              </div>
              
              <Separator className="my-3 opacity-60" />
              
              <div className="pt-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">
                  {t("form.totalCharge")}
                </span>
                <div className="text-5xl font-black tracking-tighter text-foreground tabular-nums">
                  ${totalUSD.toFixed(2)}
                </div>
                
                {/* EQUIVALENCIA EN MONEDA LOCAL */}
                {displayCurrency !== "USD" && !loadingRate && (
                  <div className="text-sm font-bold text-primary mt-1 flex items-center justify-end gap-1.5 animate-in fade-in duration-500">
                    <span className="text-[10px] uppercase opacity-70 font-bold">{t("form.equivalentTo")}</span>
                    <span className="tracking-tight">
                      {currencyInfo?.symbol} {totalConverted.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })} {displayCurrency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSummarySection;