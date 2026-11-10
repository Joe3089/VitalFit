"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LanguageIcon } from "@heroicons/react/24/outline";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Select
      defaultValue={locale}
      onValueChange={onSelectChange}
      disabled={isPending}
    >
      <SelectTrigger
        className={`
    w-auto gap-3 border border-zinc-200 bg-white/70 backdrop-blur-md 
    shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-md
    hover:bg-white hover:border-orange-200 hover:text-orange-600
    transition-all duration-300 h-10 px-4 rounded-full
    text-zinc-500 font-medium focus:ring-2 focus:ring-orange-100 focus:ring-offset-0
    data-[state=open]:border-orange-300 data-[state=open]:text-orange-600
    ${isPending ? "opacity-50 grayscale pointer-events-none" : "opacity-100"}
  `}
        aria-label={t("label")}
      >
        <LanguageIcon className="h-5 w-5 text-zinc-400" />
        <span className="uppercase text-xs font-bold tracking-wider">
          {locale}
        </span>
      </SelectTrigger>

      <SelectContent
        align="end"
        className="bg-white border-zinc-200 text-zinc-700 min-w-[160px] shadow-2xl rounded-xl p-1"
      >
        {routing.locales.map((cur) => (
          <SelectItem
            key={cur}
            value={cur}
            className="focus:bg-zinc-50 focus:text-orange-600 cursor-pointer data-[state=checked]:text-orange-600  py-2.5 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-8 items-center justify-center uppercase font-black text-[10px] border border-zinc-200 rounded bg-zinc-100 text-zinc-500 group-focus:border-orange-200">
                {cur}
              </span>
              <span className="text-sm font-semibold">
                {t("locale", { locale: cur })}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
