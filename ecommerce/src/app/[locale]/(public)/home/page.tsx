"use client";

import Banner from "@/components/features/home/Banner";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import SectionAboutUs from "@/components/features/home/AboutUs";
import { useRouter } from "@/i18n/routing";

const aboutUsConfig = [
  {
    id: 1,
    key: "mission",
    imageUrl: "/images/aboutUs/mision.png",
    bgColor: "bg-primary",
    textColor: "text-white",
  },
  {
    id: 2,
    key: "vision",
    imageUrl: "/images/aboutUs/vision.jpeg",
    bgColor: "bg-white",
    textColor: "text-slate-900",
  },
  {
    id: 3,
    key: "values",
    imageUrl: "/images/aboutUs/valores.jpeg",
    bgColor: "bg-primary",
    textColor: "text-white",
  },
  {
    id: 4,
    key: "objectives",
    imageUrl: "/images/aboutUs/objetivos.jpeg",
    bgColor: "bg-white",
    textColor: "text-slate-900",
  },
];

export default function Home() {
  const router = useRouter();
  const t = useTranslations("HomePage");
  const tAbout = useTranslations("HomePage.aboutUs");

  const aboutUs = aboutUsConfig.map((item) => ({
    ...item,
    title: tAbout(`${item.key}.title`),
    imageAlt: tAbout(`${item.key}.imageAlt`),
    content: tAbout.rich(`${item.key}.content`, {
      p: (chunks) => <p className="leading-relaxed opacity-90">{chunks}</p>,
    }),
  }));

  return (
    <div className="bg-white">
      <Navbar />

      <main>
        <Banner
          imageUrl="/images/banner-home.png"
          title={t.rich("banner.title", {
            highlight: (chunks: React.ReactNode) => (
              <span className="text-gradient-orange italic">{chunks}</span>
            ),
          })}
          subtitle={t("banner.subtitle")}
          height="h-screen"
          actions={
            <>
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-full hover:scale-105 transition-transform"
                onClick={() => {
                  router.push("/memberships");
                }}
              >
                {t("banner.startBtn")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg font-semibold rounded-full border-white text-white hover:bg-white hover:text-slate-900 hover:scale-105 transition-transform"
                onClick={() => {
                  router.push("/branches");
                }}
              >
                {t("banner.branchesBtn")}
              </Button>
            </>
          }
        />

        {/* CONTENEDOR CON OVERLAP Y SOMBRA PROYECTADA */}
        <section
          id="aboutUs"
          className="relative z-20 -mt-20 md:-mt-32 rounded-t-[4rem] bg-white pt-24 shadow-[0_-25px_50px_rgba(0,0,0,0.15)]"
        >
          {/* HEADER DE SECCIÓN MEJORADO */}
          <div className="max-w-7xl mx-auto px-6 mb-20 flex flex-col items-center text-center">
            <h2 className="text-5xl md:text-7xl font-heading italic uppercase tracking-tighter text-slate-900 mb-6">
              {tAbout("mainTitle") || "ADN VitalFit"}
            </h2>
            <div className="h-2 w-28 bg-primary rounded-full" />
          </div>

          <SectionAboutUs sections={aboutUs} />
        </section>
      </main>

      <section className="w-full px-0 md:px-4 lg:px-8">
        <div className="w-full flex justify-center rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="/images/bannerfooter.jpeg"
            alt="Descarga la app"
            width={1920}
            height={700}
            className="w-full h-[250px] md:h-auto object-cover md:object-contain"
            priority={false}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
