"use client";

import { Loader2 } from "lucide-react";
import { useCheckoutLogic } from "@/hooks/useCheckoutLogic";
import { cn } from "@/lib/utils";
import { CheckoutStepper } from "@/components/features/checkout/CheckoutStepper";
import { StepSelectPlan } from "@/components/features/checkout/StepSelectPlan";
import { StepPayment } from "@/components/features/checkout/StepPayment";
import { StepSuccess } from "@/components/features/checkout/StepSuccess";
import { OrderSummary } from "@/components/features/checkout/OrderSummary";
import { useTranslations } from "next-intl";

export default function CheckoutPage() {
  const t = useTranslations("Checkout.Page");

  const {
    selection,
    actions,
    token,
    branches,
    normalizedPackages,
    currentMembership,
    memberships,
    availableServices,
    hasMore,
    isMember,
    prices,
    loading,
    handlers,
    isCreatingInvoice,
  } = useCheckoutLogic();

  if (loading.loadingB || loading.loadingM) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {t("initialLoading")}
        </p>
      </div>
    );
  }

  const hasItemsInCart =
    !!currentMembership ||
    selection.packages.length > 0 ||
    selection.services.length > 0;

  return (
    <div className="min-h-screen pb-24 pt-10 font-sans antialiased text-slate-900 bg-slate-50/30">
      <main
        className={cn(
          "mx-auto px-4 transition-all duration-700 ease-in-out",
          selection.step === 1 ? "max-w-7xl" : "max-w-3xl",
        )}
      >
        {selection.step < 3 && (
          <div className="mb-14 text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight italic uppercase">
              {t("title")}
            </h1>
            <div className="mt-10 max-w-2xl mx-auto">
              <CheckoutStepper currentStep={selection.step} />
            </div>
          </div>
        )}

        <div
          className={cn(
            "grid gap-12",
            selection.step === 1
              ? "grid-cols-1 lg:grid-cols-12"
              : "grid-cols-1",
          )}
        >
          <div
            className={cn(selection.step === 1 ? "lg:col-span-8" : "w-full")}
          >
            {selection.step === 1 && (
              <StepSelectPlan
                data={currentMembership || null}
                allMemberships={memberships}
                packages={normalizedPackages}
                selectedPackages={selection.packages}
                togglePackage={actions.togglePackage}
                services={availableServices || []}
                selectedServices={selection.services}
                toggleService={actions.toggleService}
                isLoadingServices={loading.loadingS}
                hasMoreServices={hasMore}
                isMember={isMember}
                onLoadMoreServices={handlers.handleLoadMoreServices}
                currencySymbol={prices.displaySymbol}
                onRemoveMembership={() => actions.setMembershipId(null)}
                branches={branches}
                selectedBranch={selection.branchId}
                onSelectBranch={actions.setBranch}
                invoiceData={selection.invoice}
                onSelectMembership={actions.setMembershipId}
              />
            )}

            {selection.step === 2 && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <StepPayment
                  invoiceData={selection.invoice}
                  selectedMethod={selection.methodId}
                  onSelectMethod={actions.setMethod}
                  onSelectCurrency={actions.setCurrency}
                  methods={selection.methods}
                  token={token || ""}
                  totalPrices={prices}
                  onSuccess={actions.next}
                  branchId={selection.branchId}
                />
              </div>
            )}

            {selection.step === 3 && (
              <StepSuccess invoiceId={selection.invoice?.invoice_id || ""} />
            )}
          </div>

          {selection.step === 1 && (
            <div className="lg:col-span-4 sticky top-10 h-fit animate-in fade-in slide-in-from-right-4 duration-700">
              <OrderSummary
                membership={currentMembership || undefined}
                selectedPackages={selection.packages}
                selectedServices={selection.services}
                availableServices={availableServices}
                isMember={isMember}
                prices={prices}
                step={selection.step}
                currency={selection.currency}
                setCurrency={actions.setCurrency}
                onNext={actions.next}
                onProcess={handlers.handleProcessCheckout}
                isProcessing={isCreatingInvoice}
                hasInvoice={!!selection.invoice}
                validation={{
                  hasBranch: !!selection.branchId,
                  missingBranch: !selection.branchId,
                  canProcess: !!selection.branchId && hasItemsInCart,
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
