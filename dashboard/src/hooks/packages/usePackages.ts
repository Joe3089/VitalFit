import { api } from "@/lib/sdk-config";
import { PackageListItem } from "@vitalfit/sdk";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Filters {
    search: string;
}

interface PaginatedPackages {
    data: PackageListItem[];
    total: number;
    count: number;
    next?: string;
    previous?: string;
}

export function usePackages(token: string | null, page: number, pageSize: number, filters: Filters) {
    const t = useTranslations("catalog.packages");

    const [packageData, setPackageData] = useState<PackageListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);

    const filtersKey = JSON.stringify(filters);
    const lastFiltersRef = useRef(filtersKey);

    const loadData = useCallback(async (isManual = false) => {
        if (!token) {
            return;
        }

        let toastId: string | number | undefined;
        if (isManual) {
            toastId = toast.loading(t("table.downloading") || t("loading"));
        }

        setIsLoading(true);

        try {
            const result = await api.packages.getPackages(token, {
                page,
                limit: pageSize,
                sort: "desc",
                search: filters.search?.trim() || undefined,
            });

            const paquetesResult = result as unknown as { data: PaginatedPackages };

            const newData = paquetesResult.data.data || [];
            const serverTotal = paquetesResult.data.total ?? 0;

            setPackageData(newData);
            setTotalItems(serverTotal);

            if (isManual && toastId) {
                toast.success(t("notifications.success_title") || "Éxito", { id: toastId });
            }
        } catch (error) {
            console.error("Error en usePackages:", error);
            setPackageData([]);
            setTotalItems(0);
            if (isManual) {
                toast.error(t("notifications.error_title") || "Error", { id: toastId });
            } else {
                toast.error(t("error_loading") || "Error loading packages");
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, page, pageSize, filtersKey, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalItems / pageSize));
    }, [totalItems, pageSize]);

    return {
        packageData,
        isLoading,
        totalItems,
        totalPages,
        refresh: () => loadData(true),
    };
}
