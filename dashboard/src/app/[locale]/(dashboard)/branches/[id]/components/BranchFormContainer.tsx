"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TabSelector } from "@/components/ui/TabSelector";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import BranchBasicDataPanel from "./BranchBasicDataPanel";
import BranchServicePanel from "./BranchServicesPanel";
import BranchInstructorPanel from "./BranchInstructorsPanel";
import BranchEquipmentPanel from "./BranchEquipmentPanel";
import BranchPaymentMethodPanel from "./BranchPaymentMethodsPanel";
import BranchStaffManager from "./BranchStaffManager";

import { BranchDetails } from "@vitalfit/sdk";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/roles";

interface BranchFormContainerProps {
  mode?: "view" | "edit";
  branch: BranchDetails;
}

export default function BranchFormContainer({
  mode = "edit",
  branch,
}: BranchFormContainerProps) {
  const t = useTranslations("branches");
  const router = useRouter();
  const { hasRole } = useAuth();
  
  const [formData, setFormData] = useState<BranchDetails>({ ...branch });

  const isBranchAdmin = hasRole(UserRole.BRANCH_ADMIN);
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);

  const tabs = [
    {
      value: "basic",
      label: t("details.tabs.basic"),
      content: (
        <BranchBasicDataPanel
          mode={mode}
          formData={formData}
          setFormData={setFormData}
        />
      ),
    },
    {
      value: "payment",
      label: t("details.tabs.payment"),
      content: <BranchPaymentMethodPanel mode={mode} branchId={branch.branch_id} />,
    },
    {
      value: "services",
      label: t("details.tabs.services"),
      content: <BranchServicePanel branchId={branch.branch_id} mode={mode} />,
    },
    {
      value: "instructors",
      label: t("details.tabs.instructors"),
      content: <BranchInstructorPanel mode={mode} branchId={branch.branch_id} />,
    },
    {
      value: "equipment",
      label: t("details.tabs.equipment"),
      content: <BranchEquipmentPanel mode={mode} branchId={branch.branch_id} />,
    },
    {
      value: "staff",
      label: t("details.tabs.staff"), 
      content: <BranchStaffManager mode={mode} branchId={branch.branch_id} />,
    },
  ];

  const handleEditNavigation = () => {
    const targetId = isBranchAdmin ? "active" : branch.branch_id; 
    router.push(`/branches/${targetId}/edit`);
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between p-4 bg-white border shadow-sm rounded-xl">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {mode === "edit" ? t("details.header.config") : t("details.header.view")}
          </span>
          <span className="text-sm font-bold text-slate-700">{formData.name}</span>
        </div>

        <div className="flex gap-3">
          {mode === "view" && (isSuperAdmin || isBranchAdmin) && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
              onClick={handleEditNavigation}
            >
              <Pencil className="w-4 h-4 mr-2" />
              {t("table.actions.edit")}
            </Button>
          )}
        </div>
      </div>

      <TabSelector tabs={tabs} defaultValue="basic" />
    </div>
  );
}