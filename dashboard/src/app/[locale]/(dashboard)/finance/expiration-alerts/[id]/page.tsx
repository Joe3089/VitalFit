"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import ExpireForm from "../ExpireForm";
import { mockMemberships, Membership } from "../data";

export default function MembershipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    const foundMembership = mockMemberships.find(m => m.membership_id === params.id);
    if (foundMembership) {
      setMembership(foundMembership);
    }
  }, [params.id]);

  if (!membership) {
    return (
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="text-center p-10">Membresía no encontrada</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 pt-5 p-6">
      <PageHeader subtitle="Verifica los detalles antes de confirmar" title="DETALLES DE PAGO"/>
      <div className="p-1">
        <ExpireForm
          membership={membership}
          mode="view"
        />
      </div>
    </div>
  );
}