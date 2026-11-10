"use client";

import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { BranchEquipmentInventory } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";

interface BranchEquipmentTableProps {
  data: BranchEquipmentInventory[];
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (row: BranchEquipmentInventory) => void;
  onEdit: (row: BranchEquipmentInventory) => void;
  onRemove: (id: string) => void;
  isDisabled?: boolean;
}

const BranchEquipmentTable: React.FC<BranchEquipmentTableProps> = ({
  data,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onRemove,
  isDisabled = false,
}) => {
  const t = useTranslations("branches");

  const inventoryColumns: Column<BranchEquipmentInventory>[] = [
    { header: t("details.equipment.table.name"), accessor: "name" },
    { header: t("details.equipment.table.serial"), accessor: "serial_number" },
    { header: t("details.equipment.table.status"), accessor: "status" },
    { header: t("details.equipment.table.acquisition"), accessor: "acquisition_date" },
    { header: t("details.equipment.table.last_maintenance"), accessor: "last_maintenance_date" },
  ];

  const actionRenderer = (row: BranchEquipmentInventory) => (
    <div className="flex gap-2">
      <Button
        size="icon"
        variant="outline"
        onClick={() => onView(row)}
        title={t("details.equipment.actions.view")}
      >
        <Eye size={16} />
      </Button>

      {!isDisabled && (
        <Button
          size="icon"
          variant="outline"
          onClick={() => onEdit(row)}
          title={t("details.equipment.actions.edit")}
        >
          <Pencil size={16} />
        </Button>
      )}

      {!isDisabled && (
        <Button
          size="icon"
          variant="outline"
          onClick={() => onRemove(row.inventory_id)}
          title={t("details.equipment.actions.delete")}
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );

  return (
    <DataTable
      columns={inventoryColumns}
      data={data}
      enableRowSelection
      actions={actionRenderer}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={onPageChange}
      rowIdKey="inventory_id"
    />
  );
};

export default BranchEquipmentTable;