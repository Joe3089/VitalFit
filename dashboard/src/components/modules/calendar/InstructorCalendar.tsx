"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import { useAuth } from "@/context/AuthContext";
import { useSWRConfig } from "swr";
import { addMonths, subMonths, format, parseISO } from "date-fns";
import { useInstructorCalendar } from "@/hooks/class/useInstructorCalendar";
import { useCalendarResources } from "@/hooks/class/useCalendarResources";
import { CalendarDisplay } from "./CalendarDisplay";
import { AttendanceSheet } from "./AttendanceSheet";
import { InstructorToolbar } from "./InstructorToolbar";
import { useTranslations } from "next-intl";
import { api } from "@/lib/sdk-config";

export function InstructorCalendar() {
  const { token, user } = useAuth();
  const { mutate } = useSWRConfig();
  const calendarRef = useRef<FullCalendar>(null);
  const tDisplay = useTranslations("calendar.display");

  const userId = user?.user_id || "";
  const activeBranchId = useMemo(() => {
    if (!user?.activeBranch) {
        return user?.branch_id || "";
    }
    return typeof user.activeBranch === "string" 
      ? user.activeBranch 
      : user.activeBranch.id;
  }, [user]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("timeGridWeek");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const apiMonth = currentDate.getMonth() + 1;
  const apiYear = currentDate.getFullYear();
  const { services } = useCalendarResources(token || "", activeBranchId); 
  
  const { scheduleMap, isLoading, isSyncing } = useInstructorCalendar(
    userId,
    token || "",
    apiMonth,
    apiYear
  );

 const events = useMemo(() => {
    const allRawClasses = Object.values(scheduleMap).flat();

    return allRawClasses.map((item) => {
      const serviceInfo = services.find((s) => s.service_id === item.service_id);
      const serviceName = serviceInfo?.service_name || tDisplay("default_title");
      
      const cleanStart = item.starts_at.replace("Z", "");
      const cleanEnd = item.ends_at.replace("Z", "");

      const bName = user?.activeBranch && typeof user.activeBranch !== "string" 
        ? user.activeBranch.name 
        : "Sede Actual";

      return {
        id: item.class_id,
        title: `${serviceName} (${item.max_capacity || 0})`,
        start: cleanStart, 
        end: cleanEnd,
        extendedProps: {
          ...item,
          serviceName: serviceName,
          branchName: bName,
          displayTime: `${format(parseISO(cleanStart), "HH:mm")} - ${format(parseISO(cleanEnd), "HH:mm")}`,
        },
      };
    });
  }, [scheduleMap, services, tDisplay, user]);

  useEffect(() => {
    if (!userId || !token) {
        return;
    }
    const prefetch = async (date: Date) => {
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const key = ["instructor-calendar", userId, y, m];
      mutate(key, async () => {
        const res = await api.schedule.GetClassesByInstructor(token, userId, m, y);
        return res.data;
      }, { revalidate: false });
    };
    prefetch(addMonths(currentDate, 1));
    prefetch(subMonths(currentDate, 1));
  }, [currentDate, userId, token, mutate]);

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-xl overflow-hidden border shadow-sm">
      <InstructorToolbar 
        currentDate={currentDate}
        currentView={currentView}
        isLoading={isLoading || isSyncing}
        onNavigate={{
          next: () => calendarRef.current?.getApi().next(),
          prev: () => calendarRef.current?.getApi().prev(),
          today: () => calendarRef.current?.getApi().today(),
          changeView: (view: string) => {
            calendarRef.current?.getApi().changeView(view);
            setCurrentView(view);
          }
        }}
      />
      
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        )}

        <CalendarDisplay 
          ref={calendarRef}
          events={events}
          onEventClick={(id: string) => {
            setSelectedClassId(id);
            setIsAttendanceOpen(true);
          }}
          onViewChange={(info: any) => {
             setCurrentDate(info.view.currentStart);
          }}
        />
      </div>

      {isAttendanceOpen && selectedClassId && (
        <AttendanceSheet 
          classId={selectedClassId} 
          isOpen={isAttendanceOpen} 
          onClose={() => {
            setIsAttendanceOpen(false);
            setSelectedClassId(null);
          }} 
        />
      )}
    </div>
  );
}