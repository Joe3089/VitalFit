"use client";

import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  LogOut,
  ChevronsUpDown,
  Settings2,
  User as UserIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, SessionUser } from "@/context/AuthContext";
import LocaleSwitcher from "./localeSwitcher/LocaleSwitcher";
import { Link } from "@/i18n/navigation";

interface NavUserProps {
  user: SessionUser;
}

export function NavUser({ user }: NavUserProps) {
  const t = useTranslations("UserNav");
  const { isMobile } = useSidebar();
  const { logout } = useAuth();

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "??";
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "User";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
            >
              <Avatar className="h-8 w-8 rounded-lg border shadow-sm">
                <AvatarImage 
                  src={user.profile_picture_url || ""} 
                  alt={fullName} 
                  className="object-cover"
                />
                <AvatarFallback className="rounded-lg bg-primary/10 text-[10px] font-bold text-primary italic">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                <span className="truncate font-semibold tracking-tight text-foreground">
                  {fullName}
                </span>
                <span className="truncate text-[10px] text-muted-foreground uppercase font-black italic tracking-wider">
                  {user.role|| user.email.split("@")[0]}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] rounded-xl p-2 shadow-xl border-sidebar-border"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-1 py-1.5">
                <Avatar className="h-10 w-10 rounded-lg border shadow-sm">
                  <AvatarImage 
                    src={user.profile_picture_url || ""} 
                    alt={fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary italic uppercase">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <p className="truncate font-black italic uppercase tracking-tighter text-foreground leading-none">
                    {fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="py-2.5 cursor-pointer focus:bg-primary/5">
                <Link href="/settings/profile" className="flex w-full items-center">
                  <BadgeCheck className="mr-2 size-4 text-primary/60" />
                  <span className="font-bold italic uppercase tracking-tighter text-[11px]">{t("account")}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuGroup>
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center text-[11px] font-bold italic uppercase tracking-tighter text-muted-foreground">
                  <Settings2 className="mr-2 size-4 opacity-50" />
                  {t("language")}
                </div>
                <div className="scale-90 origin-right shadow-sm border rounded-md overflow-hidden">
                  <LocaleSwitcher />
                </div>
              </div>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem
              onClick={() => logout()}
              className="py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-md transition-colors group"
            >
              <LogOut className="mr-2 size-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-black italic uppercase tracking-tighter text-[11px]">{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}