"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  BranchPaymentMethodInfo,
  InvoiceDetail,
  ServicePublicItem,
} from "@vitalfit/sdk";
import { PackageOption } from "@/components/features/checkout/PackageCarousel";

interface CheckoutSelection {
  step: number;
  branchId: string;
  methodId: string;
  membershipId: string | null;
  currency: string;
  packages: PackageOption[];
  services: ServicePublicItem[];
  methods: BranchPaymentMethodInfo[];
  invoice: InvoiceDetail | null;
}

const INITIAL_STATE: CheckoutSelection = {
  step: 1,
  branchId: "",
  methodId: "",
  membershipId: null,
  currency: "USD",
  packages: [],
  services: [],
  methods: [],
  invoice: null,
};

export const useCheckout = (userId?: string) => {
  const getStorageKey = useCallback(
    (uid?: string) =>
      uid ? `vitalfit_checkout_state_${uid}` : "vitalfit_checkout_state",
    [],
  );

  const [selection, setSelection] = useState<CheckoutSelection>(INITIAL_STATE);
  const isLoadedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = getStorageKey(userId);
    const saved = localStorage.getItem(key);

    Promise.resolve().then(() => {
      if (saved) {
        try {
          setSelection(JSON.parse(saved));
        } catch (e) {
          console.error("Error al parsear el estado inicial", e);
          setSelection(INITIAL_STATE);
        }
      } else {
        setSelection(INITIAL_STATE);
      }
      isLoadedForUser.current = userId || "guest";
    });
  }, [userId, getStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isLoadedForUser.current !== (userId || "guest")) {
      return;
    }
    const key = getStorageKey(userId);
    if (selection.step === 3) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(selection));
    }
  }, [selection, userId, getStorageKey]);

  const setStep = useCallback(
    (step: number) => setSelection((s) => ({ ...s, step })),
    [],
  );

  const next = useCallback(
    () => setSelection((s) => ({ ...s, step: s.step + 1 })),
    [],
  );

  const back = useCallback(
    () => setSelection((s) => ({ ...s, step: Math.max(1, s.step - 1) })),
    [],
  );

  const setCurrency = useCallback(
    (currency: string) => setSelection((s) => ({ ...s, currency })),
    [],
  );

  const setBranch = useCallback(
    (id: string) =>
      setSelection((s) => ({
        ...s,
        branchId: id,
        methodId: "",
        methods: [],
        services: [],
        packages: [],
        invoice: null,
      })),
    [],
  );

  const setMethods = useCallback(
    (methods: BranchPaymentMethodInfo[]) =>
      setSelection((s) => ({ ...s, methods })),
    [],
  );

  const setMethod = useCallback(
    (id: string) => setSelection((s) => ({ ...s, methodId: id })),
    [],
  );

  const setMembershipId = useCallback(
    (id: string | null) => setSelection((s) => ({ ...s, membershipId: id })),
    [],
  );

  const togglePackage = useCallback((pkg: PackageOption) => {
    setSelection((prev) => {
      const exists = prev.packages.some((p) => p.packageId === pkg.packageId);
      return {
        ...prev,
        packages: exists
          ? prev.packages.filter((p) => p.packageId !== pkg.packageId)
          : [...prev.packages, pkg],
      };
    });
  }, []);

  const toggleService = useCallback((service: ServicePublicItem) => {
    setSelection((prev) => {
      const exists = prev.services.some(
        (s) => s.service_id === service.service_id,
      );
      return {
        ...prev,
        services: exists
          ? prev.services.filter((s) => s.service_id !== service.service_id)
          : [...prev.services, service],
      };
    });
  }, []);

  const setServices = useCallback(
    (services: ServicePublicItem[]) =>
      setSelection((s) => ({ ...s, services })),
    [],
  );

  const setPackages = useCallback(
    (packages: PackageOption[]) => setSelection((s) => ({ ...s, packages })),
    [],
  );

  const setInvoice = useCallback(
    (data: InvoiceDetail | null) =>
      setSelection((s) => ({ ...s, invoice: data })),
    [],
  );

  const reset = useCallback(() => {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
    setSelection(INITIAL_STATE);
  }, [userId, getStorageKey]);

  const actions = useMemo(
    () => ({
      setStep,
      next,
      back,
      setCurrency,
      setBranch,
      setMethods,
      setMethod,
      setInvoice,
      setMembershipId,
      togglePackage,
      toggleService,
      setServices,
      setPackages,
      reset,
    }),
    [
      setStep,
      next,
      back,
      setCurrency,
      setBranch,
      setMethods,
      setMethod,
      setInvoice,
      setMembershipId,
      togglePackage,
      toggleService,
      setServices,
      setPackages,
      reset,
    ],
  );

  return { selection, actions };
};
