"use client";

import { useTranslations } from "next-intl";
import { UserNav } from "@/components/layout/UserNav";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Logo from "../Logo";

interface NavbarProps {
  onSignOut?: () => void;
  transparent?: boolean;
  onToggleSidebar?: () => void;
}

const NavbarDashboard = ({
  onSignOut,
  transparent,
  onToggleSidebar,
}: NavbarProps) => {
  const t = useTranslations("Navbar");
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogoClick = () => router.push("/");
  const handleProfileClick = () => router.push("/profile");
  const handleHomeClick = () => router.push("/dashboard");

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-[999] w-full px-6 lg:px-10 py-4 flex items-center justify-between transition-all duration-300",
        transparent
          ? "bg-transparent border-transparent"
          : "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl",
      )}
    >
      <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white active:scale-90 transition-transform"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}

          <button
            onClick={handleLogoClick}
            className="relative flex items-center group select-none transition-transform hover:scale-105"
          >
            <Logo slogan={true} theme="light" />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end bg-white/5 px-4 py-1.5 rounded-2xl border border-white/5">
                <span className="text-emerald-400 font-black text-xs uppercase italic tracking-tighter leading-none">
                  {user.ClientProfile.scoring}{" "}
                  <span className="text-[10px]">pts</span>
                </span>
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.1em] mt-1">
                  {user.ClientProfile.category || "Standard"}
                </span>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <UserNav
                user={user}
                onSignOut={onSignOut || logout}
                onProfileClick={handleProfileClick}
                onHomeClick={handleHomeClick}
              />
            </div>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              className="bg-primary hover:bg-orange-600 text-white font-black uppercase italic tracking-wider rounded-xl px-6"
            >
              {t("login")}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarDashboard;
