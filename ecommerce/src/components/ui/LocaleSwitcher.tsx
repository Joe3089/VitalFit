"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales } from "@/config";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LanguageIcon, CheckIcon } from "@heroicons/react/24/solid";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <Select
      defaultValue={locale}
      onValueChange={onSelectChange}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn(
          "w-auto border-none bg-transparent focus:ring-0 focus:ring-offset-0 transition-all duration-300 h-10 px-3 rounded-xl gap-2",
          "text-gray-400 hover:text-white hover:bg-white/5",
          "data-[state=open]:bg-white/10 data-[state=open]:text-white shadow-none",
        )}
      >
        <LanguageIcon
          className={cn(
            "h-5 w-5 transition-transform duration-500",
            isPending && "animate-spin",
          )}
        />
        <span className="text-xs font-black uppercase tracking-widest hidden lg:inline-block">
          {locale}
        </span>
      </SelectTrigger>

      <SelectContent
        align="end"
        sideOffset={8}
        className="bg-[#161616]/95 backdrop-blur-xl border-white/10 text-gray-300 min-w-[180px] rounded-2xl p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="px-3 py-2 mb-1 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            {t("label") || "Seleccionar Idioma"}
          </p>
        </div>

        {locales.map((cur) => (
          <SelectItem
            key={cur}
            value={cur}
            className={cn(
              "relative flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 outline-none",
              "focus:bg-white/5 focus:text-white",
              "data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary",
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <span
                className={cn(
                  "w-7 h-5 flex items-center justify-center text-[10px] font-black rounded-md border transition-colors",
                  locale === cur
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-white/10 text-gray-400",
                )}
              >
                {cur.toUpperCase()}
              </span>

              <span className="text-sm font-bold tracking-tight">
                {t("locale", { locale: cur })}
              </span>
              {locale === cur && (
                <CheckIcon className="ml-auto h-4 w-4 text-primary" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
