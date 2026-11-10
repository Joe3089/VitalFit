"use client";
import { ChangeEvent, ReactNode, useTransition } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";

type Props = {
  children: ReactNode;
  defaultValue: string;
  label: string;
};

export default function LocaleSwitcherSelect({
  children,
  defaultValue,
  label,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <label
      className={clsx(
        "relative text-gray-400", // El label es el contenedor 'relative'
        isPending && "transition-opacity [&:disabled]:opacity-30",
      )}
    >
      {/* 5. (Opcional) 'sr-only' es mejor para la accesibilidad */}
      <p className="sr-only">{label}</p>
      <select
        className="inline-flex appearance-none bg-transparent py-2 pl-2 pr-6 focus:outline-none"
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={onSelectChange}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2">
        <ChevronDownIcon className="h-4 w-4" />
      </span>
    </label>
  );
}
