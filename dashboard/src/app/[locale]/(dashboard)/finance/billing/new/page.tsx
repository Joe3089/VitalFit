"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranches } from "@/hooks/branches/useBranches";
import { useUserByEmail } from "@/hooks/users/useUserByEmail";
import { usePackages } from "@/hooks/packages/usePackages";
import { useMembershipTypes } from "@/hooks/membership/useMembershipTypes";
import { useTaxRate } from "@/hooks/billing/useTaxRate";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { CreateInvoiceForm } from "@/components/modules/billing/CreateInvoiceForm";
import { useRouter } from "@/i18n/navigation";
import { useBranchPaymentMethods } from "@/hooks/branches/useBranchPaymentMethods";
import { usePaymentMethods } from "@/hooks/payment-methods/usePaymentMethods";
import { useBranchServices } from "@/hooks/branches/useBranchServices"; 
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function StaffNewInvoicePage() {
  const t = useTranslations("finance.Billing");
  const router = useRouter();
  const { token, user: authUser } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    authUser?.activeBranch?.id
  );


  const [emailToSearch, setEmailToSearch] = useState<string | null>(null);
  const {  services, loading: loadingServices } = useBranchServices(selectedBranchId, token);
  const branchData = useBranchPaymentMethods(selectedBranchId ?? "", token ?? "");
  const globalData = usePaymentMethods(selectedBranchId ? null : (token ?? ""));
  const { taxRate, isLoading: loadingTax } = useTaxRate(selectedBranchId, token ?? "");

  const paymentMethods = selectedBranchId ? branchData.methods : globalData.methods;
  const loadingMethods = selectedBranchId ? branchData.loading : globalData.loading;

  const { userData, isLoading: searchingUser, clearUser } = useUserByEmail(
    token,
    emailToSearch
  );



  const { branches } = useBranches({ token: token ?? "", limit: 100 });
  const { memberships, loading: loadingMems } = useMembershipTypes({ token: token ?? "", initialLimit: 50 });
  const { packageData: packages, isLoading: loadingPkgs } = usePackages(token ?? "", 1, 100, { search: "" });

  const handleSearchUser = (email: string) => {
    if (email.includes("@")) {
      setEmailToSearch(email);
    } else {
      toast.error(t("newInvoice.messages.invalidEmail")); 
    }
  };

  const handleCreateInvoice = async (
    targetBranchId: string,
    items: any[],
    paymentMethodId: string,
    totalUSD: number,
    amountPaid: number,
    currencyPaid: string
  ) => {

    const userId = userData?.data?.user_id || userData?.user_id;

    if (!token || !userId) {
      return toast.error(t("newInvoice.messages.selectUserError"));
    }

    setIsSubmitting(true);
    let createdInvoiceId = null;

    try {

      const invoicePayload = {
        branch_id: targetBranchId,
        user_id: userId,
        items: items.map((item) => ({
          item_id: item.item_id,
          item_type: item.item_type, 
          quantity: Number(item.quantity),
        })),
      };

      const invoiceRes = await api.billing.createInvoice(invoicePayload, token);
      createdInvoiceId = invoiceRes.invoice_id;

      const paymentPayload = {
        invoice_id: createdInvoiceId,
        amount_paid: amountPaid,
        currency_paid: currencyPaid,
        payment_method_id: paymentMethodId,
        transaction_id: `STAFF-${authUser?.user_id || "UID"}-${Date.now()}`,
        receipt_url: "",
      };

      await api.billing.AddPaymentToInvoice(paymentPayload, token);

      toast.success(t("newInvoice.messages.success", { currency: currencyPaid }));
      router.push("/finance/billing");
    } catch (error: any) {
      console.error("Error creating invoice/payment:", error);

      if (createdInvoiceId) {
        toast.error(t("newInvoice.messages.partialError"));

      } else {
        toast.error(t("newInvoice.messages.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title={t("newInvoice.title")} 
        subtitle={t("newInvoice.subtitle")} 
      />

      <CreateInvoiceForm
        token={token}
        branches={branches}
        memberships={memberships}
        packages={packages || []}
        services={services || []}
        loadingServices={loadingServices}
        userData={userData} 
        paymentMethods={paymentMethods || []}
        loadingMethods={loadingMethods}
        loadingMems={loadingMems}
        loadingPkgs={loadingPkgs}
        loadingTax={loadingTax}
        taxRate={taxRate}
        isSubmitting={isSubmitting}
        isSearchingUser={searchingUser}
        onSearchUser={handleSearchUser}
        onClearUser={() => {
          setEmailToSearch(null);
          clearUser();
        }}
        onSubmit={handleCreateInvoice}
        onCancel={() => router.back()}
        canSelectBranch={!authUser?.activeBranch?.id}
        initialBranchId={selectedBranchId}
        onBranchChange={(id: string) => setSelectedBranchId(id)}
      />
    </div>
  );
}