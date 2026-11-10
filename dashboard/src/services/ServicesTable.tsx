"use client";
import { useState } from "react";
import { Service } from "@/models/service";
import { ServicesData } from "./data";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Eye, Pencil, Trash2 } from "lucide-react";
import StarIconOutline from "@heroicons/react/24/outline/StarIcon";
import StarIconSolid from "@heroicons/react/24/solid/StarIcon";

interface ServiceTableProps {
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
}

type ServiceRow = Service & { featured?: boolean | null };

export default function ServicesTable({ onView, onEdit }: ServiceTableProps) {
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleDeleteService = (service: Service) => {
    setSelectedService(service);
    console.warn("eliminar servicio: ", selectedService);
  };

  const columns: Column<ServiceRow>[] = [
    {
      header: "Nombre",
      accessor: "name",
      filterType: "text",
      filterable: true,
      render: (v) => <div className="text-center">{v as string}</div>,
    },
    {
      header: "Categoría",
      accessor: "categoryId",
      filterType: "text",
      filterable: true,
      render: (v) => <div className="text-center">{v as string}</div>,
    },
    {
      header: "Duración",
      accessor: "durationMinutes",
      filterType: "text",
      filterable: false,
      render: (v) => (
        <div className="text-center">{v ? `${v} min` : "N/A"}</div>
      ),
    },
    {
      header: "Destacado",
      accessor: "featured",
      render: (v) => (
        <div className="text-center">
          {(v as boolean) ? (
            <StarIconSolid className="h-5 w-5 text-black-500 inline-block" />
          ) : (
            <StarIconOutline className="h-5 w-5 text-black-500 inline-block" />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<ServiceRow>
        columns={columns}
        data={ServicesData}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex flex-col items-center justify-center w-full">
            <RowActions
              actions={[
                {
                  label: "Ver Detalles",
                  icon: Eye,
                  onClick: () => onView(row),
                },
                {
                  label: "Modificar",
                  icon: Pencil,
                  onClick: () => onEdit(row),
                },
                {
                  label: "Eliminar",
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.id),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />
            {deleteRowId === row.id && (
              <Alert className="mt-2 w-full max-w-md">
                <AlertTitle className="text-black">
                  Confirmar Eliminación
                </AlertTitle>
                <AlertDescription className="text-gray-900">
                  ¿Estás seguro de que deseas eliminar este servicio? Esta
                  acción no se puede deshacer.
                </AlertDescription>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="border-white"
                    onClick={() => setDeleteRowId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="text-white"
                    onClick={() => handleDeleteService(row)}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                    Eliminar
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}
      />
    </>
  );
}
