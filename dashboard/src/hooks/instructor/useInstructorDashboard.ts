"use client";

import { api } from "@/lib/sdk-config";
import { ClassScheduleItem, KPICard } from "@vitalfit/sdk";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface FlexibleKPICard extends Omit<KPICard, "value" | "target"> {
  value?: string | number;
  target?: string | number;
}

interface DashboardData {
  classesToday: ClassScheduleItem[];
  monthlyCount: FlexibleKPICard | null;
  nextClass: string;
  studentCount: FlexibleKPICard | null;
  attendanceRate: number; 
  studentsToday: number;  
}

export default function useInstructorDashboard(token: string | null) {
  const t = useTranslations("dashboards.InstructorDashboard");

  const [data, setData] = useState<DashboardData>({
    classesToday: [],
    monthlyCount: null,
    nextClass: t("classes_list.loading") || "...", 
    studentCount: null,
    attendanceRate: 0,
    studentsToday: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(
    async (isManual = false) => {
      if (!token) {
        return;
      }

      let toastId: string | number | undefined;
      if (isManual) {
        toastId = toast.loading(t("messages.updating"));
      }

      setIsLoading(true);

      try {
        const [
          todayRes, 
          monthlyRes, 
          nextRes, 
          studentRes, 
          attendanceRes, 
          studentsTodayRes
        ] = await Promise.all([
          api.report.instructorClassesToday(token),
          api.report.instructorMonthlyClassesCount(token),
          api.report.instructorNextClass(token),
          api.report.instructorStudentCountKPI(token),
          api.report.instructorAttendanceRate(token),
          api.report.instructorStudentsToday(token),
        ]);

        const rawNextClass = nextRes?.data;
        const normalizedNextClass = (rawNextClass === "Sin pendientes" || !rawNextClass)
          ? t("classes_list.empty")
          : rawNextClass;

        setData({
          classesToday: todayRes?.data || [],
          monthlyCount: (monthlyRes?.data as FlexibleKPICard) || null,
          nextClass: normalizedNextClass, 
          studentCount: (studentRes?.data as FlexibleKPICard) || null,
          attendanceRate: attendanceRes?.data ?? 0,
          studentsToday: studentsTodayRes?.data ?? 0,
        });

        if (isManual) {
          toast.success(t("messages.updated"), { id: toastId });
        }
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        toast.error(t("messages.error_loading"));
      } finally {
        setIsLoading(false);
      }
    },
    [token, t] 
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    isLoading,
    refresh: () => loadDashboardData(true),
  };
}