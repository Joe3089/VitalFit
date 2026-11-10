"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface InstructorToolbarProps {
  currentDate: Date;
  currentView: string;
  isLoading?: boolean;
  onNavigate: {
    next: () => void;
    prev: () => void;
    today: () => void;
    changeView: (view: string) => void;
  };
}

export function InstructorToolbar({
  currentDate,
  currentView,
  isLoading,
  onNavigate,
}: InstructorToolbarProps) {
  const t = useTranslations("calendar.toolbar");
  const locale = useLocale();
  const month = currentDate.toLocaleString(locale, { month: "long" });
  const year = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 select-none sticky top-0 z-30 h-[72px]">
      <div className="flex items-center gap-6">
        <div className="flex items-baseline gap-2 min-w-[200px]">
          <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
            {month}
          </h1>
          <span className="text-xl font-medium text-slate-300">{year}</span>
          
          {isLoading && (
            <div className="ml-4 flex items-center gap-2 px-2 py-1 bg-orange-50 rounded-lg border border-orange-100">
              <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-tighter">
                {t("syncing") || "Sincronizando"}
              </span>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {locale === "es" ? "Mi Agenda Personal" : "Personal Schedule"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
          <ViewButton
            active={currentView.includes("timeGrid")}
            onClick={() => onNavigate.changeView("timeGridWeek")}
            label={t("week")}
          />
          <ViewButton
            active={currentView.includes("dayGrid")}
            onClick={() => onNavigate.changeView("dayGridMonth")}
            label={t("month")}
          />
        </div>

        <div className="h-8 w-[1px] bg-slate-100 mx-1" />
        <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-10">
          <button
            onClick={onNavigate.today}
            className="px-5 h-full text-[10px] font-black text-slate-600 hover:bg-slate-50 border-r border-slate-100 transition-colors uppercase"
          >
            {t("today")}
          </button>
          
          <NavButton
            onClick={onNavigate.prev}
            icon={<ChevronLeftIcon className="h-4 w-4 stroke-[3.5px]" />}
          />
          
          <NavButton
            onClick={onNavigate.next}
            icon={<ChevronRightIcon className="h-4 w-4 stroke-[3.5px]" />}
          />
        </div>
      </div>
    </div>
  );
}

const ViewButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-5 py-1.5 text-[11px] font-black rounded-lg transition-all duration-200",
      active
        ? "bg-white text-orange-600 shadow-sm ring-1 ring-black/5"
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
    )}
  >
    {label}
  </button>
);

const NavButton = ({
  onClick,
  icon,
}: {
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="px-3 h-full hover:bg-slate-50 border-r last:border-r-0 border-slate-100 active:bg-slate-100 transition-colors text-slate-400 hover:text-orange-600"
  >
    {icon}
  </button>
);