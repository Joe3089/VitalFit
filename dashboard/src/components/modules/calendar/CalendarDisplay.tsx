"use client";

import React, { forwardRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { Lock, CheckCircle2, Users, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CalendarDisplayProps {
  events: any[];
  onEventClick: (classId: string) => void;
  onDateClick?: (date: string) => void;
  onViewChange?: (info: any) => void;
  [key: string]: any;
}

export const CalendarDisplay = forwardRef<FullCalendar, CalendarDisplayProps>(
  ({ events, onEventClick, onDateClick, onViewChange, ...props }, ref) => {
    const t = useTranslations("calendar.display");
    const memoizedEvents = useMemo(() => events, [events]);

    return (
      <div className="h-full w-full bg-slate-50 overflow-hidden flex flex-col border-2 border-slate-200 rounded-2xl shadow-xl">
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          events={memoizedEvents}
          height="100%"
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          scrollTime="08:00:00"
          headerToolbar={false}
          nowIndicator={true}
          stickyHeaderDates={true}
          
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            onEventClick(String(info.event.id));
          }}

          eventContent={(eventInfo) => {
            const { is_visible, max_capacity, serviceName, displayTime, isBookedByClient } =
              eventInfo.event.extendedProps || {};

            const isMonthView = eventInfo.view.type === "dayGridMonth";
            const isAnyFocused = eventInfo.event.classNames.includes("event-dimmed");

            return (
              <div
                className={cn(
                  "flex flex-col h-full w-full p-2.5 rounded-xl border-2 transition-all duration-300",
                  "border-l-[6px] shadow-md hover:scale-[1.02]",
                  isBookedByClient
                    ? "bg-green-100 border-green-300 border-l-green-600 text-green-950 ring-2 ring-green-500/20"
                    : is_visible 
                      ? "bg-orange-100 border-orange-200 border-l-orange-600 text-slate-950" 
                      : "bg-slate-200 border-slate-300 border-l-slate-500 text-slate-500 opacity-60 grayscale",
                  
                  isAnyFocused && !isBookedByClient && "opacity-40 blur-[0.5px]",
                  "cursor-pointer overflow-hidden"
                )}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className={cn(
                    "font-black truncate uppercase tracking-tight leading-tight",
                    isMonthView ? "text-[10px]" : "text-[12px] sm:text-[13px]"
                  )}>
                    {!is_visible && <Lock className="w-3 h-3 inline mr-1 text-slate-600" />}
                    {serviceName || eventInfo.event.title}
                  </span>

                  {isBookedByClient && (
                    <div className="bg-green-600 rounded-full p-0.5 shadow-sm shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className={cn(
                  "mt-auto flex flex-col gap-1.5 pt-2 border-t",
                  isBookedByClient ? "border-green-300/50" : "border-orange-300/40"
                )}>
                  {/* Badge de Tiempo */}
                  <div className="flex items-center gap-1.5">
                    <Clock className={cn(
                      "w-3.5 h-3.5 stroke-[3px]",
                      isBookedByClient ? "text-green-600" : "text-orange-600"
                    )} />
                    <span className="text-[10px] font-extrabold">
                      {displayTime || eventInfo.timeText}
                    </span>
                  </div>

                  {!isMonthView && (
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-lg text-white shadow-sm",
                        isBookedByClient ? "bg-green-700" : "bg-orange-600"
                      )}>
                        <Users className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black">{max_capacity}</span>
                      </div>
                      
                      {isBookedByClient && (
                        <span className="text-[9px] font-black uppercase text-green-700 tracking-tighter">
                          Reservado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
          {...props}
        />

        <style jsx global>{`
          .fc { 
            --fc-border-color: #e2e8f0; 
            --fc-today-bg-color: #fff7ed; 
            background-color: #f8fafc;
          }

          .fc-timegrid-slot {
            height: 5.5rem !important;
            border-bottom: 1px solid #cbd5e1 !important;
          }

          .fc-v-event, .fc-daygrid-event {
            background-color: transparent !important;
            border: none !important;
            padding: 4px 6px !important;
          }

          .fc-col-header-cell-cushion {
            color: #1e293b !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 16px 0 !important;
            text-decoration: none !important;
          }

          .fc-timegrid-now-indicator-line {
            border-color: #ea580c !important;
            border-width: 3px 0 0 !important;
          }
        `}</style>
      </div>
    );
  },
);

CalendarDisplay.displayName = "CalendarDisplay";