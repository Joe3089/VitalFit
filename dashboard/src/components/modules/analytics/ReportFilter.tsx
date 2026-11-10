"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface Option {
  value: string;
  label: string;
}

interface ReportFiltersProps {
  branches: Option[];
  branchValue: string;
  onBranchChange: (value: string) => void;
  ranges: Option[];
  rangeValue: string;
  onRangeChange: (value: string) => void;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
  loadingBranches?: boolean;
  onClear: () => void;
}

export function ReportFilters({
  branches,
  branchValue,
  onBranchChange,
  ranges,
  rangeValue,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  loadingBranches,
  onClear,
}: ReportFiltersProps) {

  const t = useTranslations("analytics.finance.filters");

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select onValueChange={onBranchChange} value={branchValue}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("all_branches")} />
        </SelectTrigger>
        <SelectContent>
          {loadingBranches ? (
            <SelectItem value="loading" disabled>
              {t("loading")}
            </SelectItem>
          ) : (
            branches.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select onValueChange={onRangeChange} value={rangeValue}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t("placeholder_range")} />
        </SelectTrigger>
        <SelectContent>
          {ranges.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[160px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "yyyy-MM-dd") : t("start_date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[160px] justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "yyyy-MM-dd") : t("end_date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" onClick={onClear} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
        {t("clear")}
      </Button>
    </div>
  );
}