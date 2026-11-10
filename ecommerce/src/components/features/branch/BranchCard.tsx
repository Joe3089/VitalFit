"use client";

import {
  MapPinIcon,
  PhoneIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

export interface BranchCardProps {
  branch: {
    branch_id: string;
    name: string;
    address: string;
    phone: string;
    schedule?: string;
  };
  index?: number;
}

export function BranchCard({ branch, index = 0 }: BranchCardProps) {
  const isFeatured = index % 2 === 1;

  return (
    <div
      className={`
        relative flex flex-col h-full min-h-[550px] rounded-[2rem] overflow-hidden border transition-all duration-500 group
        hover:-translate-y-3 hover:shadow-2xl ${
          isFeatured
            ? "bg-gradient-to-br from-orange-500 to-orange-700 border-transparent text-white shadow-orange-200/50 shadow-2xl"
            : "bg-white border-slate-100 text-slate-600 shadow-slate-200/60 shadow-xl"
        }
      `}
    >
      {isFeatured && (
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-colors duration-500" />
      )}

      <div className="p-10 flex flex-col h-full relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`h-1 w-8 rounded-full ${isFeatured ? "bg-orange-200" : "bg-orange-500"}`}
          />
          <span
            className={`text-[11px] uppercase tracking-[0.2em] font-black ${
              isFeatured ? "text-orange-100" : "text-orange-600"
            }`}
          >
            Sede Oficial
          </span>
        </div>

        <h3
          className={`text-3xl md:text-4xl font-black  uppercase tracking-tighter mb-8 leading-[0.9] ${
            isFeatured ? "text-white" : "text-slate-900"
          }`}
        >
          {branch.name}
        </h3>

        <div className="flex flex-col gap-7 flex-grow">
          <div className="flex items-start gap-5">
            <div
              className={`p-3 rounded-2xl shrink-0 shadow-sm ${isFeatured ? "bg-white/15" : "bg-orange-50"}`}
            >
              <MapPinIcon
                className={`w-6 h-6 ${isFeatured ? "text-white" : "text-orange-600"}`}
              />
            </div>
            <p className="text-sm md:text-base font-bold leading-snug pt-1 opacity-90">
              {branch.address}
            </p>
          </div>

          <div className="flex items-start gap-5">
            <div
              className={`p-3 rounded-2xl shrink-0 shadow-sm ${isFeatured ? "bg-white/15" : "bg-orange-50"}`}
            >
              <PhoneIcon
                className={`w-5 h-5 ${isFeatured ? "text-white" : "text-orange-600"}`}
              />
            </div>
            <p className="text-sm md:text-base font-bold pt-1.5 opacity-90">
              {branch.phone}
            </p>
          </div>

          <div className="flex items-start gap-5">
            <div
              className={`p-3 rounded-2xl shrink-0 shadow-sm ${isFeatured ? "bg-white/15" : "bg-orange-50"}`}
            >
              <CalendarDaysIcon
                className={`w-5 h-5 ${isFeatured ? "text-white" : "text-orange-600"}`}
              />
            </div>
            <div className="text-sm md:text-base font-bold leading-relaxed pt-1">
              <p className={isFeatured ? "text-orange-100" : "text-slate-400"}>
                Horario de Entrenamiento
              </p>
              {branch.schedule || (
                <div className="mt-1">
                  <span className="block font-black uppercase text-lg">
                    L-V: 06:00 - 21:00
                  </span>
                  <span className="block font-black uppercase text-lg">
                    Sáb: 07:00 - 17:00
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
