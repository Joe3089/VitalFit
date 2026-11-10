"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export default function BannerOffer() {
  const t = useTranslations("BannerOffer");

  const items = [
    {
      title: t("title"),
      description: t("description"),
      validity: t("validity"),
      button: t("button"),
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () =>
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  const next = () =>
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));

  const current = items[currentIndex];

  return (
    <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-8 text-white">
      <div className="absolute right-0 top-0 opacity-20">
        <div className="w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <Button
        onClick={prev}
        className="absolute -left-6 top-1/2 -translate-y-1/2 border-4 border-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-orange-600 z-30"
      >
        <ChevronLeftIcon className="w-5 h-5 text-white" />
      </Button>

      <Button
        onClick={next}
        className="absolute -right-6 top-1/2 -translate-y-1/2 border-4 border-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-orange-600 z-30"
      >
        <ChevronRightIcon className="w-5 h-5 text-white" />
      </Button>

      <div className="relative z-10 flex items-stretch justify-center px-16 gap-6">
        <img
          src="/images/aviso1.png"
          alt="Decoración izquierda"
          className="w-24 h-24 object-contain self-start"
        />

        <div className="flex-grow max-w-2xl text-start flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-primary mb-2 leading-normal">
            <span className="prevent-clip">{current.title}</span>
          </h3>
          <p className="text-gray-300 mb-4">{current.description}</p>
          <p className="text-sm text-gray-400 mb-4">{current.validity}</p>
          <Button className="w-1/2">{current.button}</Button>
        </div>

        <img
          src="/images/dumbbell1.png"
          alt="Decoración derecha"
          className="w-24 h-24 object-contain self-end"
        />
      </div>
    </div>
  );
}
