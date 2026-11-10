"use client";

import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BookingAttendanceManager } from "./BookingAttendanceManager";
import {
  Users,
  Loader2,
  Search,
  UserPlus2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBookingOperations } from "@/hooks/booking/useBookingOperations";
import { Button } from "@/components/ui/button";
import { useUserByEmail } from "@/hooks/users/useUserByEmail";
import { UserSelectionCard } from "../user/UserSelectionCard";
import { useTranslations } from "next-intl";
import { useClassBookings } from "@/hooks/booking/useClassBookings";

interface AttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
}

export function AttendanceSheet({
  isOpen,
  onClose,
  classId,
}: AttendanceSheetProps) {
  const t = useTranslations("calendar.attendance_sheet");
  const { token, user } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [emailToSearch, setEmailToSearch] = useState<string | null>(null);

  const role = user?.role?.toLowerCase();

  const canInscribeManually = useMemo(() => {
    const allowedRoles = ["super_admin", "branch_admin", "admin", "recepcionist"];
    return allowedRoles.includes(role || "");
  }, [role]);

  const { 
    userData, 
    isLoading: searching, 
    clearUser 
  } = useUserByEmail(token, emailToSearch);

  const { book, isProcessing: isBooking } = useBookingOperations(token);
  const { refresh } = useClassBookings(isOpen ? token : null, classId);

  if (!token) {
    return null;
  }

  const handleSearchUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (cleanEmail.includes("@")) {
      setEmailToSearch(cleanEmail);
    }
  };

  const handleManualInscribe = async () => {
    const userId = userData?.user_id || userData?.data?.user_id;
    
    if (!userId) {
      return;
    }

    try {
      const success = await book(classId, userId);
      if (success) {
        clearUser();
        setEmailInput("");
        setEmailToSearch(null);
        refresh(); 
      }
    } catch (err) {
      console.error("Error en inscripción manual:", err);
    }
  };

  const handleClose = () => {
    clearUser();
    setEmailInput("");
    setEmailToSearch(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[800px] p-0 border-l border-slate-200 shadow-2xl flex flex-col z-[100]"
      >
        <SheetHeader className="p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-xl font-black text-slate-900 leading-tight">
                {t("title")}
              </SheetTitle>
              <SheetDescription className="text-xs font-medium text-slate-500">
                {canInscribeManually ? t("desc_admin") : t("desc_instructor")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar space-y-8">
          {canInscribeManually ? (
            <section className="space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center gap-2 px-1">
                <UserPlus2 className="w-4 h-4 text-slate-400" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t("section_inscribe")}
                </h4>
              </div>

              {!userData ? (
                <form onSubmit={handleSearchUser} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="email"
                      placeholder={t("search_placeholder")}
                      className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all shadow-sm"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={searching || !emailInput}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-2xl font-bold text-xs h-11 transition-all"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : t("search_button")}
                  </Button>
                </form>
              ) : (
                <UserSelectionCard
                  user={userData.data || userData}
                  onConfirm={handleManualInscribe}
                  onClear={() => {
                    clearUser();
                    setEmailToSearch(null);
                  }}
                  isProcessing={isBooking}
                  variant="enroll" 
                />
              )}
            </section>
          ) : (
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              <p className="text-xs font-semibold">{t("instructor_mode")}</p>
            </div>
          )}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {t("list_title")}
              </span>
            </div>
          </div>

          <div className="space-y-4">
              <BookingAttendanceManager
                classId={classId}
                token={token}
                canManage={canInscribeManually}
              />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}