"use client";

import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/sdk-config";
import { trackFunnel } from "@/lib/tracking";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/context/AuthContext";
import { useTax } from "@/hooks/useTax";
import { usePublicMemberships } from "@/hooks/usePublicMemberships";
import { usePublicPackages } from "@/hooks/usePublicPackages";
import { useBranches } from "@/hooks/useBranches";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ServicePublicItem, mainCurrencies } from "@vitalfit/sdk";
import { useBranchServices } from "@/hooks/useBranchServices";

const parsePrice = (v: any) =>
  parseFloat(v?.toString().replace(/[^0-9.-]+/g, "") || "0");

const hasActiveMembership = (user: any): boolean => {
  const membership = user?.client_membership;
  if (!membership) {
    return false;
  }
  const isActive = membership.status === "Active";
  const notExpired = new Date(membership.end_date) > new Date();
  return isActive && notExpired;
};

export const useCheckoutLogic = () => {
  const t = useTranslations("Checkout.Notifications");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const { selection, actions } = useCheckout(user?.user_id);

  const isMember = useMemo(() => hasActiveMembership(user), [user]);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const lastFetchRef = useRef<string>("");
  const lastFetchedMethodsBranchId = useRef<string | null>(null);
  const { memberships, loading: loadingM } = usePublicMemberships(
    selection.currency || "USD",
  );
  const { packages: rawPackages, loading: loadingP } = usePublicPackages(
    selection.currency || "USD",
  );
  const { branches, loading: loadingB } = useBranches(token);
  const { taxRate } = useTax(selection.branchId, token);

  const {
    services: rawAvailableServices,
    isLoading: loadingS,
    fetchServices,
    resetServices,
    hasMore,
  } = useBranchServices();

  const availableServices = useMemo(() => {
    if (!isMember) {
      return rawAvailableServices;
    }

    return rawAvailableServices.filter((s) => {
      const priceVal = parsePrice(s.lowest_price_member);
      return priceVal > 0;
    });
  }, [rawAvailableServices, isMember]);

  useEffect(() => {
    if (isMember && selection.services.length > 0) {
      const invalidServices = selection.services.filter((s) => {
        const freshData = rawAvailableServices.find(
          (as) => as.service_id === s.service_id,
        );
        const price = freshData
          ? parsePrice(freshData.lowest_price_member)
          : parsePrice(s.lowest_price_member);
        return price === 0;
      });

      if (invalidServices.length > 0) {
        const validServices = selection.services.filter(
          (s) => !invalidServices.some((is) => is.service_id === s.service_id),
        );

        Promise.resolve().then(() => {
          actions.setServices(validServices);
          toast.info(
            "Se han removido servicios gratuitos de tu carrito por ser miembro.",
          );
        });
      }
    }
  }, [isMember, rawAvailableServices, selection.services, actions]);

  useEffect(() => {
    const branchId = selection.branchId;
    if (
      !branchId ||
      !token ||
      selection.step > 2 ||
      branchId === lastFetchedMethodsBranchId.current
    ) {
      return;
    }

    const fetchMethods = async () => {
      try {
        lastFetchedMethodsBranchId.current = branchId;
        const res = await api.paymentMethod.getBranchPaymentMethods(
          branchId,
          token,
        );
        actions.setMethods(res?.data || res || []);
      } catch (error) {
        lastFetchedMethodsBranchId.current = null;
        actions.setMethods([]);
        toast.error(t("methodsError"), {
          description: t("methodsErrorDetail"),
        });
      }
    };

    fetchMethods();
  }, [selection.branchId, token, selection.step, actions, t]);

  useEffect(() => {
    const branchId = selection.branchId;
    const currency = selection.currency || "USD";
    const fetchKey = `${branchId}-${currency}`;

    if (!branchId || fetchKey === lastFetchRef.current) {
      return;
    }

    lastFetchRef.current = fetchKey;

    const initializeServices = async () => {
      resetServices();
      await fetchServices(branchId, false, currency);
    };

    Promise.resolve().then(() => {
      initializeServices();
    });
  }, [selection.branchId, selection.currency, fetchServices, resetServices]);

  const handleLoadMoreServices = useCallback(() => {
    if (selection.branchId) {
      fetchServices(selection.branchId, true, selection.currency);
    }
  }, [selection.branchId, selection.currency, fetchServices]);

  const normalizedPackages = useMemo(() => {
    if (!rawPackages) {
      return [];
    }
    return rawPackages.map((pkg: any) => ({
      ...pkg,
      packageId: pkg.packageId || pkg.id,
      price: parsePrice(pkg.price),
      ref_price: parsePrice(pkg.ref_price),
    }));
  }, [rawPackages]);

  const currentMembership = useMemo(() => {
    if (!selection.membershipId) {
      return null;
    }
    return memberships?.find(
      (m) => String(m.membership_type_id) === String(selection.membershipId),
    );
  }, [memberships, selection.membershipId]);

  const prices = useMemo(() => {
    const currencyCode = selection.currency || "USD";
    const isRef = currencyCode !== "USD";
    const currentTax = taxRate || 0;

    const membershipUSD = parsePrice(currentMembership?.price);
    const packagesUSD = selection.packages.reduce(
      (acc, p) => acc + parsePrice(p.price),
      0,
    );
    const servicesUSD = selection.services.reduce((acc, s) => {
      const p = isMember ? s.lowest_price_member : s.lowest_price_no_member;
      return acc + parsePrice(p);
    }, 0);

    const subtotalBaseUSD = membershipUSD + packagesUSD + servicesUSD;

    const membershipDisplay = isRef
      ? parsePrice(currentMembership?.ref_price)
      : membershipUSD;

    const packagesDisplay = selection.packages.reduce((acc, p) => {
      const freshPkg = normalizedPackages.find(
        (np) => np.packageId === p.packageId,
      );
      return (
        acc +
        parsePrice(
          isRef
            ? (freshPkg?.ref_price ?? p.ref_price)
            : (freshPkg?.price ?? p.price),
        )
      );
    }, 0);

    const servicesDisplay = selection.services.reduce((acc, s) => {
      const freshService = availableServices.find(
        (as) => as.service_id === s.service_id,
      );
      const target = freshService || s;

      const priceVal = isMember
        ? isRef
          ? target.ref_lowest_price_member
          : target.lowest_price_member
        : isRef
          ? target.ref_lowest_price_no_member
          : target.lowest_price_no_member;

      return acc + parsePrice(priceVal);
    }, 0);

    const subtotalDisplay =
      membershipDisplay + packagesDisplay + servicesDisplay;
    const activeCurrency = mainCurrencies.find((c) => c.code === currencyCode);

    return {
      subtotalBase: subtotalBaseUSD,
      taxAmountBase: subtotalBaseUSD * currentTax,
      baseTotal: subtotalBaseUSD * (1 + currentTax),
      displayTotal: subtotalDisplay * (1 + currentTax),
      displaySymbol: activeCurrency
        ? activeCurrency.symbol
        : isRef
          ? currencyCode
          : "$",
      taxPercentage: currentTax * 100,
    };
  }, [
    currentMembership,
    selection.packages,
    selection.services,
    availableServices,
    normalizedPackages,
    taxRate,
    selection.currency,
    isMember,
  ]);

  const handleProcessCheckout = useCallback(async () => {
    const hasItems =
      !!currentMembership ||
      selection.packages.length > 0 ||
      selection.services.length > 0;
    if (!selection.branchId || !user || !hasItems) {
      toast.warning(t("missingSelection"));
      return;
    }

    try {
      setIsCreatingInvoice(true);
      const items = [
        ...(currentMembership
          ? [
              {
                item_id: currentMembership.membership_type_id,
                item_type: "membership",
                quantity: 1,
              },
            ]
          : []),
        ...selection.packages.map((pkg) => ({
          item_id: pkg.packageId,
          item_type: "package",
          quantity: 1,
        })),
        ...selection.services.map((s) => ({
          item_id: s.service_id,
          item_type: "service",
          quantity: 1,
        })),
      ];

      const payload = {
        branch_id: selection.branchId,
        user_id: user?.role?.name !== "client" ? user?.user_id : null,
        items,
        currency: selection.currency,
      };

      const res = await api.billing.createInvoice(payload, token || "");
      actions.setInvoice((res as any).data || res);
      trackFunnel("checkout");
      toast.success(t("invoiceSuccess"));
      setTimeout(() => actions.next(), 100);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("invoiceError"));
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [selection, currentMembership, token, user, actions, t]);

  return {
    selection,
    actions,
    token,
    branches,
    memberships,
    normalizedPackages,
    currentMembership,
    availableServices,
    hasMore,
    isMember,
    prices,
    isCreatingInvoice,
    loading: { loadingM, loadingP, loadingB, loadingS },
    handlers: { handleProcessCheckout, handleLoadMoreServices, router },
  };
};
