"use client";

import PaymentHistoryTable from "@/components/features/dashboard/PaymentHistoryTable";
import BannerOffer from "./BannerOffer";
import { MembershipSummary } from "./MembershipSummary";
import UpcomingClasses from "./UpcomingClasses";
import NpsSurvey from "./NpsSurvey";
import { useAuth } from "@/context/AuthContext";
import { useMyInvoices } from "@/hooks/useClientInvoices";

export default function MainContent() {
  const { user, loading: authLoading } = useAuth();

  const {
    invoices,
    loading: invoicesLoading,
    page,
    setPage,
    totalPages,
  } = useMyInvoices({ limit: 5 });

  if (authLoading) {
    return (
      <div className="flex-1 p-8 animate-pulse bg-gray-50">
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 p-8">
        No se ha encontrado información del usuario.
      </div>
    );
  }

  const hasActiveMembership = user.client_membership?.status === "Active";

  return (
    <main className="flex-1 p-8">
      <div className="space-y-6">
        {!hasActiveMembership && <BannerOffer />}

        <MembershipSummary clientMembership={user.client_membership} />

        <UpcomingClasses />
        {hasActiveMembership && <NpsSurvey />}
        <PaymentHistoryTable
          data={invoices}
          loading={invoicesLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </main>
  );
}
