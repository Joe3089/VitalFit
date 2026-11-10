"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import useGetMembership from "@/hooks/membership/useGetMembership";
import useGetPackage from "@/hooks/packages/useGetPackage";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";

interface ItemNameCellProps {
  item: {
    membership_type_id?: string;
    package_id?: string;
    service_id?: string; 
    // Otros campos que vienen del backend
    unit_price?: string;
    quantity?: number;
  };
}

export function ItemNameCell({ item }: ItemNameCellProps) {
  const t = useTranslations("finance.Billing.itemsTable");
  const { token } = useAuth();
  const [serviceDetail, setServiceDetail] = useState<any>(null);
  const [loadingService, setLoadingService] = useState(false);

  const { membershipDetail, loading: loadingMember } = useGetMembership(
    item.membership_type_id,
    token
  );
  const { packageDetail, loading: loadingPackage } = useGetPackage(
    item.package_id,
    token
  );

  useEffect(() => {
    const fetchService = async () => {
      if (item.service_id && token) {
        setLoadingService(true);
        try {
          const res = await api.products.getServiceByID(item.service_id, token);
          if (res?.data) {
            setServiceDetail(res.data);
          }
        } catch (error) {
          console.error("Error fetching service detail:", error);
        } finally {
          setLoadingService(false);
        }
      }
    };
    fetchService();
  }, [item.service_id, token]);

  const isAnyLoading = loadingMember || loadingPackage || loadingService;

  if (isAnyLoading) {
    return <div className="h-4 w-32 bg-muted animate-pulse rounded" />;
  }

  if (item.membership_type_id) {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-sm text-foreground">
          {membershipDetail?.name || t("defaultNames.membership")}
        </span>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
          {t("types.membership")}
        </span>
      </div>
    );
  }

  if (item.package_id) {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-sm text-foreground">
          {packageDetail?.name || t("defaultNames.package")}
        </span>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
          {t("types.package")}
        </span>
      </div>
    );
  }

  if (item.service_id) {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-sm text-foreground">
          {serviceDetail?.name || t("defaultNames.service")}
        </span>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
          {serviceDetail?.service_category.name || t("types.service")}
        </span>
      </div>
    );
  }

  return (
    <span className="text-xs italic text-muted-foreground">
      {t("types.unknown")}
    </span>
  );
}