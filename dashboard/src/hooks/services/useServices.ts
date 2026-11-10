import { api } from "@/lib/sdk-config";
import { ServiceCategoryInfo, ServiceFullDetail, ServicesSummary } from "@vitalfit/sdk";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Filters {
    search: string;
    category: string;
    limit?: number; 
}

export function useServices(token: string | null, page: number, filters: Filters) {
    const t = useTranslations("catalog.services");
    
    const [services, setServices] = useState<ServiceFullDetail[]>([]);
    const [categories, setCategories] = useState<ServiceCategoryInfo[]>([]);
    const [summary, setSummary] = useState<ServicesSummary>();
    const [isLoading, setIsLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);

    const currentLimit = filters.limit || 10;

    const filtersKey = JSON.stringify(filters);
    const lastFiltersRef = useRef(filtersKey);

    const loadData = useCallback(async (isManual = false) => {
        if (!token) {
            return;
        }

        let toastId: string | number | undefined;
        if (isManual) {
            toastId = toast.loading(t("table.downloading")); 
        }

        setIsLoading(true);

        try {
            const categoryParam = filters.category === "all" || !filters.category
                ? undefined
                : filters.category;

            const [servicesRes, categoriesRes, serviceSummary] = await Promise.all([
                api.products.getServices(token, {
                    page: page,
                    limit: currentLimit, 
                    sort: "desc",
                    search: filters.search?.trim() || undefined,
                    category: categoryParam,
                }),
                api.products.getCategories(token),
                api.products.getSummary(token)
            ]);

            const newData = servicesRes.data || [];
            const serverTotal = Number(servicesRes.total) || 0;
            const serviceSumm = serviceSummary.data;

            setServices(newData);
            setCategories(categoriesRes.data || []);
            setSummary(serviceSumm);

            setTotalItems((prevTotal) => {
                if (filtersKey !== lastFiltersRef.current) {
                    lastFiltersRef.current = filtersKey;
                    return serverTotal;
                }
                if (serverTotal === 0 && newData.length > 0) {
                    return prevTotal;
                }
                return serverTotal;
            });

            if (isManual && toastId){
                toast.success(t("notifications.successTitle"), { id: toastId });
            }
                
        } catch (error) {
            console.error("Error en useServices:", error);
            if (isManual) {
                toast.error(t("notifications.processError"), { id: toastId });
            } else {
                toast.error(t("notifications.loadError"));
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, page, filtersKey, currentLimit, t]); 

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalPages = useMemo(() => {
        return totalItems > 0 ? Math.ceil(totalItems / currentLimit) : 1;
    }, [totalItems, currentLimit]);

    return {
        services,
        categories,
        isLoading,
        totalPages,
        totalItems,
        summary,
        refresh: () => loadData(true),
    };
}