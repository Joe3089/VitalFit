"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations, useLocale } from "next-intl";
import { Camera, Loader2, CalendarIcon, User } from "lucide-react";
import { format, parseISO, isValid, getYear, getMonth, setYear, setMonth } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ClientData {
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  gender: string;
  identity_document: string;
  phone: string;
  profile_picture_url: string;
  role_name: string;
}

interface ClientsFormProps {
  client: ClientData;
  onChange: (field: keyof ClientData, value: any) => void;
  mode?: "view" | "edit" | "create";
  errors?: Partial<Record<keyof ClientData, string>>;
}

export default function ClientsForm({
  client,
  errors = {},
  onChange,
  mode = "view",
}: ClientsFormProps) {
  const t = useTranslations("clients.form");
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;
  const [isUploading, setIsUploading] = useState(false);
  const disabled = mode === "view";

  const initials = `${client.first_name?.charAt(0) || ""}${client.last_name?.charAt(0) || ""}`.toUpperCase();

  // Fecha seleccionada real
  const selectedDate = useMemo(() => 
    client.birth_date ? parseISO(client.birth_date) : undefined
  , [client.birth_date]);
  const [monthView, setMonthView] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate && isValid(selectedDate)) {
      setMonthView(selectedDate);
    }
  }, [selectedDate]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = locale === "es" 
    ? ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    : ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

  const handleMonthChange = (monthValue: string) => {
    const baseDate = selectedDate || new Date();
    const newDate = setMonth(baseDate, parseInt(monthValue));
    onChange("birth_date", format(newDate, "yyyy-MM-dd"));
    setMonthView(newDate); 
  };

  const handleYearChange = (year: string) => {
    const baseDate = selectedDate || new Date();
    const newDate = setYear(baseDate, parseInt(year));
    onChange("birth_date", format(newDate, "yyyy-MM-dd"));
    setMonthView(newDate); 
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error(t("notifications.invalid_image"));
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const apiKey = process.env.NEXT_PUBLIC_IMGBB || "";
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        onChange("profile_picture_url", result.data.url);
        toast.success(t("notifications.image_success"));
      }
    } catch (error) {
      toast.error(t("notifications.image_error"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">

      <div className="flex flex-col items-center justify-center space-y-4 pb-6 border-b border-dashed">
        <div className="relative group cursor-pointer">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl transition-all group-hover:opacity-90">
            <AvatarImage src={client.profile_picture_url} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground font-black text-3xl">
              {isUploading ? <Loader2 className="h-10 w-10 animate-spin" /> : initials || <User className="h-12 w-12 opacity-50" />}
            </AvatarFallback>
          </Avatar>
          
          {!disabled && (
            <>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-8 w-8 text-white" />
              </label>
              <input 
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700">{t("labels.profile_picture")}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t("labels.optional")}</p>
        </div>
      </div>

      <div className="space-y-6 text-left">
        <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {t("sections.basic")}
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-600">{t("labels.first_name")}</Label>
            <Input
              value={client.first_name}
              placeholder={t("placeholders.first_name")}
              onChange={(e) => onChange("first_name", e.target.value)}
              disabled={disabled}
              className="h-10 shadow-none border-gray-200 focus-visible:ring-primary"
            />
            {errors.first_name && <p className="text-[11px] text-red-500 font-medium">{errors.first_name}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-600">{t("labels.last_name")}</Label>
            <Input
              value={client.last_name}
              placeholder={t("placeholders.last_name")}
              onChange={(e) => onChange("last_name", e.target.value)}
              disabled={disabled}
              className="h-10 shadow-none border-gray-200 focus-visible:ring-primary"
            />
            {errors.last_name && <p className="text-[11px] text-red-500 font-medium">{errors.last_name}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-600">{t("labels.email")}</Label>
            <Input
              type="email"
              value={client.email}
              placeholder="ejemplo@correo.com"
              onChange={(e) => onChange("email", e.target.value)}
              disabled={disabled}
              className="h-10 shadow-none border-gray-200 focus-visible:ring-primary"
            />
            {errors.email && <p className="text-[11px] text-red-500 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="text-xs font-bold text-gray-600">{t("labels.birth_date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  disabled={disabled}
                  className={cn(
                    "h-10 w-full justify-start text-left font-normal border-gray-200 shadow-none",
                    !client.birth_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50 text-primary" />
                  {selectedDate && isValid(selectedDate) ? 
                    format(selectedDate, "PPP", { locale: dateLocale }) : 
                    <span>{t("placeholders.select_date")}</span>
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-2xl border-primary/10" align="start">
                <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 gap-2">
                  <Select
                    onValueChange={handleMonthChange}
                    value={selectedDate ? getMonth(selectedDate).toString() : undefined}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs font-bold bg-white">
                      <SelectValue placeholder={t("placeholders.month")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {months.map((m, idx) => (
                        <SelectItem key={m} value={idx.toString()} className="capitalize text-xs font-medium">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={handleYearChange}
                    value={selectedDate ? getYear(selectedDate).toString() : undefined}
                  >
                    <SelectTrigger className="h-8 w-[90px] text-xs font-bold bg-white">
                      <SelectValue placeholder={t("placeholders.year")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()} className="text-xs font-medium">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    onChange("birth_date", date ? format(date, "yyyy-MM-dd") : "");
                    if (date) {setMonthView(date); }
                  }}
                  month={monthView} 
                  onMonthChange={setMonthView} 
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={dateLocale}
                  disableNavigation 
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
            {errors.birth_date && <p className="text-[11px] text-red-500 font-medium">{errors.birth_date}</p>}
          </div>
        </div>
        <div className="space-y-4 p-5 rounded-xl border border-gray-100 bg-gray-50/30">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.15em]">
            {t("labels.gender")}
          </Label>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {["female", "male", "prefer-not-to-say"].map((g) => (
              <label key={g} className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                    <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={client.gender === g}
                    onChange={(e) => onChange("gender", e.target.value)}
                    disabled={disabled}
                    className="peer h-5 w-5 border-2 border-gray-300 text-primary focus:ring-primary appearance-none rounded-full checked:border-primary transition-all"
                    />
                    <div className="absolute h-2.5 w-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className="text-sm font-bold text-gray-600 group-hover:text-primary transition-colors">
                  {t(`gender.${g}`)}
                </span>
              </label>
            ))}
          </div>
          {errors.gender && <p className="text-[11px] text-red-500 font-medium">{errors.gender}</p>}
        </div>

        <div className="flex items-center gap-3 pt-4">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {t("sections.identity")}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-600">{t("labels.identity_document")}</Label>
            <Input
              value={client.identity_document}
              placeholder="V-12345678"
              onChange={(e) => onChange("identity_document", e.target.value)}
              disabled={disabled}
              className="h-10 shadow-none border-gray-200 uppercase font-mono tracking-wider focus-visible:ring-primary"
            />
            {errors.identity_document && <p className="text-[11px] text-red-500 font-medium">{errors.identity_document}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-600">{t("labels.phone")}</Label>
            <PhoneInput
              value={client.phone}
              onChange={(value) => onChange("phone", value)}
              disabled={disabled}
              defaultCountry="VE"
            />
            {errors.phone && <p className="text-[11px] text-red-500 font-medium">{errors.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}