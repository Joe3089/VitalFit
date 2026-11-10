"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Save, RotateCcw, Dumbbell, ClipboardList, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { BranchEquipmentInventory, Equipment } from "@vitalfit/sdk";

import { SectionHeader } from "@/components/modules/branches/SectionHeader";
import BranchEquipmentTable from "@/components/modules/branches/BranchEquipmentTable";
import EditBranchEquipmentModal from "./EditBranchEquipmentModal";
import { branchEquipmentSchema } from "@/lib/validation/branchEquipmentSchema";
import { Input } from "@/components/ui/Input";
import { useExport } from "@/hooks/export/use-export";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

interface BranchEquipmentPanelProps {
  branchId: string;
  mode?: "view" | "edit";
}

const BranchEquipmentPanel: React.FC<BranchEquipmentPanelProps> = ({
  branchId,
  mode = "edit",
}) => {
  const t = useTranslations("branches");
  const { token } = useAuth();
  const isDisabled = mode === "view";

  const [currentInventory, setCurrentInventory] = useState<BranchEquipmentInventory[]>([]);
  const [pendingInventory, setPendingInventory] = useState<BranchEquipmentInventory[]>([]);
  const [removedInventoryIds, setRemovedInventoryIds] = useState<string[]>([]);
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<BranchEquipmentInventory | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [equipmentToRemove, setEquipmentToRemove] = useState<{ id: string; name: string } | null>(null);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentPageSize, setEquipmentPageSize] = useState(10);

  const { handleExport, isExporting } = useExport();
  const onExportInventory = () => {
    const fileName = t("details.equipment.export_filename") || "inventario_sucursal";
    handleExport(
      "branch-inventory",
      (jwt) => api.exports.exportBranchEquipment(branchId, jwt),
      `${fileName}_${branchId}_${new Date().toISOString().split("T")[0]}`,
      "csv",
    );
  };

  const fetchInventory = useCallback(async () => {
    if (!token || !branchId) {
      return;
    }
    setLoading(true);
    try {
      const [catRes, invRes] = await Promise.all([
        api.equipment.getEquipment(token, { page: 1, limit: 100 }),
        api.equipment.getBranchEquipment(branchId, token),
      ]);
      setAllEquipment(catRes.data || []);
      setCurrentInventory(invRes.data || []);
      setPendingInventory([]);
      setRemovedInventoryIds([]);
    } catch (err) {
      toast.error(t("details.equipment.error_loading_inventory"));
    } finally {
      setLoading(false);
    }
  }, [token, branchId, t]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleAddEquipment = () => {
    if (!selectedEquipmentId) {
      toast.error(t("details.equipment.select_before_adding"));
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const newPending: BranchEquipmentInventory = {
      inventory_id: crypto.randomUUID(),
      equipment_id: selectedEquipmentId,
      name: allEquipment.find((e) => e.equipment_id === selectedEquipmentId)?.name || "",
      serial_number: serialNumber,
      notes,
      acquisition_date: today,
      last_maintenance_date: today,
      status: "Available",
    };

    const validation = branchEquipmentSchema.safeParse(newPending);
    if (!validation.success) {
      toast.error(t("details.equipment.error_adding", { errors: validation.error.issues[0].message }));
      return;
    }

    setPendingInventory((prev) => [...prev, newPending]);
    setSelectedEquipmentId(null);
    setSerialNumber("");
    setNotes("");
    toast.success(t("details.equipment.success_added_pending", { name: newPending.name }));
  };

  const handleRemoveEquipment = (inventoryId: string) => {
    const isPending = pendingInventory.find((e) => e.inventory_id === inventoryId);

    if (isPending) {
      setPendingInventory((prev) => prev.filter((e) => e.inventory_id !== inventoryId));
      toast.info(t("details.equipment.toast_removed_local"));
      return;
    }

    const removed = currentInventory.find((e) => e.inventory_id === inventoryId);
    if (!removed) {
      return;
    }

    setEquipmentToRemove({ id: inventoryId, name: removed.name });
  };

  const confirmRemoval = () => {
    if (equipmentToRemove) {
      setRemovedInventoryIds((prev) => [...prev, equipmentToRemove.id]);
      setCurrentInventory((prev) => prev.filter((e) => e.inventory_id !== equipmentToRemove.id));
      setEquipmentToRemove(null);
      toast.warning(t("details.equipment.toast_marked_for_deletion"));
    }
  };

  const handleSaveChanges = async () => {
    if (!token) {
      return;
    }
    setIsSaving(true);
    try {
      for (const item of pendingInventory) {
        await api.equipment.addBranchEquipment(branchId, item, token);
      }
      for (const invId of removedInventoryIds) {
        await api.equipment.removeBranchEquipment(branchId, invId, token);
      }
      toast.success(t("details.equipment.success_save"));
      await fetchInventory();
    } catch (err) {
      toast.error(t("details.equipment.error_save"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEquipment = async (data: any) => {
    if (!token || !equipmentToEdit) {
      return;
    }
    try {
      await api.equipment.updateBranchEquipment(branchId, equipmentToEdit.inventory_id, data, token);
      setCurrentInventory((prev) =>
        prev.map((e) => e.inventory_id === equipmentToEdit.inventory_id ? { ...e, ...data } : e)
      );
      setEditModalOpen(false);
      toast.success(t("details.equipment.success_update", { name: equipmentToEdit.name }));
    } catch (err) {
      toast.error(t("details.equipment.error_updating"));
    }
  };

  const displayedInventory = useMemo(() => {
    return currentInventory
      .filter((e) => !removedInventoryIds.includes(e.inventory_id))
      .concat(pendingInventory);
  }, [currentInventory, pendingInventory, removedInventoryIds]);

  const totalPages = Math.ceil(displayedInventory.length / equipmentPageSize) || 1;
  const paginatedData = displayedInventory.slice(
    (equipmentPage - 1) * equipmentPageSize,
    equipmentPage * equipmentPageSize,
  );

  const hasChanges = pendingInventory.length > 0 || removedInventoryIds.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title={t("details.equipment.inventory_title")}
        subtitle={t("details.equipment.inventory_subtitle")}
        icon={Dumbbell}
        isViewMode={isDisabled}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={onExportInventory}
            disabled={isExporting === "branch-inventory" || loading}
            className="bg-white border-slate-200 text-slate-500 hover:text-orange-500 transition-all"
          >
            {isExporting === "branch-inventory" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {isExporting === "branch-inventory" ? t("details.equipment.exporting") : t("details.equipment.export")}
          </Button>
        }
      />

      <Separator />

      {!isDisabled && (
        <Card className="border shadow-none bg-slate-50/40">
          <CardHeader className="pb-4 text-left">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {t("details.equipment.add_card_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">{t("details.equipment.add.model_label")}</label>
                <Select value={selectedEquipmentId ?? ""} onValueChange={setSelectedEquipmentId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder={t("details.equipment.add.select_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <Input
                        placeholder={t("details.equipment.add.search_placeholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    {allEquipment
                      .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
                      .map((e) => (
                        <SelectItem key={e.equipment_id} value={e.equipment_id}>{e.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1 block">{t("details.equipment.add.serial_label")}</label>
                <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="bg-white" placeholder="Ej: SN-2024" />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-bold uppercase text-muted-foreground ml-1 block">{t("details.equipment.add.notes_label")}</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white" placeholder={t("details.equipment.add.notes_placeholder")} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
              <div className="flex gap-2">
                <Button onClick={handleAddEquipment} disabled={!selectedEquipmentId} variant="outline" size="sm" className="bg-white font-bold text-xs uppercase tracking-widest border-slate-200 shadow-sm transition-all active:scale-95">
                  <Plus className="mr-2 h-4 w-4" /> {t("details.equipment.add.button")}
                </Button>
                <Button onClick={handleSaveChanges} disabled={!hasChanges || isSaving} size="sm" className="bg-orange-500 hover:bg-orange-600 font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-orange-100 transition-all active:scale-95">
                  <Save className="mr-2 h-4 w-4" /> {isSaving ? t("create.form.buttons.saving") : t("create.form.buttons.save")}
                </Button>
              </div>
              {hasChanges && (
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={fetchInventory} className="text-slate-400 hover:text-orange-500 font-bold text-[10px] uppercase tracking-tighter">
                    <RotateCcw size={14} className="mr-1" /> {t("details.equipment.btn_discard")}
                  </Button>
                  <Badge className="bg-orange-50 text-orange-600 border-orange-100 animate-pulse font-black text-[10px]">
                    {t("details.equipment.badge_pending")}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-3">
            {t("details.equipment.inventory_title")} {displayedInventory.length}
          </h3>
          <Select value={equipmentPageSize.toString()} onValueChange={(val) => { setEquipmentPageSize(Number(val)); setEquipmentPage(1); }}>
            <SelectTrigger className="h-8 w-16 text-[11px] font-bold border-slate-200 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={size.toString()} className="text-xs">{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {displayedInventory.length === 0 ? (
          <div className="p-12 text-center text-slate-300 border rounded-xl bg-white shadow-sm">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] uppercase font-black tracking-[0.2em]">{t("details.equipment.empty")}</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <BranchEquipmentTable
              data={paginatedData}
              page={equipmentPage}
              pageSize={equipmentPageSize}
              totalPages={totalPages}
              onPageChange={setEquipmentPage}
              onView={(row) => { setEquipmentToEdit(row); setModalMode("view"); setEditModalOpen(true); }}
              onEdit={(row) => { setEquipmentToEdit(row); setModalMode("edit"); setEditModalOpen(true); }}
              onRemove={handleRemoveEquipment}
              isDisabled={isDisabled}
            />
          </div>
        )}
      </div>

      <EditBranchEquipmentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        equipment={equipmentToEdit}
        onSave={handleUpdateEquipment}
        mode={modalMode}
      />

      <GeneralAlertDialog
        open={!!equipmentToRemove}
        onOpenChange={(open) => !open && setEquipmentToRemove(null)}
        title={t("details.equipment.dialog_remove_title")}
        description={t("details.equipment.dialog_remove_description")}
        actionText={t("details.equipment.dialog_remove_action")}
        actionVariant="destructive"
        onAction={confirmRemoval}
      />
    </div>
  );
};

export default BranchEquipmentPanel;