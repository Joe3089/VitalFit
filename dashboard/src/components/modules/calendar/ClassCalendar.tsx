"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import { useAuth } from "@/context/AuthContext";
import { useSWRConfig } from "swr";
import { format, parseISO, addMonths, subMonths } from "date-fns";
import { useCalendarResources } from "@/hooks/class/useCalendarResources";
import { useClientBookings } from "@/hooks/booking/useClientBookings";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarDisplay } from "./CalendarDisplay";
import { CreateClassSheet } from "./CreateClassSheet";
import { EditClassPopover } from "./EditClassPopover";
import { useTranslations } from "next-intl";
import { MapPinIcon } from "lucide-react";
import { UserRole } from "@/lib/roles";
import { api } from "@/lib/sdk-config";
import { useBranchCalendar } from "@/hooks/class/useBranchCalendar";

export function ClassCalendar() {
  const { token, user } = useAuth();
  const { mutate } = useSWRConfig();
  const calendarRef = useRef<FullCalendar>(null);

  const tGeneral = useTranslations("calendar");
  const tToolbar = useTranslations("calendar.toolbar");
  const tDisplay = useTranslations("calendar.display");

  const role = user?.role as UserRole;
  const isSuperAdmin = useMemo(() => role === UserRole.SUPER_ADMIN, [role]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("timeGridWeek");
  
  const apiMonth = useMemo(() => currentDate.getMonth() + 1, [currentDate]);
  const apiYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeBranchId = useMemo(() => {
    const val = user?.activeBranch || user?.branch_id;
    if (!val) {
      return "";
    }
    return typeof val === "string" ? val : val.id;
  }, [user]);

  const branchToUse = selectedBranchId || activeBranchId;

  const { branches, services, instructors, isLoadingResources } =useCalendarResources(token, branchToUse);

  const { scheduleMap, isLoading: isLoadingClasses } = useBranchCalendar(
    branchToUse || null,
    token || "",
    apiMonth,
    apiYear
  );

  const { availableClasses, isAvailabilityLoading } = useClientBookings(
    token,
    focusedUserId,
    branchToUse
  );

  useEffect(() => {
    if (!branchToUse || !token){
       return;
    }

    const prefetchMonth = async (date: Date) => {
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const key = ["branches", branchToUse, "schedule", y, m];

      mutate(key, async () => {
        const response = await api.schedule.ListBranchesClass(branchToUse, token, m, y);
        return response.data;
      }, { revalidate: false }); 
    };

    prefetchMonth(addMonths(currentDate, 1));
    prefetchMonth(subMonths(currentDate, 1));
  }, [currentDate, branchToUse, token, mutate]);

  const events = useMemo(() => {
    const allEvents = Object.values(scheduleMap).flat();
    const bookedIds = new Set(availableClasses.map((c) => c.class_id));

    return allEvents.map((item) => {
      const serviceInfo = services.find((s) => s.service_id === item.service_id);
      const startDate = parseISO(item.starts_at);
      const endDate = parseISO(item.ends_at);
      const isBookedByClient = focusedUserId ? bookedIds.has(item.class_id) : false;

      return {
        id: item.class_id,
        title: serviceInfo?.service_name || tDisplay("default_title"),
        start: startDate,
        end: endDate,
        className: focusedUserId
          ? isBookedByClient ? "event-highlighted" : "event-dimmed"
          : "",
        extendedProps: {
          ...item,
          isBookedByClient,
          serviceName: serviceInfo?.service_name,
          displayTime: `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`,
        },
      };
    });
  }, [scheduleMap, services, tDisplay, focusedUserId, availableClasses]);

  useEffect(() => {
    if (activeBranchId && !isSuperAdmin) {
      setSelectedBranchId(activeBranchId);
    } else if (isSuperAdmin && !selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].branch_id);
    }
  }, [activeBranchId, isSuperAdmin, branches, selectedBranchId]);

  const refreshData = () => {
    mutate((key: any) => Array.isArray(key) && key.includes("schedule"));
  };

  const handleViewChange = useCallback((info: any) => {
    const newDate = info.view.currentStart;
    setCurrentDate((prev) => {
      if (prev.getMonth() === newDate.getMonth() && prev.getFullYear() === newDate.getFullYear()) {
        return prev;
      }
      return newDate;
    });
    setCurrentView(info.view.type);
  }, []);

  const filteredBranches = useMemo(() => {
    if (isSuperAdmin) {
      return branches;
    }
    return branches.filter((b) => b.branch_id === activeBranchId);
  }, [branches, isSuperAdmin, activeBranchId]);

  if (!isSuperAdmin && activeBranchId === "" && !isLoadingResources) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 m-4 text-center px-6">
        <MapPinIcon className="h-10 w-10 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-900">{tGeneral("no_branch_title")}</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">{tGeneral("no_branch_description")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-xl overflow-hidden border shadow-sm">
      <CalendarToolbar
        currentDate={currentDate}
        currentView={currentView}
        branches={filteredBranches}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        focusedUserId={focusedUserId}
        onFocusClient={setFocusedUserId}
        onNavigate={{
          next: () => calendarRef.current?.getApi().next(),
          prev: () => calendarRef.current?.getApi().prev(),
          today: () => calendarRef.current?.getApi().today(),
          changeView: (view: string) => {
            calendarRef.current?.getApi().changeView(view);
            setCurrentView(view);
          },
        }}
        isLoading={isLoadingClasses || isAvailabilityLoading}
        onCreateClick={() => setIsCreateModalOpen(true)}
        userRole={role}
      />

      <div className="flex-1 relative">
        {(isLoadingClasses || isAvailabilityLoading) && (
          <div className="absolute inset-0 bg-white/40 z-20 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {tToolbar("syncing")}
              </p>
            </div>
          </div>
        )}

        <CalendarDisplay
          ref={calendarRef}
          events={events}
          onEventClick={(id: string) => {
            setSelectedClassId(id);
            setIsEditModalOpen(true);
          }}
          onViewChange={handleViewChange}
        />
      </div>

      {isCreateModalOpen && (
        <CreateClassSheet
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={refreshData}
        />
      )}

      {isEditModalOpen && selectedClassId && (
        <EditClassPopover
          classId={selectedClassId}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClassId(null);
          }}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
}