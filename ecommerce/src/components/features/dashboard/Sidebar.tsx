"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "@/i18n/routing";
import UserHeader from "@/components/layout/Sidebar/UserHeader";
import MenuList from "@/components/layout/Sidebar/MenuList";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const membership = user?.client_membership;

  if (!user) {
    return null;
  }

  return (
    <>
      <aside className="flex h-full w-[280px] xl:w-[320px] flex-col bg-white shadow-lg border-r border-gray-100">
        <ScrollArea className="flex-1">
          <div className="border-b border-orange-400 pb-2">
            <UserHeader user={user} membership={membership} />
          </div>
          <div className="px-4 py-3">
            <MenuList pathname={pathname} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-100">
          <Button
            onClick={logout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
