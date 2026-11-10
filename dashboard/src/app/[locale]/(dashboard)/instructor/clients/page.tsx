"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useInstructorClients } from "@/hooks/clients/useInstructorClients";
import { InstructorClientsTable } from "@/components/modules/clients/InstructorClientsTable";
import { useTranslations } from "next-intl";

export default function InstructorClientsPage() {

  const t = useTranslations("instructor_clients");
  
  const { token, user } = useAuth();

  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, pagination, filters, onFilterChange } =
    useInstructorClients({
      token,
      instructorId: user?.user_id || null,
      initialLimit: 10,
    });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, onFilterChange, filters.search]);


  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50/50 min-h-screen">
      <PageHeader
        title={t("title")} 
        subtitle={t("description")} 
      >
      </PageHeader>

      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/50">
        <InstructorClientsTable
          data={data}
          isLoading={isLoading}
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      </div>
    </div>
  );
}