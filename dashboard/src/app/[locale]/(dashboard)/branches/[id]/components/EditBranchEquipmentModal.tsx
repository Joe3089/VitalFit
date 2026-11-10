"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import InputField from "@/components/ui/InputField";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import { BranchEquipmentInventory, EquipmentStatus } from "@vitalfit/sdk";

interface EditBranchEquipmentModalProps {
  open: boolean;
  onClose: () => void;
  equipment: BranchEquipmentInventory | null;
  onSave: (data: {
    last_maintenance_date: string;
    notes: string;
    status: EquipmentStatus;
  }) => Promise<void>;
  mode?: "view" | "edit";
}

import { useTranslations } from "next-intl";

export default function EditBranchEquipmentModal({
  open,
  onClose,
  equipment,
  onSave,
  mode = "edit",
}: EditBranchEquipmentModalProps) {
  const t = useTranslations("branches");
  const isViewMode = mode === "view";

  const [lastMaintenanceDate, setLastMaintenanceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("Available");

  useEffect(() => {
    if (equipment) {
      setLastMaintenanceDate(
        equipment.last_maintenance_date?.split("T")[0] || "",
      );
      setNotes(equipment.notes || "");
      setStatus(equipment.status || "Available");
    }
  }, [equipment]);

  const handleSave = () => {
    onSave({
      last_maintenance_date: lastMaintenanceDate,
      notes,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>
              {isViewMode
                ? t("details.equipment.modal.view")
                : t("details.equipment.modal.edit")}
            </DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        {!equipment ? (
          <p className="text-sm text-gray-500">{t("details.equipment.modal.loading")}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-semibold">{equipment.serial_number}</p>

            <InputField
              label={t("details.equipment.modal.last_maintenance")}
              type="date"
              disabled={isViewMode}
              value={lastMaintenanceDate}
              onChange={(e) => setLastMaintenanceDate(e.target.value)}
            />

            <InputField
              label={t("details.equipment.modal.notes")}
              type="text"
              disabled={isViewMode}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {t("details.equipment.modal.status")}
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as EquipmentStatus)}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("details.equipment.modal.status_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="InMaintenance">InMaintenance</SelectItem>
                  <SelectItem value="OutOfService">OutOfService</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!isViewMode && (
          <DialogFooter>
            <Button onClick={handleSave}>{t("details.equipment.modal.save")}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
