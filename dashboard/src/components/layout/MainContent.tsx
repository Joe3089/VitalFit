"use client";

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import Navbar from "@/components/layout/Navbar";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open } = useSidebar();

  return (
    <div
      className={`
        flex-1 flex flex-col
        transition-[margin] duration-300 ease-in-out
        ${open ? "ml-64" : "ml-0"} 
      `}
    >
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
