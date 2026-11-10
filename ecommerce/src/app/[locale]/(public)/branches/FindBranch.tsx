"use client";

import { Input } from "@/components/ui/Input";
import { BranchCardInfo } from "./BranchCardInfo";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { BranchInfo } from "@vitalfit/sdk";
import { useBranchServices } from "@/hooks/useBranchServices";
import { BranchServicesSection } from "@/components/features/branch/BranchServicesSection";

const MapLoading = () => {
  const t = useTranslations("FindBranchPage");
  return (
    <div className="w-full h-full bg-gray-100 animate-pulse flex flex-col items-center justify-center text-gray-400 gap-2">
      <MapPinIcon className="w-8 h-8 opacity-50" />
      <span>{t("loading_map")}</span>
    </div>
  );
};

const MapboxPicker = dynamic(() => import("@/components/ui/MapboxPicker"), {
  ssr: false,
  loading: MapLoading,
});

type FindBranchProps = {
  initialBranches: BranchInfo[];
};

export default function FindBranch({ initialBranches }: FindBranchProps) {
  const t = useTranslations("FindBranchPage");

  // Asegura que la página inicie arriba al cargar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [mapBranches] = useState(initialBranches);
  const [selectedBranch, setSelectedBranch] = useState<BranchInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    services,
    isLoading: isLoadingServices,
    fetchServices,
    resetServices,
    hasMore, // Importante para el scroll infinito
  } = useBranchServices();

  const cardsPerPage = 4;

  const filteredBranches = useMemo(() => {
    return mapBranches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.address.toLowerCase().includes(searchTerm.toLowerCase());

      const hasValidCoords =
        typeof b.latitude === "number" &&
        typeof b.longitude === "number" &&
        !(b.latitude === 0 && b.longitude === 0);

      return matchesSearch && hasValidCoords;
    });
  }, [mapBranches, searchTerm]);

  const totalPages = Math.ceil(filteredBranches.length / cardsPerPage);

  const currentBranches = useMemo(() => {
    return filteredBranches.slice(
      currentPage * cardsPerPage,
      currentPage * cardsPerPage + cardsPerPage,
    );
  }, [filteredBranches, currentPage]);

  const handleSelectBranch = (branch: BranchInfo) => {
    setSelectedBranch(branch);
    resetServices(); // Limpia servicios de la sede anterior
    fetchServices(branch.branch_id); // Carga la primera página de la nueva sede
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  return (
    <div className="pt-4 pb-20 px-4 md:px-8 bg-gray-50 min-h-screen font-sans">
      <header className="pt-4 pb-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center md:items-start">
          <h1 className="text-4xl md:text-5xl font-heading italic uppercase tracking-tighter text-slate-900 mb-3 leading-tight">
            <span className="prevent-clip">{t("title")}</span>
          </h1>
          <div className="h-1 w-20 bg-primary mb-4" />
          <p className="text-slate-500 max-w-xl text-center md:text-left font-medium leading-relaxed">
            {t("description")}
          </p>
        </div>
      </header>

      <main className="px-6 pb-20 max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 xl:col-span-3 space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
              <div className="relative group mb-4">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={t("search_placeholder")}
                  className="w-full h-12 pl-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <Button className="w-full h-12 bg-slate-900 hover:bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                <MapPinIcon className="w-5 h-5" />
                {t("find_nearest_button")}
              </Button>
            </div>

            <div className="space-y-4">
              {filteredBranches.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic">
                  {t("no_valid_branches_found")}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {currentBranches.map((branch) => (
                  <BranchCardInfo
                    key={branch.branch_id}
                    title={branch.name}
                    location={branch.address}
                    phone={branch.phone}
                    isActive={selectedBranch?.branch_id === branch.branch_id}
                    onClick={() => handleSelectBranch(branch)}
                  />
                ))}
              </div>

              {filteredBranches.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-20 transition-colors text-slate-600"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 transition-all duration-300 rounded-full ${
                          i === currentPage
                            ? "w-8 bg-primary"
                            : "w-2 bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-20 transition-colors text-slate-600"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <div
              className="
                h-[500px] 
                lg:h-[calc(100vh-250px)] 
                lg:sticky lg:top-10 
                rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50
              "
            >
              <MapboxPicker
                branches={filteredBranches}
                isLoading={false}
                selectedBranch={selectedBranch}
              />
            </div>
          </div>
        </div>

        {selectedBranch && (
          <div className="mt-24">
            <BranchServicesSection
              services={services}
              isLoading={isLoadingServices}
              branchName={selectedBranch.name}
              hasMore={hasMore} // Pasamos el estado al componente de UI
              onLoadMore={() => fetchServices(selectedBranch.branch_id, true)} // Gatillo de scroll infinito
            />
          </div>
        )}
      </main>
    </div>
  );
}
