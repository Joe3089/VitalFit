"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, ShieldCheck } from "lucide-react";
import { useBookingOperations } from "@/hooks/booking/useBookingOperations";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useClassBookings } from "@/hooks/booking/useClassBookings";
import { ReservationsTable } from "./ReservationsTable";
import { AttendanceTable } from "./AttendanceTable";
import { useClassAttendance } from "@/hooks/booking/useClassAttendance";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

interface Props {
  classId: string;
  token: string;
  canManage?: boolean;
}

export function BookingAttendanceManager({
  classId,
  token,
  canManage = false,
}: Props) {
  const t = useTranslations("calendar.attendance_manager");
  const [activeTab, setActiveTab] = useState("reservas");

  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  const { cancel: cancelBooking, isProcessing } = useBookingOperations(token);

  const {
    participants,
    isLoading: isLoadingBookings,
    total: totalBookings,
    currentPage: pageBookings,
    setPage: setPageBookings,
    refresh: refreshBookings,
  } = useClassBookings(activeTab === "reservas" ? token : null, classId);

  const {
    attendance,
    isLoading: isLoadingAttendance,
    total: totalAttendance,
    currentPage: pageAttendance,
    setPage: setPageAttendance,
  } = useClassAttendance(activeTab === "asistencia" ? token : null, classId);

  const onOpenCancelDialog = (bookingId: string) => {
    if (!canManage) {
      return;
    }
    setPendingCancelId(bookingId);
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancelId){
       return;
    }

    try {
      const success = await cancelBooking(pendingCancelId);
      if (success) {
        refreshBookings();
        toast.success(t("status.cancelled"));
      }
    } catch (err) {
      console.error("Error in cancel:", err);
      toast.error(t("labels.error_cancel"));
    } finally {
      setPendingCancelId(null); 
    }
  };

  const currentTotal = activeTab === "reservas" ? totalBookings : totalAttendance;

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <TabsTrigger value="reservas" className="text-xs font-bold px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase">
              {t("tabs.bookings")}
            </TabsTrigger>
            <TabsTrigger value="asistencia" className="text-xs font-bold px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase">
              {t("tabs.attendance")}
            </TabsTrigger>
          </TabsList>

          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
            {t("labels.total_students", { count: currentTotal })}
          </div>
        </div>

        <TabsContent value="reservas" className="mt-0 focus-visible:outline-none">
          <ReservationsTable
            data={participants}
            isLoading={isLoadingBookings}
            total={totalBookings}
            currentPage={pageBookings}
            onPageChange={setPageBookings}
            onCancel={onOpenCancelDialog} 
            isProcessing={isProcessing}
            canManage={canManage}
          />
        </TabsContent>

        <TabsContent value="asistencia" className="mt-0 focus-visible:outline-none">
          <AttendanceTable
            data={attendance}
            isLoading={isLoadingAttendance}
            total={totalAttendance}
            currentPage={pageAttendance}
            onPageChange={setPageAttendance}
          />
        </TabsContent>
      </Tabs>
      
      <GeneralAlertDialog
        open={!!pendingCancelId}
        onOpenChange={(isOpen) => !isOpen && setPendingCancelId(null)}
        title={t("table.delete_dialog.title")}
        description={t("table.delete_dialog.description")}
        actionText={t("table.delete_dialog.confirm")}
        cancelText={t("table.delete_dialog.cancel")}
        onAction={handleConfirmCancel} 
        actionVariant="destructive"
        className="z-[110]"
      />

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 mt-4 shadow-inner">
        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
          {canManage ? (
            <Info className="w-4 h-4 text-orange-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-slate-800 font-bold leading-none">
            {canManage ? t("info_panel.admin_title") : t("info_panel.instructor_title")}
          </p>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
            {canManage ? t("info_panel.admin_desc") : t("info_panel.instructor_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}