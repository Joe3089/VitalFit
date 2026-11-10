"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/Navbar";
import { MembershipCard } from "./MembershipCard";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  BuildingStorefrontIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/sdk-config";
import { useEffect, useState, useCallback } from "react";
import { PublicMembershipResponse, mainCurrencies } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/routing";

type MembershipWithFeatured = PublicMembershipResponse & {
  featured: boolean;
};

export default function Memberships() {
  const t = useTranslations("MembershipsPage");
  const router = useRouter();

  const [membershipPlans, setMembershipPlans] = useState<
    MembershipWithFeatured[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");

  const fetchMemberships = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.membership.publicGetMemberships(
        "",
        { page: 1, limit: 12 },
        currency,
      );

      const data = response?.data ?? [];

      // Ordenar por precio (barato → caro)
      const sorted = [...data].sort((a, b) => a.price - b.price);

      // Destacar el más caro
      const withFeatured = sorted.map((item, idx) => ({
        ...item,
        featured: idx === sorted.length - 1,
      }));

      setMembershipPlans(withFeatured);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  // Fetch memberships
  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const cardsForDisplay = (): MembershipWithFeatured[] => {
    if (membershipPlans.length === 0) {
      return [];
    }

    const featuredIndex = membershipPlans.findIndex((m) => m.featured);
    if (featuredIndex === -1) {
      return membershipPlans;
    }

    const featuredCard = membershipPlans[featuredIndex];
    const others = membershipPlans.filter((_, idx) => idx !== featuredIndex);

    const middleIndex = Math.floor(others.length / 2);
    return [
      ...others.slice(0, middleIndex),
      featuredCard,
      ...others.slice(middleIndex),
    ];
  };

  const handleBuyMembership = (membership: MembershipWithFeatured) => {
    router.push(`/checkout?membershipId=${membership.membership_type_id}`);
  };

  return (
    <>
      <Navbar transparent={false} />
      <main className="pt-28 pb-20 px-4 md:px-8 bg-gray-50 min-h-screen font-sans">
        {/* HERO */}
        <section className="bg-gray-50 py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              <span className="text-orange-500 prevent-clip">
                {t("hero.titlePart1")}
              </span>{" "}
              <span className="text-gray-900 prevent-clip">
                {t("hero.titlePart2")}
              </span>
            </h1>
            <p className="text-center text-gray-600 w-full mx-auto">
              {t("hero.subtitle")}
            </p>

            <div className="flex justify-center mt-8">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full md:w-32 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              >
                {mainCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* MEMBERSHIP CARDS */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <p className="text-center text-gray-600">Cargando planes...</p>
            ) : (
              <div className="flex flex-col md:flex-row justify-center items-stretch gap-6">
                {cardsForDisplay().map((m) => (
                  <div
                    key={m.membership_type_id}
                    className={`flex-1 transform ${m.featured ? "scale-105 z-10" : ""}`}
                  >
                    <MembershipCard
                      title={m.name}
                      price={m.price}
                      billingPeriod={`${m.duration_days} días`}
                      description={m.description}
                      services={[
                        "Acceso a máquinas",
                        "Ingreso al gimnasio",
                        "Entrenamiento básico",
                      ]}
                      featured={m.featured}
                      currency={currency}
                      refPrice={m.ref_price}
                      showReferencePrice={currency !== "USD"}
                      buttonText="Comprar"
                      onButtonClick={() => handleBuyMembership(m)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* INCLUDES */}
        <section className="py-16 px-6 bg-gray-100">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              {t("includes.title")}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 mx-4 my-8">
              <Card className="text-center p-5">
                <BuildingStorefrontIcon className="w-6 h-6 text-gray-800 inline-block mr-2" />
                <CardTitle className="my-4">
                  {t("includes.item1.title")}
                </CardTitle>
                <CardContent>
                  <p className="text-sm">{t("includes.item1.content")}</p>
                </CardContent>
              </Card>
              <Card className="text-center p-5">
                <UserIcon className="w-6 h-6 text-gray-800 inline-block mr-2" />
                <CardTitle className="my-4">
                  {t("includes.item2.title")}
                </CardTitle>
                <CardContent>
                  <p className="text-sm">{t("includes.item2.content")}</p>
                </CardContent>
              </Card>
              <Card className="text-center p-5">
                <UserGroupIcon className="w-6 h-6 text-gray-800 inline-block mr-2" />
                <CardTitle className="my-4">
                  {t("includes.item3.title")}
                </CardTitle>
                <CardContent>
                  <p className="text-sm">{t("includes.item3.content")}</p>
                </CardContent>
              </Card>
              <Card className="text-center p-5">
                <DevicePhoneMobileIcon className="w-6 h-6 text-gray-800 inline-block mr-2" />
                <CardTitle className="my-4">
                  {t("includes.item4.title")}
                </CardTitle>
                <CardContent>
                  <p className="text-sm">{t("includes.item4.content")}</p>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="max-w-4xl mx-auto bg-primary rounded-2xl md:rounded-3xl p-4 md:p-8 text-center mt-12">
              <span className="text-3xl md:text-4xl font-bold text-white mb-4 block">
                {t("cta.heading")}
              </span>
              <p className="text-white mt-2">{t("cta.subheading")}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-4">
                <Button className="bg-black text-white px-4 py-2 text-sm rounded-md w-full sm:w-auto">
                  {t("cta.advisorButton")}
                </Button>
                <Button className="bg-white text-black px-4 py-2 text-sm rounded-md w-full sm:w-auto">
                  {t("cta.faqButton")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
