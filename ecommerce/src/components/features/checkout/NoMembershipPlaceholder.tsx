"use client";

import { PackageSearch, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export const NoMembershipPlaceholder = () => {
  const t = useTranslations("Checkout.NoMembership");

  return (
    <div className="flex flex-col items-center justify-center bg-white p-16 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-slate-50 p-6 rounded-full mb-6">
        <PackageSearch className="h-12 w-12 text-slate-300" />
      </div>

      <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
        {t("title")}
      </h3>
      <p className="text-slate-500 max-w-[280px] text-sm leading-relaxed mb-8">
        {t("description")}
      </p>

      <Button
        onClick={() => window.history.back()}
        variant="outline"
        className="rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold gap-2"
      >
        <ArrowLeft size={16} />
        {t("backButton")}
      </Button>
    </div>
  );
};
