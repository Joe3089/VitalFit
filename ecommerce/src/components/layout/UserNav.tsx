"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { User } from "@vitalfit/sdk";
import { cn } from "@/lib/utils";

interface UserNavProps {
  user: User;
  onSignOut?: () => void;
  onProfileClick?: () => void;
  onHomeClick?: () => void;
}

export function UserNav({
  user,
  onSignOut,
  onProfileClick,
  onHomeClick,
}: UserNavProps) {
  const t = useTranslations("UserNav");

  const initials =
    (user.first_name?.charAt(0) || "") + (user.last_name?.charAt(0) || "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-auto flex items-center gap-2 rounded-2xl px-2 hover:bg-white/5 transition-all duration-300 group outline-none focus-visible:ring-0"
        >
          <div className="relative group">
            <Avatar className="h-10 w-10 border-none ring-2 ring-white/10 shadow-2xl transition-all duration-300 group-hover:ring-emerald-500/50">
              <AvatarImage
                src={user.profile_picture_url || ""}
                alt={`${user.first_name}`}
                className="aspect-square object-cover object-center transition-opacity duration-500"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold italic text-[10px] animate-in fade-in duration-300">
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#1c1c1c]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            </span>
          </div>
          <ChevronDownIcon className="w-4 h-4 text-white/40 group-data-[state=open]:rotate-180 transition-transform duration-300" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "w-64 mt-2 p-2 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
          "border border-white/10 backdrop-blur-2xl bg-slate-950/95",
          "animate-in fade-in-0 zoom-in-95 duration-300",
        )}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black uppercase italic tracking-tighter text-white leading-none">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[11px] font-medium text-white/40 truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/5 mx-2" />

        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-3 text-white/70 focus:bg-white/5 focus:text-primary transition-all duration-200"
          >
            <div className="bg-white/5 p-2 rounded-lg">
              <HomeIcon className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("home")}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onProfileClick}
            className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-3 text-white/70 focus:bg-white/5 focus:text-primary transition-all duration-200"
          >
            <div className="bg-white/5 p-2 rounded-lg">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("profile")}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-white/5 mx-2" />

        <div className="p-1">
          <DropdownMenuItem
            onClick={onSignOut}
            className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-3 text-red-400 focus:bg-red-500/10 focus:text-red-400 transition-all duration-200"
          >
            <div className="bg-red-500/10 p-2 rounded-lg">
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("logout")}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
