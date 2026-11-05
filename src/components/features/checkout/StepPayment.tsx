"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Store,
  UploadCloud,
  Loader2,
  X,
  FileText,
  Info,
  ArrowRightLeft,
  CheckCircle2,
  Tag,
  CreditCard,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  mainCurrencies,
  InvoiceDetail,
  BranchPaymentMethodInfo,
  CreateCheckoutPayload,
} from "@vitalfit/sdk";
import { useInvoiceConfirmation } from "@/hooks/useInvoiceConfirmation";
import { usePaymentMethodDetail } from "@/hooks/usePaymentMethodDetail";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";
import { trackFunnel } from "@/lib/tracking";

interface Props {
  selectedMethod: string;
  onSelectMethod: (value: string) => void;
  onSelectCurrency: (value: string) => void;
  methods: BranchPaymentMethodInfo[];
  invoiceData: InvoiceDetail | null;
  token: string;
  onSuccess: () => void;
  branchId: string;
  totalPrices: {
    subtotalBase: number;
    taxAmountBase: number;
    baseTotal: number;
    displayTotal: number;
    taxPercentage: number;
    displaySymbol: string;
  };
}

export const StepPayment = ({
  invoiceData,
  selectedMethod,
  onSelectMethod,
  onSelectCurrency,
  methods,
  token,
  onSuccess,
  totalPrices,
}: Props) => {
  const t = useTranslations("Checkout.StepPayment");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isChangingCurrency, setIsChangingCurrency] = useState(false);

  const {
    currencyMode,
    setCurrencyMode,
    formData,
    setFormData,
    status,
    uploadingFile,
    handleFileUpload,
    submitPayment,
  } = useInvoiceConfirmation({
    invoiceId: invoiceData?.invoice_id || "",
    methodId: selectedMethod,
    token,
    onSuccess,
  });

  const { method: methodDetail, loading: loadingMethod } =
    usePaymentMethodDetail(selectedMethod, token);

  useEffect(() => {
    if (totalPrices.displaySymbol) {
      const currentCurrency = mainCurrencies.find(
        (c) => c.symbol === totalPrices.displaySymbol,
      );
      if (currentCurrency && currentCurrency.code !== currencyMode) {
        setCurrencyMode(currentCurrency.code);
      }

      setIsChangingCurrency(false);
    }
  }, [
    totalPrices.displaySymbol,
    totalPrices.displayTotal,
    currencyMode,
    setCurrencyMode,
  ]);

  useEffect(() => {
    const total = Number(totalPrices.displayTotal);
    if (!isNaN(total) && total > 0) {
      setFormData((prev: any) => ({
        ...prev,
        amount: Number(total.toFixed(2)),
      }));
    }
  }, [totalPrices.displayTotal, setFormData]);

  const isStripeMethod = useMemo(() => {
    if (!selectedMethod || !methodDetail) {
      return false;
    }
    return (
      methodDetail.type === "Card" &&
      (methodDetail as any).processing_type === "Gateway"
    );
  }, [selectedMethod, methodDetail]);

  const handleStripeRedirect = async () => {
    setIsRedirecting(true);
    try {
      const payload: CreateCheckoutPayload = {
        invoice_id: invoiceData?.invoice_id || "",
      };
      const result = await api.billing.createCheckoutSession(payload, token);
      if (result?.url) {
        trackFunnel("purchase");
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error SDK Stripe:", error);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleMainAction = () => {
    if (formData.amount <= 0 && !isStripeMethod && isConfirmed) {
      console.error("Monto inválido para envío");
      return;
    }

    if (isStripeMethod) {
      handleStripeRedirect();
    } else if (!isConfirmed) {
      setIsConfirmed(true);
    } else {
      submitPayment();
    }
  };

  const handleCurrencyChange = (val: string) => {
    setIsChangingCurrency(true); // Activa estado de carga visual
    setCurrencyMode(val);
    if (onSelectCurrency) {
      onSelectCurrency(val);
    }
  };

  const formatAmount = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isSubmitDisabled = isStripeMethod
    ? isRedirecting || loadingMethod || isChangingCurrency
    : isConfirmed
      ? !formData.reference ||
        status.loading ||
        uploadingFile ||
        formData.amount <= 0 ||
        isChangingCurrency
      : !selectedMethod || loadingMethod;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="py-6 bg-slate-900">
          <CardTitle className="text-sm font-black text-white italic">
            {t("cardTitle")}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Método de Pago
            </Label>
            <Select
              value={selectedMethod}
              onValueChange={(v) => {
                onSelectMethod(v);
                setIsConfirmed(false);
              }}
            >
              <SelectTrigger className="h-14 rounded-3xl bg-slate-50/50 border-slate-100 font-bold text-slate-700">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl font-bold">
                {methods.map((m) => (
                  <SelectItem key={m.method_id} value={String(m.method_id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(isConfirmed || isStripeMethod) && !loadingMethod && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div
                className={cn(
                  "p-6 border border-slate-100 bg-slate-50/30 rounded-[2rem] transition-all duration-300",
                  isChangingCurrency ? "opacity-50 grayscale" : "opacity-100",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Moneda
                    </p>
                    <Select
                      value={currencyMode}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger className="w-[110px] h-11 bg-white font-black rounded-2xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl font-black">
                        {mainCurrencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-right relative">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                      Monto a Reportar
                    </p>
                    {isChangingCurrency ? (
                      <div className="h-10 flex items-center justify-end">
                        <Loader2
                          className="animate-spin text-orange-500"
                          size={20}
                        />
                      </div>
                    ) : (
                      <div className="text-4xl font-black text-orange-600 tabular-nums leading-none">
                        <span className="text-sm font-bold text-slate-400 mr-1.5 align-top">
                          {totalPrices.displaySymbol}
                        </span>
                        {formatAmount(totalPrices.displayTotal)}
                      </div>
                    )}
                  </div>
                </div>

                {currencyMode !== "USD" && !isChangingCurrency && (
                  <div className="mt-4 flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl animate-in zoom-in-95">
                    <ArrowRightLeft size={14} className="text-orange-500" />
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">
                        Equivalencia
                      </p>
                      <p className="text-xs font-black text-slate-700">
                        $ {formatAmount(totalPrices.baseTotal)} USD
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {!isStripeMethod && (
                <div className="space-y-6 pt-4 border-t border-slate-100 animate-in zoom-in-95">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Referencia *
                    </Label>
                    <Input
                      value={formData.reference}
                      onChange={(e) =>
                        setFormData({ ...formData, reference: e.target.value })
                      }
                      className="h-14 rounded-3xl font-black border-slate-100 bg-slate-50/50"
                      placeholder="Ingresa el número de confirmación"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Comprobante
                    </Label>
                    {!formData.filePath ? (
                      <div className="relative h-32 border-2 border-dashed border-slate-200 bg-slate-50/30 hover:bg-slate-50 flex flex-col items-center justify-center rounded-[2rem] transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleFileUpload(e.target.files[0])
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <UploadCloud className="text-orange-500 w-6 h-6 mb-2" />
                        <span className="text-[9px] font-black uppercase text-slate-500">
                          {uploadingFile ? "Subiendo..." : "Subir comprobante"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-[2rem]">
                        <div className="flex items-center gap-3">
                          <FileText className="text-orange-500" size={18} />
                          <span className="text-xs font-black text-orange-900 truncate max-w-[150px]">
                            Recibo Cargado
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl"
                          onClick={() =>
                            setFormData({ ...formData, filePath: "" })
                          }
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-8 bg-slate-50/50 border-t border-slate-100">
          <Button
            size="lg"
            className={cn(
              "w-full h-16 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95",
              isSubmitDisabled
                ? "bg-slate-200 text-slate-400"
                : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20",
            )}
            disabled={isSubmitDisabled}
            onClick={handleMainAction}
          >
            {status.loading || isRedirecting ? (
              <Loader2 className="animate-spin" />
            ) : isStripeMethod ? (
              isConfirmed ? (
                "Pagar con Tarjeta"
              ) : (
                "Confirmar Selección"
              )
            ) : !isConfirmed ? (
              "Confirmar Método"
            ) : (
              t("submitBtn")
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
