"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { sidebarMenusByRole } from "./sidebar.config";
import { SidebarItem } from "./SidebarItem";
import { useSidebarNavigation } from "./useSidebarNavigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { NavUser } from "../NavUser";
import { useTranslations } from "next-intl";
import { ChevronsUpDown, Landmark, Check } from "lucide-react";

export default function SidebarDashboard() {
  const { user, loading, switchBranch } = useAuth();
  const { pathname, navigate } = useSidebarNavigation();
  const t = useTranslations("Menu");

  if (loading || !user) {
    return <SidebarMenuSkeleton />;
  }

 const allAvailableBranches = Array.from(
  new Map(
    [
      ...(user.assignedBranches || []),
      ...(user.managedBranches || []),
      ...(user.instructorBranches || []) 
    ].map((b) => [b.id, b])
  ).values()
);

  const sections = sidebarMenusByRole[user.role] ?? [];

  return (
    <Sidebar collapsible="offcanvas" className="w-64 border-r bg-white">
      <SidebarContent className="flex flex-col h-full">
        <header className="p-4 border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    disabled={allAvailableBranches.length <= 1}
                    className="w-full transition-all duration-200 hover:bg-slate-100 data-[state=open]:bg-sidebar-accent"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                      <Landmark className="size-4" />
                    </div>

                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                      <span className="truncate font-bold text-slate-900">
                        {user.activeBranch?.name || t("select_branch")}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
                        {user.role_label}
                      </span>
                    </div>
                    {allAvailableBranches.length > 1 && (
                      <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                {allAvailableBranches.length > 1 && (
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl p-2 shadow-xl"
                    align="start"
                    side="bottom"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {t("branches_label", { name: user.first_name })}
                    </DropdownMenuLabel>

                    {allAvailableBranches.map((branch, index) => (
                      <DropdownMenuItem
                        key={branch.id}
                        onClick={() => switchBranch(branch)}
                        className={`
                          group flex items-center gap-3 rounded-md px-2 py-2.5 cursor-pointer outline-none transition-all
                          focus:bg-primary focus:text-primary-foreground
                          ${user.activeBranch?.id === branch.id ? "bg-slate-50" : ""}
                        `}
                      >
                        <div className={`
                          flex size-7 items-center justify-center rounded-md border text-[10px] font-bold shadow-sm
                          ${user.activeBranch?.id === branch.id ? "bg-white text-primary border-primary/20" : "bg-white text-slate-400"}
                        `}>
                          {branch.name.substring(0, 2).toUpperCase()}
                        </div>
                        
                        <div className="flex flex-1 flex-col">
                          <span className="text-sm font-semibold leading-none">
                            {branch.name}
                          </span>
                        </div>

                        {user.activeBranch?.id === branch.id ? (
                          <Check className="size-4 text-primary group-focus:text-primary-foreground" />
                        ) : (
                           <DropdownMenuShortcut className="text-[10px] opacity-50 group-focus:text-primary-foreground">
                              ⌘{index + 1}
                           </DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator className="my-2" />
                    
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 border border-slate-100">
                        <div className="flex size-6 items-center justify-center rounded-md bg-white border shadow-xs">
                          <Image
                            src="/images/isotipo.png"
                            alt="Vitalfit"
                            width={14}
                            height={14}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                          {t("system_footer")}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </header>

        <div className="flex-1 overflow-y-auto pt-2">
          {sections.map((section) => (
            <SidebarGroup key={section.title}>
              {section.title && (
                <SidebarGroupLabel className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                  {t(section.title as any)}
                </SidebarGroupLabel>
              )}
              <SidebarMenu className="px-3">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    onNavigate={navigate}
                    t={t}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </div>

        <div className="mt-auto border-t p-4 bg-white">
          <NavUser user={user} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}