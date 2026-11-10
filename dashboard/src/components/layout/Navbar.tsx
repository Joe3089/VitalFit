"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { 
  Menu, 
  Sun,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import { CommandMenu } from "./CommandMenu"; 
import { UserRole } from "@/lib/roles";
import LocaleSwitcher from "./localeSwitcher/LocaleSwitcher";

const Navbar: React.FC = () => {
  const t = useTranslations("Navbar");
  const { toggleSidebar } = useSidebar();
  const { token, user } = useAuth();
  if (!token || !user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 transition-colors hover:bg-muted"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t("toggleMenu")}</span>
          </Button>
          
          <Separator orientation="vertical" className="h-6 hidden md:block" />
        
        </div>
        <div className="flex-1 flex justify-center max-w-md mx-auto">
          <CommandMenu role={user.role as UserRole} />
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={200}>
            
            <NotificationCenter jwt={token} />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Sun className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">{t("appearance")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t("appearance")}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-2 h-6 hidden sm:block" />

            <LocaleSwitcher />

          </TooltipProvider>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;