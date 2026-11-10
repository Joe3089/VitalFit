"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Logo from "@/components/features/Logo";
import LocaleSwitcher from "../ui/LocaleSwitcher";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { UserNav } from "./UserNav";
import { cn } from "@/lib/utils";

interface NavbarProps {
  transparent?: boolean;
  cartItemCount?: number;
}

export function Navbar({
  transparent = false,
  cartItemCount = 0,
}: NavbarProps) {
  const t = useTranslations("Navbar");
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
  }, [isMenuOpen]);

  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      const navElement = document.getElementById("main-navbar");
      if (navElement) {
        setNavHeight(navElement.offsetHeight);
      }
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    const navElement = document.getElementById("main-navbar");
    if (navElement) { resizeObserver.observe(navElement); }

    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navItemsConfig = [
    { key: "home", href: "/" },
    { key: "services", href: "/services" },
    { key: "branches", href: "/branches" },
    { key: "memberships", href: "/memberships" },
    { key: "contact", href: "/contact" },
  ];

  return (
    <>
      <nav
        id="main-navbar"
        className={cn(
          "fixed top-0 left-0 right-0 z-[1000] w-full px-6 lg:px-10 py-4 flex items-center justify-between transition-all duration-300",
          transparent && !isMenuOpen
            ? "bg-transparent"
            : "bg-[#1c1c1c]/90 backdrop-blur-md shadow-sm border-b border-white/5",
        )}
      >
        <button
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>

        <div onClick={() => router.push("/")} className="flex items-center">
          <Logo slogan={true} theme="light" />
        </div>

        <div className="hidden md:flex items-center gap-1 xl:gap-2">
          {navItemsConfig.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs xl:text-sm font-bold tracking-wide transition-all px-4 py-2 rounded-full uppercase italic",
                isActive(item.href)
                  ? "text-white bg-primary shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              {t(`navItems.${item.key}`)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:block">
            <LocaleSwitcher />
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="relative p-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ShoppingCartIcon className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </button>

          <div className="hidden lg:block h-6 w-px bg-white/10 mx-1"></div>

          {user && token ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-emerald-400 font-bold text-[11px] uppercase">
                  {user.ClientProfile.scoring} pts
                </span>
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-tighter">
                  {user.ClientProfile.category}
                </span>
              </div>
              <UserNav
                user={user}
                onHomeClick={() => router.push("/dashboard")}
                onProfileClick={() => router.push("/profile")}
                onSignOut={logout}
              />
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-primary hover:text-white hover:bg-primary transition-all text-xs font-bold uppercase italic rounded-full h-9 px-4"
                >
                  {t("loginButton")}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-orange-600 text-white shadow-md text-xs font-bold uppercase italic rounded-full h-9 px-5">
                  {t("registerButton")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[1001] bg-[#1c1c1c]/95 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-3 duration-300 overflow-y-auto"
          style={{ top: `${navHeight}px` }}
        >
          <div className="flex flex-col p-6 gap-2">
            {user && token && (
              <div className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {user.first_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm uppercase italic">
                      {user.first_name}
                    </p>
                    <p className="text-emerald-400 text-xs font-bold">
                      {user.ClientProfile.scoring} Pts
                    </p>
                  </div>
                </div>
              </div>
            )}

            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-4 mb-2">
              Explora VitalFit
            </span>

            {navItemsConfig.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "py-4 px-4 rounded-xl text-sm font-bold uppercase italic transition-all flex justify-between items-center",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-400 hover:text-white",
                )}
              >
                {t(`navItems.${item.key}`)}
                {isActive(item.href) && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="px-4">
                <LocaleSwitcher />
              </div>
              {!user && (
                <div className="grid gap-3">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-12 bg-transparent border border-primary/40 text-primary rounded-xl font-bold uppercase italic">
                      {t("loginButton")}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-12 bg-primary text-white rounded-xl font-bold uppercase italic">
                      {t("registerButton")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
