"use client";

import { useState, useMemo } from "react";
import {
  PackagePlus,
  CheckCircle2,
  MapPin,
  Lock,
  ChevronDown,
  Plus,
  Loader2,
  Sparkles,
  X,
  Dumbbell,
  Search,
  Clock,
  Tag,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/Input";
import { PackageCarousel, PackageOption } from "./PackageCarousel";
import { MembershipSummary } from "./MembershipSummary";
import {
  BranchInfo,
  PublicMembershipResponse,
  ServicePublicItem,
} from "@vitalfit/sdk";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  data: PublicMembershipResponse | null;
  allMemberships?: PublicMembershipResponse[];
  onSelectMembership: (id: string | null) => void;
  packages: PackageOption[];
  selectedPackages: PackageOption[];
  togglePackage: (pkg: PackageOption) => void;
  services?: ServicePublicItem[];
  selectedServices?: ServicePublicItem[];
  toggleService?: (service: ServicePublicItem) => void;
  onRemoveMembership: () => void;
  branches: BranchInfo[];
  selectedBranch: string;
  onSelectBranch: (id: string) => void;
  invoiceData?: any;
  isLoadingServices?: boolean;
  hasMoreServices?: boolean;
  onLoadMoreServices?: () => void;
  isMember?: boolean;
  currencySymbol?: string;
}

