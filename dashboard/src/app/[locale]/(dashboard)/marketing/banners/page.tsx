"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import BannersTable from "./BannersTable";
import { StatCard } from "@/components/ui/StatCard";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface StatsData {
    total: number;
    active: number;
}

const initialStatsData: StatsData = {
    total: 0,
    active: 0,
};

const statCardsConfig = [
    {
        title: "Total",
        valueKey: "total" as const,
        fontColor: "text-black-600",
    },
    {
        title: "Activos",
        valueKey: "active" as const,
        fontColor: "text-green-600",
    },
];

export default function BannersPage() {
    const router = useRouter();
    const t = useTranslations("banners");

    const [statsData, setStatsData] = useState<StatsData>(initialStatsData);

    const handleBannerUpdate = useCallback((stats: StatsData) => {
        setStatsData(stats);
    }, []);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
                {statCardsConfig.map((card) => {
                    return (
                        <StatCard
                            key={card.title}
                            title={t(`stats.${card.valueKey}`)}
                            value={
                                <>
                                    {statsData[card.valueKey] ?? 0}
                                    <span className={`ml-1.5 font-normal ${card.fontColor}`}>
                                        {t("stats.unit")}
                                    </span>
                                </>
                            }
                        />
                    );
                })}
            </div>

            <PageHeader title={t("list.title")} subtitle={t("list.subtitle")}>
                <Button
                    className="bg-transparent text-black border border-gray-100"
                    onClick={() => {
                        router.replace("/marketing/banners/new");
                    }}
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t("actions.add")}
                </Button>
            </PageHeader>

            <BannersTable onBannerUpdate={handleBannerUpdate} />
        </div>
    );
}
