"use client";

import React, { useState } from "react";
import { 
  Search, Clock, Loader2, Fingerprint, 
  X, ShieldCheck, UserCheck, 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useUserByEmail } from "@/hooks/users/useUserByEmail";
import { useCheckIn } from "@/hooks/access/useCheckIn";
import { UserSelectionCard } from "../user/UserSelectionCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

interface ManualCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  activeBranchId: string;
  onSuccess?: () => void;
}

export function ManualCheckInModal({ 
  isOpen, 
  onClose, 
  token, 
  activeBranchId,
  onSuccess 
}: ManualCheckInModalProps) {
  const t = useTranslations("dashboards.ReceptionDashboard.manualCheckInModal");
  const [inputValue, setInputValue] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { userData, isLoading: isSearching, clearUser } = useUserByEmail(token, submittedEmail);
  const { processCheckIn, isCheckingIn } = useCheckIn(token);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSubmittedEmail(inputValue);
    }
  };

  const handleClose = () => {
    setInputValue("");
    setSubmittedEmail(null);
    clearUser();
    onClose();
  };

  const onConfirmCheckIn = async () => {
    if (!userData?.data?.user_id || !activeBranchId) {
      return;
    }
    
    const response = await processCheckIn(userData.data.user_id, activeBranchId);

    if (response) {
      if (onSuccess) {
        onSuccess(); 
      }
      handleClose(); 
    }
  };

return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white border-slate-200 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
          <div className="md:col-span-5 p-8 border-r border-slate-100 bg-white flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <Fingerprint className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {t("title")}
                </DialogTitle>
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                  {t("console")}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="search-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t("search.label")}
                </Label>
                <div className="relative group">
                  <Input
                    id="search-email"
                    placeholder={t("search.placeholder")}
                    type="email"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-orange-500 transition-all"
                  />
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-orange-500" />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSearching || !inputValue}
                  className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-sm uppercase text-[11px] tracking-widest transition-all"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  {t("search.button")}
                </Button>
              </div>
            </form>

            <Separator className="my-8" />

            <div className="space-y-4">
              <Alert className="bg-orange-50/50 border-orange-100 py-4 rounded-2xl border-dashed shadow-none">
                <Clock className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-[11px] font-medium leading-relaxed">
                  {t("policies.timeRuleDescription")}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div className="md:col-span-7 p-8 bg-slate-50/40 flex flex-col justify-center items-center relative">
            
            <div className="w-full max-w-md space-y-8 text-center">
              {userData?.data ? (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                  <div className="flex flex-col items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="h-3 w-3 mr-2" />
                      {t("results.verified")}
                    </Badge>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {t("results.title")}
                    </h4>
                  </div>

                  <UserSelectionCard
                    user={userData.data}
                    variant="focus" 
                    onClear={() => {
                      setInputValue("");
                      setSubmittedEmail(null);
                      clearUser();
                    }}
                    onConfirm={() => {}} 
                  />

                  <Button
                    onClick={onConfirmCheckIn}
                    disabled={isCheckingIn || !userData.data.has_active_membership}
                    className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isCheckingIn ? (
                      <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    ) : (
                      <UserCheck className="h-6 w-6 mr-3" />
                    )}
                    {isCheckingIn ? t("actions.loading") : t("actions.confirm")}
                  </Button>

                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                    {t("results.footerNote")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50 space-y-4">
                  <div className="p-6 bg-slate-100 rounded-full text-slate-300">
                    <Search className="h-12 w-12" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      {t("results.waiting")}
                    </p>
                    <p className="text-[11px] text-slate-300 font-medium max-w-[200px]">
                      {t("results.waitingDescription")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}