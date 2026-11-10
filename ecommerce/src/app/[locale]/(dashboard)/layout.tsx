"use client";

import { useState } from "react";
import NavbarDashboard from "@/components/features/dashboard/Navbar";
import Sidebar from "@/components/features/dashboard/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F5F6F8] text-gray-900">
        <NavbarDashboard onToggleSidebar={toggleSidebar} />
        <div className="flex pt-16">
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div className="w-auto bg-white shadow-lg h-full">
                <Sidebar />
              </div>
              <div className="flex-1 bg-black/30" onClick={closeSidebar} />
            </div>
          )}

          <main
            className={`
              flex-1 w-full p-4 md:p-8 
              overflow-auto
            `}
          >
            <div
              className="
                mx-auto max-w-7xl
                animate-in fade-in slide-in-from-bottom-4 
                duration-500
              "
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
