"use client";

import {
  MapPinIcon,
  BuildingStorefrontIcon,
  ChevronRightIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export interface BranchCardInfoProps {
  title: string;
  location: string;
  phone: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function BranchCardInfo({
  title,
  location,
  phone,
  isActive = false,
  onClick,
}: BranchCardInfoProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between p-4 md:p-5 rounded-[1.25rem] border transition-all duration-500 cursor-pointer w-full overflow-hidden",
        "bg-white border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] hover:border-orange-200",
        isActive &&
          "border-orange-500 bg-gradient-to-r from-orange-50/50 to-white shadow-[0_10px_40px_-10px_rgba(242,127,42,0.2)] ring-1 ring-orange-500/20",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-orange-500 transition-all duration-300 rounded-r-full",
          isActive && "h-10",
        )}
      />

      <div className="flex items-center flex-1 min-w-0">
        <div className="shrink-0">
          <div
            className={cn(
              "h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
              isActive
                ? "bg-orange-500 text-white shadow-orange-200"
                : "bg-slate-50 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500 group-hover:rotate-3",
            )}
          >
            <BuildingStorefrontIcon className="h-6 w-6 md:h-7 md:w-7" />
          </div>
        </div>

        <div className="flex-1 min-w-0 ml-4 md:ml-5">
          <h4
            className={cn(
              "font-heading text-xl md:text-2xl uppercase leading-none mb-1.5 tracking-tight transition-colors duration-300",
              isActive
                ? "text-orange-600"
                : "text-slate-900 group-hover:text-orange-500",
            )}
          >
            {title}
          </h4>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-slate-500">
              <MapPinIcon
                className={cn(
                  "h-4 w-4 shrink-0 mt-0.5 transition-colors",
                  isActive
                    ? "text-orange-400"
                    : "text-slate-400 group-hover:text-orange-400",
                )}
              />
              <p className="text-xs md:text-sm leading-tight line-clamp-1 font-medium font-body opacity-80">
                {location}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <PhoneIcon
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-all",
                  isActive
                    ? "text-orange-500 animate-pulse"
                    : "text-slate-400 group-hover:text-orange-400",
                )}
              />
              <p
                className={cn(
                  "text-[10px] md:text-xs font-black tracking-widest uppercase font-body",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-400 group-hover:text-slate-600",
                )}
              >
                {phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 ml-4">
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
            isActive
              ? "bg-orange-100 text-orange-600"
              : "bg-slate-50 text-slate-300 group-hover:bg-orange-50 group-hover:text-orange-400",
          )}
        >
          <ChevronRightIcon
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              isActive
                ? "translate-x-0.5 scale-110"
                : "group-hover:translate-x-0.5",
            )}
          />
        </div>
      </div>
    </div>
  );
}
