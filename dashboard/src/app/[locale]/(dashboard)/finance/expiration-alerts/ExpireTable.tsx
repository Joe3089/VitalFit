"use client";
import { useState, useEffect } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Download, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Membership } from "./data";
import { Badge } from "@/components/ui/badge";

interface ExpireTableProps {
  data: Membership[];
  onReload: () => void;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filters: { search: string; status: string; startDate: string; endDate: string };
  onFilterChange: (filters: { search?: string; status?: string; startDate?: string; endDate?: string }) => void;
}

export default function ExpireTable({
  data,
  onReload,
  page,
  pageSize,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: ExpireTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [startDate, setStartDate] = useState(filters.startDate);
  const [endDate, setEndDate] = useState(filters.endDate);
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() === "") {
        if (filters.search !== "") {
          onFilterChange({ search: "" });
        }
      } else if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, onFilterChange]);

  // Efecto para aplicar filtros de fecha con debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (startDate !== filters.startDate || endDate !== filters.endDate) {
        onFilterChange({ startDate, endDate });
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [startDate, endDate, filters.startDate, filters.endDate, onFilterChange]);

  const handleView = (row: Membership) => {
    router.push(`/administrator/membershipExpire/${row.membership_id}`);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    onFilterChange({ search: "", status: "all", startDate: "", endDate: "" });
  };

  const hasActiveFilters = filters.search || filters.status !== "all" || filters.startDate || filters.endDate;

  const StatusBadge = ({ status }: { status: Membership["status"] }) => {
    const variantMap = {
      completed: "default",
      pending: "secondary",
      renewed: "outline",
      expired: "destructive"
    };

    const labels = {
      completed: "Completado",
      pending: "Pendiente",
      renewed: "Renovado",
      expired: "Expirado"
    };

    return (
      <Badge variant={variantMap[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  // Función para mostrar recordatorios como texto simple
  const getReminderText = (reminder: Membership["reminders"]) => {
    const labels = {
      sent: "Enviado",
      "not_sent": "No enviado",
      scheduled: "Programado"
    };
    return labels[reminder];
  };

  const columns: Column<Membership>[] = [
    { header: "Cliente", accessor: "client", filterType: "text" },
    { header: "Membresía", accessor: "membership_name", filterType: "text" },
    { header: "Vencimiento", accessor: "expiration_date", filterType: "text" },
    {
      header: "Días Restantes",
      accessor: "days_remaining",
      filterType: "text",
      render: (value) => (
        <span className={Number(value) <= 3 ? "text-red-600 font-semibold" : ""}>
          {value} días
        </span>
      )
    },
    { header: "Monto", accessor: "amount", filterType: "text" },
    {
      header: "Recordatorios",
      accessor: "reminders",
      filterType: "text",
      render: (value) => getReminderText(value as Membership["reminders"])
    },
    {
      header: "Status",
      accessor: "status",
      filterType: "text",
      render: (value) => <StatusBadge status={value as Membership["status"]} />
    },
  ];

  return (
    <>
      <div className="space-y-4 mb-6">
        {/* Primera fila: Búsqueda, Status y Exportar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:w-[250px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>


          <div className="flex flex-col p-0">
            <label className="text-xs ">Desde</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[150px]"
            />
          </div>

          <div className="flex flex-col p-0">
            <label className="text-xs ">Hasta</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[150px]"
            />
          </div>

          {hasActiveFilters && (
            <div className="flex flex-col justify-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex items-center gap-2 h-10"
              >
                Limpiar Filtros
              </Button>
            </div>
          )}


          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange({ status: value })}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los status</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="renewed">Renovado</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <DataTable<Membership>
        key={`page-${page}-${data.length}`}
        columns={columns}
        data={data}
        onPageChange={onPageChange}
        totalPages={totalPages}
        rowIdKey="membership_id"
        actions={(row) => (
          <RowActions
            actions={[
              { label: "Enviar Recordatorio", icon: PaperAirplaneIcon, onClick: () => { } },
              { label: "Detalles", icon: Eye, onClick: () => handleView(row) },
            ]}
          />
        )}
      />
    </>
  );
}