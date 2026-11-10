"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import ExpireTable from "./ExpireTable";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { mockMemberships, Membership } from "./data";

export default function MembershipExpire() {
  const router = useRouter();

  const [membershipsData, setMembershipsData] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    startDate: "",
    endDate: ""
  });

  const loadMembershipsData = useCallback(async () => {
    setIsLoading(true);

    setTimeout(() => {
      let filteredData = [...mockMemberships];

      // Aplicar filtro de búsqueda
      if (filters.search) {
        filteredData = filteredData.filter(membership =>
          membership.client.toLowerCase().includes(filters.search.toLowerCase()) ||
          membership.membership_name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Aplicar filtro de status
      if (filters.status !== "all") {
        filteredData = filteredData.filter(membership =>
          membership.status === filters.status
        );
      }

      // Aplicar filtro por fecha (si existen ambas fechas)
      if (filters.startDate && filters.endDate) {
        filteredData = filteredData.filter(membership => {
          const expirationDate = new Date(membership.expiration_date);
          const startDate = new Date(filters.startDate);
          const endDate = new Date(filters.endDate);
          return expirationDate >= startDate && expirationDate <= endDate;
        });
      }

      setMembershipsData(filteredData);
      setTotalItems(filteredData.length);
      setIsLoading(false);
    }, 500);
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadMembershipsData();
  }, [loadMembershipsData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilters: {
    search?: string;
    status?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <PageHeader title="MEMBRESÍAS POR VENCER">
        {/* Puedes agregar botones adicionales aquí si necesitas */}
      </PageHeader>

      {isLoading ? (
        <div className="text-center p-10">Cargando membresías...</div>
      ) : (
        <ExpireTable
          data={membershipsData}
          onReload={loadMembershipsData}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          totalPages={totalPages}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
}