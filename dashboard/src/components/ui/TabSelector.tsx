"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface TabSelectorProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}

export function TabSelector({
  tabs,
  defaultValue,
  className,
  onValueChange,
}: TabSelectorProps) {
  const initial = defaultValue ?? tabs[0]?.value ?? "";

  return (
    <Tabs
      defaultValue={initial}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList className={cn("w-full flex bg-gray-100 rounded-md p-1 gap-1")}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "flex-1 text-center py-2 text-sm font-medium rounded-md transition-all duration-200",
              "text-gray-700 hover:text-[#F58025]",
              "data-[state=active]:bg-[#F58025] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[#F58025]",
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
