"use client";

import { useTranslations } from "next-intl";
import { ReceiptText, ChevronRight, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mainCurrencies,
  PublicMembershipResponse,
  ServicePublicItem,
} from "@vitalfit/sdk";
import { cn } from "@/lib/utils";
import { PackageOption } from "./PackageCarousel";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface Props {
  membership?: PublicMembershipResponse;
  selectedPackages: PackageOption[];
  selectedServices?: ServicePublicItem[];
  availableServices?: ServicePublicItem[];
  prices: {
    subtotalBase: number;
    taxAmountBase: number;
    taxPercentage: number;
    baseTotal: number;
    displayTotal: number;
    displaySymbol: string;
  };
  step: number;
  currency: string;
  isMember: boolean;
  setCurrency: (value: string) => void;
  onNext: () => void;
  onProcess: () => void;
  isProcessing: boolean;
  hasInvoice: boolean;
  validation: {
    hasBranch: boolean;
    missingBranch: boolean;
    canProcess: boolean;
  };
}

export const OrderSummary = ({
  membership,
  selectedPackages = [],
  selectedServices = [],
  availableServices = [],
  prices,
  currency,
  isMember,
  setCurrency,
  onNext,
  onProcess,
  step,
  isProcessing,
  hasInvoice,
  validation,
}: Props) => {
  const t = useTranslations("Checkout.OrderSummary");

  const formatPrice = (price: number = 0) =>
    price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isStepOne = step === 1;
  const isRef = currency !== "USD";

  const handleMainAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isStepOne && !hasInvoice) {
      if (!validation.canProcess) {
        return;
      }
      onProcess();
    } else {
      onNext();
    }
  };

  return (
    <Card className="sticky top-6 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
      <CardHeader className="py-6 px-8 bg-slate-900 border-b border-slate-800 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl text-white">
            <ReceiptText size={18} />
          </div>
          <CardTitle className="text-sm font-black uppercase tracking-widest text-white italic">
            {t("title")}
          </CardTitle>
        </div>

        <Select
          value={currency}
          onValueChange={setCurrency}
          disabled={hasInvoice || isProcessing}
        >
          <SelectTrigger className="w-[90px] h-9 text-xs font-black bg-white/10 border-none text-white rounded-xl focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl font-bold">
            {mainCurrencies.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-xs">
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="space-y-4">
          {membership && (
            <div className="flex justify-between items-start animate-in fade-in">
              <div className="space-y-1">
                <p className="text-base font-black text-slate-900 leading-tight">
                  {membership.name}
                </p>
                <p className="text-[10px] uppercase font-black tracking-widest text-orange-500">
                  {t("baseMembership")}
                </p>
              </div>
              <span className="text-base font-black text-slate-900 tabular-nums">
                {prices.displaySymbol}
                {formatPrice(
                  isRef
                    ? Number(membership.ref_price)
                    : Number(membership.price),
                )}
              </span>
            </div>
          )}

          {selectedServices.length > 0 && (
            <div
              className={cn(
                "space-y-3 pt-3",
                membership && "border-t border-slate-100",
              )}
            >
              {selectedServices.map((service) => {
                const freshData = availableServices.find(
                  (s) => s.service_id === service.service_id,
                );
                const target = freshData || service;

                const servicePrice = isMember
                  ? isRef
                    ? target.ref_lowest_price_member
                    : target.lowest_price_member
                  : isRef
                    ? target.ref_lowest_price_no_member
                    : target.lowest_price_no_member;

                const isFree = Number(servicePrice) === 0;

                return (
                  <div
                    key={service.service_id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-bold text-slate-600 flex items-center gap-2 italic">
                      <Plus size={12} className="text-orange-500" />
                      {service.name}
                    </span>
                    <span
                      className={cn(
                        "font-black tabular-nums",
                        isFree ? "text-green-600" : "text-slate-900",
                      )}
                    >
                      {isFree
                        ? t("free")
                        : `${prices.displaySymbol}${formatPrice(Number(servicePrice))}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
            <span>{t("subtotal")}</span>
            <span className="tabular-nums font-black text-slate-600">
              {prices.displaySymbol}{" "}
              {formatPrice(
                prices.displayTotal / (1 + prices.taxPercentage / 100),
              )}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-400">
            <span>{t("taxLabel", { percent: prices.taxPercentage })}</span>
            <span className="tabular-nums font-black text-slate-600">
              {prices.displaySymbol}{" "}
              {formatPrice(
                prices.displayTotal -
                  prices.displayTotal / (1 + prices.taxPercentage / 100),
              )}
            </span>
          </div>

          <div className="pt-4 flex justify-between items-baseline">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t("totalLabel")}
            </span>
            <div className="text-right">
              <div className="text-4xl font-black text-orange-600 tracking-tighter tabular-nums leading-none">
                <span className="text-sm font-bold text-slate-400 mr-1 align-top">
                  {prices.displaySymbol}
                </span>
                {formatPrice(prices.displayTotal)}
              </div>
              {isRef && (
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">
                  {t("equivalent")}{" "}
                  <span className="text-slate-900">
                    ${formatPrice(prices.baseTotal)} USD
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-8 pt-0">
        <Button
          size="lg"
          onClick={handleMainAction}
          disabled={isProcessing || !validation.canProcess}
          className={cn(
            "w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
            validation.canProcess
              ? "bg-orange-600 hover:bg-orange-700 text-white shadow-xl"
              : "bg-slate-100 text-slate-300",
          )}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <div className="flex items-center gap-2">
              {isStepOne && !hasInvoice
                ? t("btnConfirmOrder")
                : t("btnMakePayment")}
              <ChevronRight size={20} />
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
