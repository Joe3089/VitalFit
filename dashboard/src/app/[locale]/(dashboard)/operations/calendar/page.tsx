"use client";

import { ClassCalendar } from "@/components/modules/calendar/ClassCalendar";
import { InstructorCalendar } from "@/components/modules/calendar/InstructorCalendar";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/roles";
import { Loader2 } from "lucide-react";

export default function ClassesMethodsPage() {
  const { token, user, loading } = useAuth();
  if (loading || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Verificando Credenciales...
          </p>
        </div>
      </div>
    );
  }

  if (user?.role === UserRole.INSTRUCTOR) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <InstructorCalendar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <ClassCalendar />
    </div>
  );
}