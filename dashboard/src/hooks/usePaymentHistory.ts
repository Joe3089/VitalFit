import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { ClientInvoice } from "@vitalfit/sdk"; // Basado en tus tipos de billing
import { toast } from "sonner";

export function usePaymentHistory(clientId: string) {
    const { token } = useAuth();
    const [data, setData] = useState<ClientInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({ search: "" });
    const limit = 10;

    const loadPayments = useCallback(async () => {
        if (!token || !clientId) return;

        setIsLoading(true);
        try {
            // Llamada real al servicio de billing del SDK
            const response = await api.billing.getClientInvoices(
                token, 
                {
                    page,
                    limit,
                    search: filters.search || undefined, // Filtro por nro de factura o similar
                    sort: 'desc'
                },
                clientId // IMPORTANT: Esto filtra por ese cliente en el backend
            );

            setData(response.data || []);
            setTotalItems(response.total || 0);
        } catch (error) {
            console.error("Error loading payments:", error);
            toast.error("Error al cargar las facturas de este cliente");
        } finally {
            setIsLoading(false);
        }
    }, [token, clientId, page, filters.search]);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    return {
        data,
        isLoading,
        page,
        totalPages: Math.ceil(totalItems / limit) || 1,
        handlePageChange: (newPage: number) => setPage(newPage),
        filters,
        onFilterChange: handleFilterChange,
        reload: loadPayments
    };
}