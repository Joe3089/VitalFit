"use client";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import RolesTable from "@/components/modules/roles/RolesTable";

export default function Roles() {
  const t = useTranslations("roles");
  const { token } = useAuth();
  const router = useRouter();

  if (!token) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title={t("title")} 
        />
        
        <Button
          className="w-full sm:w-auto bg-white text-black border border-gray-200 hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2"
          onClick={() => router.push("/users/roles/new")}
        >
          <PlusIcon className="h-5 w-5" />
          <span>{t("add_button")}</span>
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <RolesTable />
      </div>
    </div>
  );
}
