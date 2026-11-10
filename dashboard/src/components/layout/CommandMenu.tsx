"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getSearchableItems } from "@/utils/navigation-search";
import { UserRole } from "@/lib/roles";

interface CommandMenuProps {
  role: UserRole;
}

export function CommandMenu({ role }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("Navbar"); 
  const ts = useTranslations("Menu"); 

  const searchableItems = React.useMemo(() => getSearchableItems(role), [role]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-9 w-full max-w-[300px] flex items-center justify-start rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:ring-1 hover:ring-primary/20"
      >
        <span className="hidden lg:inline-flex">{t("searchPlaceholder")}</span>
        <span className="inline-flex lg:hidden">{t("searchMobile")}</span>
        <kbd className="absolute right-2 top-2 hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
          <DialogTitle>{t("searchPlaceholder")}</DialogTitle>
        </VisuallyHidden>

        <CommandInput placeholder={t("searchPlaceholder")} />
        
        <CommandList className="max-h-[450px]">
          <CommandEmpty>{t("noResults")}</CommandEmpty>
          {Array.from(new Set(searchableItems.map(i => i.section))).map(section => (
            <CommandGroup 
              key={section} 
              heading={ts(section)} 
            >
              {searchableItems
                .filter(item => item.section === section)
                .map((item) => (
                  <CommandItem
                    key={item.href}
                    className="cursor-pointer"
                    onSelect={() => {
                      router.push(item.href);
                      setOpen(false);
                    }}
                  >
                    <span>{ts(item.label)}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}