"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PasswordForm } from "./PasswordForm";
import { AccountForm } from "./AccountForm";
import { ActivityNotifications } from "./ActivityNotifications";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils"; 
import { User, Lock, Bell } from "lucide-react";

const Separator = ({ className }: { className?: string }) => (
  <div className={cn("h-[1px] w-full bg-gray-200 dark:bg-gray-800", className)} />
);

type SettingsTab = "profile" | "security" | "activity";

export default function SettingsPage() {
  const t = useTranslations("SettingsPage"); 
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tabParam = searchParams.get("tab") as SettingsTab;
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabParam || "profile");

  useEffect(() => {
    if (tabParam && ["profile", "security", "activity"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.push(`/settings/profile?tab=${tab}`, { scroll: false });
  };

  if (loading) {
    return <div className="p-10 text-gray-500">{t("loading")}</div>;
  }
  if (!user) {
    return null;
  }

  const sidebarNavItems = [
    { id: "profile", title: t("tabs.profile"), icon: <User className="w-4 h-4 mr-2" /> },
    { id: "activity", title: t("tabs.activity"), icon: <Bell className="w-4 h-4 mr-2" /> },
    { id: "security", title: t("tabs.security"), icon: <Lock className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="space-y-6 p-6 pb-16 md:p-10 max-w-7xl mx-auto dark:bg-gray-950 min-h-screen text-foreground">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("title")}
        </h2>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
        {searchParams.get("password_expired") === "1" && (
          <div role="alert" className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {t("passwordExpired")}
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5 xl:w-1/6">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {sidebarNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as SettingsTab)}
                className={cn(
                  "flex items-center w-full rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 text-left justify-start", 
                  activeTab === item.id
                    ? "bg-white dark:bg-gray-800 text-primary shadow-sm ring-1 ring-gray-200 dark:ring-gray-700" 
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800"
                )}
              >
                {item.icon}
                {item.title}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 lg:max-w-3xl">
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {activeTab === "profile" && (
              <>
                <div>
                  <h3 className="text-lg font-medium">{t("sections.profile.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("sections.profile.description")}</p>
                </div>
                <Separator />
                <AccountForm user={user} />
              </>
            )}

            {activeTab === "activity" && (
              <>
                <div>
                  <h3 className="text-lg font-medium">{t("sections.activity.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("sections.activity.description")}</p>
                </div>
                <Separator />
                <ActivityNotifications />
              </>
            )}

            {activeTab === "security" && (
              <>
                <div>
                  <h3 className="text-lg font-medium">{t("sections.security.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("sections.security.description")}</p>
                </div>
                <Separator />
                <PasswordForm />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}