"use client";

import React, {
  useEffect,
  useState,
  forwardRef,
  useMemo,
  useCallback,
} from "react";
import { 
  Eye, 
  Pencil, 
  Plus, 
  Trash2, 
  LayoutList, 
  RotateCcw, 
  Loader2, 
  FileDown, 
  Save
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { 
  BranchServicePrice, 
  CreateBranchServicePriceItem, 
  ServiceFullDetail 
} from "@vitalfit/sdk";

import { Button } from "@/components/ui/button";
import { getInitials } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InputField from "@/components/ui/InputField";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import EditBranchServiceModal from "./EditBranchServiceModal";
import { branchServiceSchema } from "@/lib/validation/branchServiceSchema";
import EntityItem from "@/components/layout/EntityItem";
import { PaginationControls } from "@/components/ui/table/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { ServiceGlobalSelector } from "@/components/modules/branches/ServiceGlobalSelector";
import { useExport } from "@/hooks/export/use-export";
import { SectionHeader } from "@/components/modules/branches/SectionHeader";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

interface BranchServicePanelProps {
  branchId: string;
  mode: "view" | "edit";
}

const BranchServicePanel = forwardRef<HTMLDivElement, BranchServicePanelProps>(
  (props, ref) => {
    const { branchId, mode = "edit" } = props;
    const t = useTranslations("branches");
    const { token } = useAuth();
    const isDisabled = mode === "view";

    const [services, setServices] = useState<BranchServicePrice[]>([]);
    const [newServices, setNewServices] = useState<CreateBranchServicePriceItem[]>([]);
    const [removedIds, setRemovedIds] = useState<string[]>([]);
    const [selectedService, setSelectedService] = useState<ServiceFullDetail | null>(null);
    const [aforo, setAforo] = useState<number>(0);
    const [priceMember, setPriceMember] = useState<number>(0);
    const [priceNonMember, setPriceNonMember] = useState<number>(0);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<BranchServicePrice | null>(null);
    const [modalMode, setModalMode] = useState<"view" | "edit">("view");
    const [serviceToRemove, setServiceToRemove] = useState<{ id: string; name: string } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { handleExport, isExporting } = useExport();

    const onExportServices = () => {
      const fileName = t("details.services.export_filename") || "servicios_sucursal";
      handleExport(
        "branch-services",
        (jwt) => api.exports.exportBranchServices(branchId, jwt),
        `${fileName}_${branchId}_${new Date().toISOString().split("T")[0]}`,
        "csv",
      );
    };

    const fetchBranchServices = useCallback(async () => {
      if (!token || !branchId) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.products.getBranchServices(branchId, token);
        setServices(response.data || []);
        setNewServices([]);
        setRemovedIds([]);
      } catch (err) {
        toast.error(t("details.services.error_load_branch"));
      } finally {
        setIsLoading(false);
      }
    }, [token, branchId, t]);

    useEffect(() => { fetchBranchServices(); }, [fetchBranchServices]);

    const handleAddLocal = () => {
      if (!selectedService) {
        return;
      }

      const newItem: CreateBranchServicePriceItem = {
        service_id: selectedService.service_id,
        max_capacity: aforo,
        price_for_member: priceMember,
        price_for_non_member: priceNonMember,
        is_visible: isVisible,
      };

      const result = branchServiceSchema.safeParse(newItem);
      if (!result.success) {
        toast.error(result.error.issues[0].message);
        return;
      }

      if (removedIds.includes(selectedService.service_id)) {
        setRemovedIds((prev) => prev.filter((id) => id !== selectedService.service_id));
      }

      setServices((prev) => [
        ...prev,
        { ...newItem, service_name: selectedService.name } as BranchServicePrice,
      ]);
      setNewServices((prev) => [...prev, newItem]);

      setSelectedService(null);
      setAforo(0);
      setPriceMember(0);
      setPriceNonMember(0);
      toast.info(t("details.services.toast_added_local"));
    };

    const handleRemoveLocal = (serviceId: string) => {
      const isNew = newServices.some((s) => s.service_id === serviceId);

      if (isNew) {
        setNewServices((prev) => prev.filter((s) => s.service_id !== serviceId));
        setServices((prev) => prev.filter((s) => s.service_id !== serviceId));
        toast.info(t("details.services.toast_removed_local"));
      } else {
        const service = services.find(s => s.service_id === serviceId);
        setServiceToRemove({ id: serviceId, name: service?.service_name ?? "" });
      }
    };

    const confirmRemoval = () => {
      if (serviceToRemove) {
        setRemovedIds((prev) => [...prev, serviceToRemove.id]);
        setServices((prev) => prev.filter((s) => s.service_id !== serviceToRemove.id));
        setServiceToRemove(null);
        toast.warning(t("details.services.toast_marked_for_deletion"));
      }
    };

    const handleSaveSync = async () => {
      if (!token || !branchId){
         return;
      }
      setIsSaving(true);
      try {
        if (newServices.length > 0) {
          await api.products.addBranchService(newServices, branchId, token);
        }
        for (const id of removedIds) {
          await api.products.removeBranchService(branchId, id, token);
        }
        toast.success(t("details.services.save_success"));
        await fetchBranchServices();
      } catch (error) {
        toast.error(t("details.services.save_error"));
      } finally {
        setIsSaving(false);
      }
    };

    const handleUpdateService = async (updatedData: any) => {
      if (!serviceToEdit || !token || !branchId) {
        return;
      }
      try {
        await api.products.updateBranchService(branchId, serviceToEdit.service_id, updatedData, token);
        setServices((prev) =>
          prev.map((s) => s.service_id === serviceToEdit.service_id ? { ...s, ...updatedData } : s)
        );
        setEditModalOpen(false);
        toast.success(t("details.services.success_update", { name: serviceToEdit.service_name }));
      } catch (err) {
        toast.error(t("details.services.error_update"));
      }
    };

    const handleDiscard = () => {
      fetchBranchServices();
      toast.info(t("details.services.toast_discarded"));
    };

    const handleViewService = (service: BranchServicePrice) => {
      setServiceToEdit(service);
      setModalMode("view");
      setEditModalOpen(true);
    };

    const handleEditService = (service: BranchServicePrice) => {
      setServiceToEdit(service);
      setModalMode("edit");
      setEditModalOpen(true);
    };

    const hasChanges = newServices.length > 0 || removedIds.length > 0;
    const activeServiceIds = useMemo(() => services.map((s) => s.service_id), [services]);
    const totalPages = Math.ceil(services.length / pageSize) || 1;
    const currentServices = useMemo(() => {
      const start = (currentPage - 1) * pageSize;
      return services.slice(start, start + pageSize);
    }, [services, currentPage, pageSize]);

    const totalItems = services.length;
    const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);

    return (
      <div ref={ref} className="space-y-10 animate-in fade-in duration-500">
        <SectionHeader
          title={t("details.services.title")}
          subtitle={t("details.services.subtitle")}
          icon={LayoutList}
          isViewMode={isDisabled}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={onExportServices}
              disabled={isExporting === "branch-services" || isLoading}
              className="bg-white border-slate-200 text-slate-500 hover:text-orange-500 transition-all"
            >
              {isExporting === "branch-services" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {isExporting === "branch-services" ? t("details.services.exporting") : t("details.services.export")}
            </Button>
          }
        />

        {!isDisabled && token && (
          <div className="p-6 border rounded-2xl bg-slate-50/50 shadow-sm">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end text-left">
                <div className="space-y-1.5 lg:col-span-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">
                    {t("details.services.add.title")}
                  </label>
                  <ServiceGlobalSelector
                    token={token}
                    onSelect={setSelectedService}
                    excludeIds={activeServiceIds}
                    placeholder={t("details.services.add.select_placeholder")}
                  />
                </div>

                <InputField
                  label={t("details.services.add.capacity")}
                  type="number"
                  value={aforo}
                  onChange={(e) => setAforo(Number(e.target.value))}
                  className="bg-white"
                />
                <InputField
                  label={t("details.services.add.member_price")}
                  type="number"
                  value={priceMember}
                  onChange={(e) => setPriceMember(Number(e.target.value))}
                  className="bg-white"
                />
                <InputField
                  label={t("details.services.add.non_member_price")}
                  type="number"
                  value={priceNonMember}
                  onChange={(e) => setPriceNonMember(Number(e.target.value))}
                  className="bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedService || aforo <= 0}
                    onClick={handleAddLocal}
                    className="font-bold text-xs uppercase tracking-widest bg-white border-slate-200"
                  >
                    <Plus size={16} className="mr-2" /> {t("details.services.add.button")}
                  </Button>
                  <Button
                    onClick={handleSaveSync}
                    disabled={!hasChanges || isSaving}
                    className="font-bold text-xs uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-100 transition-all active:scale-95"
                  >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={16} className="mr-2" />}
                    {isSaving ? t("create.form.buttons.saving") : t("details.services.btn_sync")}
                  </Button>
                  {hasChanges && (
                    <Button
                      variant="ghost"
                      onClick={handleDiscard}
                      className="text-slate-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-tighter"
                    >
                      <RotateCcw size={14} className="mr-1" /> {t("details.services.btn_discard")}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="visible-check"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="h-4 w-4 rounded accent-orange-500 cursor-pointer"
                  />
                  <label htmlFor="visible-check" className="text-[11px] font-black uppercase tracking-tighter text-slate-500 cursor-pointer">
                    {t("details.services.add.visible")}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <h3 className="font-black uppercase tracking-[0.25em] text-slate-500 flex items-center gap-3">
              {t("details.services.assigned_title")} {services.length}
              {hasChanges && (
                <Badge className="bg-orange-50 text-orange-600 border-orange-100 animate-pulse font-black text-[10px]">
                  {t("details.services.badge_pending")}
                </Badge>
              )}
            </h3>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            {isLoading && services.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase animate-pulse tracking-widest italic">
                {t("details.services.loading")}
              </div>
            ) : services.length === 0 ? (
              <div className="p-12 text-center text-slate-300">
                <LayoutList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-[10px] uppercase font-black tracking-[0.2em]">
                  {t("details.services.empty")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentServices.map((service) => (
                  <div key={service.service_id} className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                    <EntityItem
                      initials={getInitials(service.service_name ?? "??")}
                      title={service.service_name ?? `${t("catalog.services.id_prefix")}: ${service.service_id}`}
                      description={t("details.services.description", {
                        capacity: service.max_capacity,
                        memberPrice: service.price_for_member,
                        nonMemberPrice: service.price_for_non_member,
                        visible: service.is_visible ? t("details.services.yes") : t("details.services.no"),
                      })}
                    />
                    {!isDisabled && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        <Button variant="ghost" size="icon" onClick={() => handleViewService(service)} className="h-9 w-9 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                          <Eye size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditService(service)} className="h-9 w-9 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Pencil size={17} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveLocal(service.service_id)} className="h-9 w-9 text-slate-400 hover:text-destructive hover:bg-red-50 rounded-lg">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {services.length > 0 && (
            <div className="flex items-center justify-between pt-4 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {t("pagination.show", { start: startIdx, end: endIdx, total: totalItems })}
                </span>
                <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
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
              <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>

        <EditBranchServiceModal
          open={editModalOpen && !!serviceToEdit}
          onClose={() => { setEditModalOpen(false); setServiceToEdit(null); }}
          service={serviceToEdit!}
          onSave={handleUpdateService}
          mode={modalMode}
        />

        <GeneralAlertDialog
          open={!!serviceToRemove}
          onOpenChange={(open) => !open && setServiceToRemove(null)}
          title={t("details.services.dialog_remove_title")}
          description={t("details.services.dialog_remove_description")}
          actionText={t("details.services.dialog_remove_action")}
          actionVariant="destructive"
          onAction={confirmRemoval}
        />
      </div>
    );
  },
);

BranchServicePanel.displayName = "BranchServicePanel";
export default BranchServicePanel;