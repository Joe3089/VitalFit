"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/features/Logo";

export default function Header() {
  const { token } = useAuth();
  const { user } = useAuth();

  if (!user && !token) {
    return null;
  }

  return (
    <header className="bg-[#303030] text-white px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard">
        <Logo slogan={true} theme="dark" />
      </Link>
      <div className="flex items-center gap-8"></div>

      <div className="flex items-center gap-4">
        <button className="hover:bg-gray-700 p-2 rounded">
          <BellIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
          <div className="text-right text-xs">
            <div className="font-semibold">
              {user?.first_name ?? ""} {user?.last_name ?? ""}
            </div>
            <div className="text-gray-400">{user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
