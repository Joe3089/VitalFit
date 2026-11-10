"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { MembershipType } from "@vitalfit/sdk";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import MembershipForm from "@/components/modules/membership/MembershipForm";

interface ViewMembershipProps {
  membership: MembershipType;
}

export default function ViewMembership({ membership }: ViewMembershipProps) {
  const t = useTranslations("catalog.memberships");
  const router = useRouter();
  const id = membership.membership_type_id;

  const [formData, setFormData] = useState<MembershipType>({
    membership_type_id: membership.membership_type_id,
    name: membership.name,
    description: membership.description,
    duration_days: membership.duration_days,
    price: membership.price,
    is_active: membership.is_active,
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded shadow">
      <PageHeader title={t("view.title")}>
        <Button
          variant="default"
          onClick={() => {
            router.push(`/catalog/memberships/${id}/edit`);
          }}
        >
          {t("view.button_edit")}
        </Button>
      </PageHeader>

      <MembershipForm
        formData={formData}
        onChange={() => { }}
        mode="view"
        disabled
      />
    </div>
  );
}
