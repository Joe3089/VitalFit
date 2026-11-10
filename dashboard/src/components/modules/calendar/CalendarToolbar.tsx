"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations, useLocale } from "next-intl";
import { UserRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { UserSelectionCard } from "../user/UserSelectionCard";
import { useUserByEmail } from "@/hooks/users/useUserByEmail";
import { useAuth } from "@/context/AuthContext";

interface Branch {
  branch_id: string;
  name: string;
}

interface CalendarToolbarProps {
  currentDate: Date;
  currentView: string;
  branches: Branch[];
  selectedBranchId: string;
  onBranchChange: (id: string) => void;
  onNavigate: {
    next: () => void;
    prev: () => void;
    today: () => void;
    changeView: (view: string) => void;
  };
  onCreateClick: () => void;
  isLoading?: boolean;
  userRole?: string;
  focusedUserId: string | null;
  onFocusClient: (id: string | null) => void;
}

export function CalendarToolbar({
  currentDate,
  currentView,
  branches,
  selectedBranchId,
  onBranchChange,
  onNavigate,
  onCreateClick,
  isLoading,
  userRole,
  focusedUserId,
  onFocusClient,
}: CalendarToolbarProps) {
  const { token } = useAuth();
  const t = useTranslations("calendar.toolbar");
  const locale = useLocale();

  const [searchEmail, setSearchEmail] = React.useState("");
  const [debouncedEmail, setDebouncedEmail] = React.useState("");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(searchEmail);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchEmail]);

  const { userData, isLoading: isSearching } = useUserByEmail(
    token,
    debouncedEmail
  );

  React.useEffect(() => {
    if (userData?.data) {
      setIsPopoverOpen(true);
    } else {
      setIsPopoverOpen(false);
    }
  }, [userData]);

  const canCreate = React.useMemo(() => {
    const role = userRole?.toLowerCase();
    return (
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.BRANCH_ADMIN ||
      role === "admin"
    );
  }, [userRole]);

  const canSearchClients = React.useMemo(() => {
    const role = userRole?.toLowerCase();
    return role !== UserRole.INSTRUCTOR;
  }, [userRole]);

  const month = currentDate.toLocaleString(locale, { month: "long" });
  const year = currentDate.getFullYear();
  const currentBranch = branches.find((b) => b.branch_id === selectedBranchId);

  const handleClearFocus = () => {
    setSearchEmail("");
    setDebouncedEmail("");
    onFocusClient(null);
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 select-none sticky top-0 z-30 h-[72px]">
      <div className="flex items-center gap-8">
        <div className="flex items-baseline gap-2 min-w-[180px]">
          <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
            {month}
          </h1>
          <span className="text-xl font-medium text-slate-300">{year}</span>
          {(isLoading || isSearching) && (
            <div className="ml-3 animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full" />
          )}
        </div>

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
      </div>

      <div className="flex items-center gap-4">
        {canSearchClients && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <div className="relative group">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 h-10 rounded-2xl border transition-all duration-300 shadow-sm",
                  focusedUserId
                    ? "bg-orange-50 border-orange-200 ring-4 ring-orange-500/10"
                    : "bg-slate-50 border-slate-100 focus-within:border-orange-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/5"
                )}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                ) : (
                  <MagnifyingGlassIcon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      focusedUserId ? "text-orange-500" : "text-slate-400"
                    )}
                  />
                )}

                <input
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t("search_placeholder")} 
                  className="bg-transparent border-none text-[11px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none w-44"
                />

                {(searchEmail || focusedUserId) && (
                  <button
                    onClick={handleClearFocus}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3 text-slate-500" />
                  </button>
                )}
              </div>

              <PopoverTrigger asChild>
                <div className="absolute bottom-0 w-full h-0 pointer-events-none" />
              </PopoverTrigger>
            </div>

            <PopoverContent
              className="p-2  w-[700px] rounded-2xl shadow-2xl border-slate-100 animate-in zoom-in-95 duration-200"
              align="end"
              sideOffset={12}
            >
              {userData?.data && (
                <div className="space-y-2 ">
                  <p className="px-3 pt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {locale === "es" ? "Alumno encontrado:" : "Student found:"}
                  </p>
                  <UserSelectionCard
                    user={userData.data}
                    variant="focus"
                    onConfirm={() => {
                      onFocusClient(userData.data.user_id);
                      setIsPopoverOpen(false);
                    }}
                    onClear={handleClearFocus}
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        <div className="flex items-center gap-2 border-l pl-4 border-slate-100">
          {branches.length === 1 ? (
            <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100 shadow-sm">
              <MapPinIcon className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">
                {currentBranch?.name || t("loading")}
              </span>
            </div>
          ) : (
            <Select value={selectedBranchId} onValueChange={onBranchChange}>
              <SelectTrigger className="w-fit min-w-[150px] border-slate-200 bg-white px-3 h-10 rounded-xl shadow-sm text-[10px] font-black text-slate-600 hover:border-orange-500 transition-all flex gap-2 focus:ring-4 focus:ring-orange-500/5">
                <MapPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder={t("loading")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                {branches.map((b) => (
                  <SelectItem
                    key={b.branch_id}
                    value={b.branch_id}
                    className="text-[11px] font-bold focus:bg-orange-50 focus:text-orange-600"
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 h-10 rounded-2xl text-[11px] font-black transition-all shadow-lg active:scale-95 shadow-slate-200"
            >
              <PlusIcon className="h-4 w-4 stroke-[3px]" />
              {t("createClass").toUpperCase()}
            </button>
          )}

          <div className="h-8 w-[1px] bg-slate-100 mx-1" />

          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-10">
            <button
              onClick={onNavigate.today}
              className="px-4 h-full text-[10px] font-black text-slate-600 hover:bg-slate-50 border-r border-slate-100 transition-colors uppercase"
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