export const StepSelectPlan = ({
  data,
  allMemberships = [],
  onSelectMembership,
  packages,
  selectedPackages,
  togglePackage,
  services = [],
  selectedServices = [],
  toggleService,
  onRemoveMembership,
  branches,
  selectedBranch,
  onSelectBranch,
  invoiceData,
  isLoadingServices,
  hasMoreServices,
  onLoadMoreServices,
  currencySymbol = "$",
  isMember = false,
}: Props) => {
  const t = useTranslations("Checkout.StepPlan");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPackages, setShowPackages] = useState<boolean>(
    selectedPackages.length > 0,
  );
  const [showServices, setShowServices] = useState<boolean>(
    selectedServices.length > 0,
  );
  const [skipMembership, setSkipMembership] = useState(false);

  const isLocked = !!invoiceData;

  const packageMap = useMemo(
    () => Object.fromEntries(packages.map((pkg) => [pkg.packageId, pkg])),
    [packages],
  );

  const filteredServices = useMemo(() => {
    return services.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [services, searchTerm]);

  const formatPrice = (price: number = 0) =>
    price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={cn(
          "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 transition-all sticky top-4 z-20",
          isLocked && "opacity-90",
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 rounded-xl">
              <MapPin size={18} className="text-orange-500" />
            </div>
            <Label className="text-[12px] font-black uppercase tracking-widest text-slate-400">
              {t("branchLabel")}
            </Label>
          </div>
          {isLocked && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
              <Lock size={12} /> {t("confirmed")}
            </span>
          )}
        </div>

        <Select
          value={selectedBranch}
          onValueChange={onSelectBranch}
          disabled={isLocked}
        >
          <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 ring-orange-100 transition-all">
            <SelectValue placeholder={t("branchPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl font-bold">
            {branches.map((b) => (
              <SelectItem
                key={b.branch_id}
                value={b.branch_id}
                className="rounded-xl my-1 focus:bg-orange-50 focus:text-orange-600"
              >
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "transition-all duration-700",
          !selectedBranch && "opacity-20 grayscale pointer-events-none",
        )}
      >
        {!data ? (
          !skipMembership ? (
            <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden group animate-in zoom-in-95">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                <Dumbbell size={200} className="text-white rotate-12" />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-orange-500 rounded-3xl text-white shadow-lg shadow-orange-500/30">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tight leading-none mb-2">
                      {t("membershipTitle")}
                    </h3>
                    <p className="text-sm text-slate-400 font-bold max-w-xs leading-relaxed">
                      {t("membershipSubtitle")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkipMembership(true)}
                  className="bg-transparent border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl px-6 h-12 font-black uppercase text-[10px] tracking-[0.2em]"
                >
                  {t("onlyServices")} <X size={14} className="ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allMemberships.map((membership) => (
                  <button
                    key={membership.membership_type_id}
                    onClick={() =>
                      onSelectMembership(String(membership.membership_type_id))
                    }
                    className="group relative flex items-center justify-between p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white hover:border-orange-500 transition-all duration-500 text-left"
                  >
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-white group-hover:text-slate-900 transition-colors uppercase italic tracking-tight">
                        {membership.name}
                      </h4>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest opacity-80">
                        {t("planPriceBadge")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-slate-400 group-hover:text-slate-400 align-top mr-1">
                        {currencySymbol}
                      </span>
                      <span className="text-4xl font-black text-white group-hover:text-slate-900 tracking-tighter">
                        {membership.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setSkipMembership(false)}
                className="rounded-full h-14 px-10 border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-500 bg-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200/50 transition-all"
              >
                <Plus size={16} className="mr-3" /> {t("addMembershipBack")}
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-6">
              {t("selectedPlanLabel")}
            </Label>
            <MembershipSummary plan={data} onRemove={onRemoveMembership} />
          </div>
        )}
      </div>

      <div
        className={cn(
          "space-y-12 transition-all duration-1000",
          !selectedBranch
            ? "opacity-10 scale-[0.98] blur-sm pointer-events-none"
            : "opacity-100",
        )}
      >
        {packages.length > 0 && (
          <section
            className={cn(
              "bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden",
              isLocked && "opacity-70",
            )}
          >
            <div className="p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 rounded-full">
                    <PackagePlus size={14} className="text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                      {t("upgradeAvailable")}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                    {isLocked
                      ? t("extraServicesTitleLocked")
                      : t("extraServicesTitle")}
                  </h3>
                </div>
                {!isLocked && (
                  <Select
                    value={showPackages ? "yes" : "no"}
                    onValueChange={(val) => setShowPackages(val === "yes")}
                  >
                    <SelectTrigger className="w-full sm:w-64 h-12 rounded-2xl border-none bg-slate-50 font-black text-[11px] uppercase tracking-wider px-6">
                      <SelectValue placeholder={t("explorePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl font-bold">
                      <SelectItem value="no">{t("hidePackages")}</SelectItem>
                      <SelectItem value="yes">
                        {t("showPackages", { count: packages.length })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {showPackages && (
                <div className="mt-8 pt-10 border-t border-slate-50">
                  <PackageCarousel
                    packages={packages}
                    selectedPackageIds={selectedPackages.map(
                      (p) => p.packageId,
                    )}
                    onSelectPackage={(pkgId) =>
                      !isLocked && togglePackage(packageMap[pkgId])
                    }
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {showServices && services.length > 6 && (
          <div className="mx-auto animate-in slide-in-from-top-4">
            <div className="relative group">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                size={18}
              />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 pl-14 pr-6 rounded-3xl border-none bg-white shadow-xl shadow-slate-200/50 font-bold focus:ring-2 ring-orange-100 transition-all"
              />
            </div>
          </div>
        )}

        {(services.length > 0 || isLoadingServices) && toggleService && (
          <section
            className={cn(
              "bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden",
              isLocked && "opacity-70",
            )}
          >
            <div className="p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full">
                    <Plus size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                      {t("aLaCarte")}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">
                    {t("additionalServicesLabel")}
                  </h3>
                </div>

                {!isLocked && (
                  <Select
                    value={showServices ? "yes" : "no"}
                    onValueChange={(val) => setShowServices(val === "yes")}
                  >
                    <SelectTrigger className="w-full sm:w-64 h-12 rounded-2xl border-none bg-slate-50 font-black text-[11px] uppercase tracking-wider px-6">
                      <SelectValue placeholder={t("explorePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl font-bold">
                      <SelectItem value="no">{t("hideServices")}</SelectItem>
                      <SelectItem value="yes">
                        {t("showServices", { count: services.length })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {showServices && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">
                    {filteredServices.map((service) => {
                      const isSelected = selectedServices.some(
                        (s) => s.service_id === service.service_id,
                      );
                      const userHasMembership = !!data || isMember;
                      const servicePrice = userHasMembership
                        ? Number(service.lowest_price_member)
                        : Number(service.lowest_price_no_member);

                      return (
                        <button
                          key={service.service_id}
                          disabled={isLocked}
                          onClick={() => toggleService?.(service)}
                          className={cn(
                            "group relative flex flex-col text-left rounded-[2.5rem] border-2 transition-all duration-500 h-full overflow-hidden",
                            isSelected
                              ? "bg-orange-50/40 border-orange-500 shadow-2xl shadow-orange-200/40 ring-4 ring-orange-500/5 -translate-y-2"
                              : "bg-white border-slate-100 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1",
                            isLocked &&
                              "opacity-80 grayscale-[0.3] cursor-not-allowed",
                          )}
                        >
                          <div className="p-6 pb-0 flex justify-between items-start w-full">
                            <div
                              className={cn(
                                "p-3 rounded-2xl transition-all duration-500 shadow-sm",
                                isSelected
                                  ? "bg-orange-500 text-white scale-110 rotate-3"
                                  : "bg-slate-50 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500",
                              )}
                            >
                              {isSelected ? (
                                <CheckCircle2 size={20} strokeWidth={3} />
                              ) : (
                                <Plus size={20} strokeWidth={3} />
                              )}
                            </div>
                            {!userHasMembership &&
                              Number(service.lowest_price_member) <
                                Number(service.lowest_price_no_member) && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-tighter rounded-full border border-orange-200">
                                  <Sparkles size={10} />
                                  {t("planPriceBadge")}
                                </div>
                              )}
                          </div>

                          <div className="p-6 flex-1 space-y-4">
                            <div className="space-y-1.5">
                              <h4
                                className={cn(
                                  "text-[15px] font-black uppercase italic tracking-tight leading-tight transition-colors line-clamp-2",
                                  isSelected
                                    ? "text-orange-700"
                                    : "text-slate-900 group-hover:text-orange-600",
                                )}
                              >
                                {service.name}
                              </h4>

                              <div className="flex flex-wrap gap-2">
                                {service.service_category?.name && (
                                  <span className="flex items-center gap-1 text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest">
                                    <Tag size={8} />
                                    {service.service_category.name}
                                  </span>
                                )}
                                {service.duration_minutes && (
                                  <span className="flex items-center gap-1 text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                                    <Clock size={8} strokeWidth={3} />
                                    {service.duration_minutes} MIN
                                  </span>
                                )}
                              </div>
                            </div>

                            {service.description && (
                              <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed normal-case italic">
                                {service.description}
                              </p>
                            )}
                          </div>

                          <div
                            className={cn(
                              "p-6 pt-4 mt-auto border-t flex items-center justify-between w-full transition-colors",
                              isSelected
                                ? "border-orange-100 bg-orange-100/30"
                                : "border-slate-50 bg-slate-50/30",
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">
                                {t("costNet")}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[12px] font-black text-slate-400">
                                  {currencySymbol}
                                </span>
                                <span
                                  className={cn(
                                    "text-2xl font-black tracking-tighter",
                                    servicePrice === 0
                                      ? "text-green-600"
                                      : "text-slate-900",
                                  )}
                                >
                                  {servicePrice === 0
                                    ? t("free")
                                    : formatPrice(servicePrice)}
                                </span>
                              </div>
                            </div>

                            {isSelected ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-orange-500/20 animate-in slide-in-from-right-3">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm" />
                                {t("ready")}
                              </div>
                            ) : (
                              <div className="text-slate-300 group-hover:text-orange-300 transition-colors">
                                <ChevronDown size={20} className="-rotate-90" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {isLoadingServices && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
