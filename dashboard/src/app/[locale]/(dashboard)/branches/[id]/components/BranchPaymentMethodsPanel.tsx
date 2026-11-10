"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  CreditCard, 
  Plus, 
  RotateCcw, 
  Trash2, 
  Save, 
  WalletCards,
  Loader2 
} from "lucide-react";
import { BranchPaymentMethodInfo, PaymentMethod } from "@vitalfit/sdk";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import EntityItem from "@/components/layout/EntityItem";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";
import { SectionHeader } from "@/components/modules/branches/SectionHeader";

interface Props {
  branchId: string;
  mode?: "edit" | "view";
}

export default function BranchPaymentMethodPanel({ branchId, mode = "edit" }: Props) {
  const t = useTranslations("branches.details.payment_methods");
  const { token } = useAuth();
  const isViewMode = mode === "view";

  const [allMethods, setAllMethods] = useState<PaymentMethod[]>([]);
  const [branchMethods, setBranchMethods] = useState<BranchPaymentMethodInfo[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !branchId) {
      return;
    }
    setLoading(true);
    try {
      const [catalogRes, branchRes] = await Promise.all([
        api.paymentMethod.getPaymentMethods(token),
        api.paymentMethod.getBranchPaymentMethods(branchId, token)
      ]);
      setAllMethods(catalogRes.data || []);
      setBranchMethods(branchRes.data || []);
      setPendingIds([]);
      setRemovedIds([]);
    } catch (err) {
      toast.error(t("toast_error_load"));
    } finally {
      setLoading(false);
    }
  }, [branchId, token, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddToQueue = useCallback(() => {
    if (!selectedId){
       return;
    }
    
    const method = allMethods.find(x => x.method_id === selectedId);
    if (!method) {
      return;
    }

    if (removedIds.includes(selectedId)) {
      setRemovedIds(prev => prev.filter(id => id !== selectedId));
    } else {
      setPendingIds(prev => [...prev, method.method_id]);
    }

    setBranchMethods(prev => [...prev, { ...method, branch_id: branchId, is_active: true }]);
    setSelectedId("");
    toast.info(t("toast_added_local"));
  }, [selectedId, allMethods, branchId, removedIds, t]);

  const handleRemoveClick = (id: string) => {
    if (pendingIds.includes(id)) {
      setBranchMethods(prev => prev.filter(m => m.method_id !== id));
      setPendingIds(prev => prev.filter(curr => curr !== id));
      toast.info(t("toast_removed_local"));
    } else {
      setMethodToRemove(id);
    }
  };

  const confirmRemoval = () => {
    if (methodToRemove) {
      setRemovedIds(prev => [...prev, methodToRemove]);
      setMethodToRemove(null);
      toast.warning(t("toast_marked_for_deletion"));
    }
  };

  const handleSyncChanges = async () => {
    if (!token || !branchId) {
      return;
    }
    setIsSaving(true);
    try {
      if (pendingIds.length > 0) {
        await api.paymentMethod.addBranchPaymentMethod(branchId, pendingIds, token);
      }
      if (removedIds.length > 0) {
        for (const id of removedIds) {
          await api.paymentMethod.removeBranchPaymentMethod(branchId, id, token);
        }
      }
      toast.success(t("toast_sync_success"));
      await fetchData();
    } catch (error) {
      toast.error(t("toast_sync_error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    fetchData();
    toast.info(t("toast_discarded"));
  };

  const displayMethods = useMemo(() => {
    return branchMethods.filter(m => !removedIds.includes(m.method_id));
  }, [branchMethods, removedIds]);

  const hasChanges = pendingIds.length > 0 || removedIds.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title={t("title")}
        subtitle={t("subtitle")}
        icon={CreditCard}
        isViewMode={isViewMode}
      />

      {!isViewMode && (
        <Card className="border shadow-none bg-slate-50/40">
          <CardHeader className="pb-4 text-left">
            <CardTitle className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              {t("add_card_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full sm:w-[350px] bg-white">
                  <SelectValue placeholder={t("selector_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {allMethods
                    .filter(m => !branchMethods.some(bm => bm.method_id === m.method_id) && !pendingIds.includes(m.method_id))
                    .map((method) => (
                      <SelectItem key={method.method_id} value={method.method_id}>
                        {method.name} <span className="text-muted-foreground ml-1">({method.type})</span>
                      </SelectItem>
                    ))}
                  {allMethods.length === 0 && (
                     <p className="p-2 text-xs text-center text-muted-foreground">{t("no_methods_available")}</p>
                  )}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddToQueue} 
                disabled={!selectedId} 
                variant="outline"
                className="bg-white font-bold text-xs uppercase tracking-widest border-slate-200 shadow-sm transition-all active:scale-95"
              >
                <Plus className="mr-2 h-4 w-4" /> {t("btn_add")}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
              <div className="flex gap-2">
                <Button 
                  onClick={handleSyncChanges} 
                  disabled={!hasChanges || isSaving}
                  className="font-bold text-xs uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white shadow-lg transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? t("btn_saving") : t("btn_sync")}
                </Button>
                {hasChanges && (
                  <Button 
                    variant="ghost" 
                    onClick={handleDiscard}
                    className="text-slate-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-tighter transition-colors"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    {t("btn_discard")}
                  </Button>
                )}
              </div>
              {hasChanges && (
                <Badge className="bg-orange-50 text-orange-600 border-orange-100 animate-pulse font-black text-[10px]">
                  {t("badge_pending")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
           <h3 className="font-black uppercase tracking-[0.25em] text-slate-500">
            {t("total_label", { count: displayMethods.length })}
          </h3>
        </div>

        <div className="rounded-xl border bg-white divide-y overflow-hidden shadow-sm">
          {loading && branchMethods.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase animate-pulse tracking-widest italic">
              {t("loading")}
            </div>
          ) : displayMethods.length === 0 ? (
            <div className="p-12 text-center text-slate-300">
              <WalletCards className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-[10px] uppercase font-black tracking-[0.2em]">{t("empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayMethods.map((method) => (
                <div 
                  key={method.method_id} 
                  className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <EntityItem
                    initials={method.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    title={method.name}
                    description={method.type}
                  />
                  {!isViewMode && (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveClick(method.method_id)}
                        className="h-9 w-9 text-slate-400 hover:text-destructive hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <GeneralAlertDialog
        open={!!methodToRemove}
        onOpenChange={(open) => !open && setMethodToRemove(null)}
        title={t("dialog_remove_title")}
        description={t("dialog_remove_description")}
        actionText={t("dialog_remove_action")}
        actionVariant="destructive"
        onAction={confirmRemoval}
      />
    </div>
  );
}