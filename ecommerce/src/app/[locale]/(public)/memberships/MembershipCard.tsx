"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface MembershipCardProps {
  title: string;
  price: number;
  billingPeriod: string;
  description?: string;
  services: string[];
  featured?: boolean;
  featuredLabel?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  accentColor?: string;
  currency?: string;
  refPrice?: string | number;
  showReferencePrice?: boolean;
}

export function MembershipCard({
  title,
  price,
  billingPeriod,
  description,
  services,
  featured = false,
  featuredLabel = "Recomendado",
  buttonText = "Empezar Ahora",
  onButtonClick,
  accentColor = "#f97316",
  currency = "USD",
  refPrice,
  showReferencePrice,
}: MembershipCardProps) {
  const isFeatured = featured;

  const cardContainerClasses = clsx(
    "relative flex flex-col justify-between transition-all duration-300 ease-out",
    "rounded-[2rem] border",
    isFeatured
      ? "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500 shadow-2xl shadow-orange-500/40 scale-100 md:scale-105 z-10"
      : "bg-white border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 z-0",
  );

  const titleColor = isFeatured ? "text-orange-50" : "text-gray-900";
  const priceColor = isFeatured ? "text-white" : "text-gray-900";
  const descriptionColor = isFeatured ? "text-orange-100" : "text-gray-500";
  const periodColor = isFeatured ? "text-orange-100" : "text-gray-400";
  const serviceTextColor = isFeatured
    ? "text-white font-medium"
    : "text-gray-600";

  const checkBg = isFeatured ? "bg-white/25 backdrop-blur-sm" : "bg-orange-50";
  const checkColor = isFeatured ? "text-white" : "text-orange-500";

  const badge = isFeatured && (
    <div className="absolute top-0 right-0 overflow-hidden w-32 h-32 pointer-events-none ">
      <div className="absolute  -right-[30px] w-[120px] transform rotate-45 bg-white text-orange-600 text-[10px] font-bold py-1.5 text-center shadow-sm uppercase tracking-wider">
        {featuredLabel}
      </div>
    </div>
  );

  return (
    <div className={cardContainerClasses}>
      <div className="hidden md:block">{badge}</div>

      <div className="block md:hidden">
        <button
          onClick={onButtonClick}
          className={clsx(
            "w-full p-5 flex items-center justify-between group",
            isFeatured
              ? "bg-orange-500 text-white rounded-[2rem]"
              : "bg-white rounded-[2rem]",
          )}
        >
          <div className="flex flex-col items-start gap-1 text-left">
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "text-sm font-bold uppercase tracking-wide opacity-90",
                )}
              >
                {title}
              </span>
              {isFeatured && (
                <Sparkles className="w-3 h-3 text-white animate-pulse" />
              )}
            </div>

            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">${price}</span>
                <span className={clsx("text-xs font-medium opacity-80")}>
                  /{billingPeriod}
                </span>
              </div>
              {showReferencePrice && refPrice && (
                <span className="text-[10px] font-bold uppercase tracking-tight opacity-70">
                  {currency === "VES" ? "Bs." : currency} {refPrice}
                </span>
              )}
            </div>
          </div>

          <div
            className={clsx(
              "p-2 rounded-full transition-colors",
              isFeatured ? "bg-white/20" : "bg-gray-50",
            )}
          >
            <ChevronRight
              className={clsx(
                "w-5 h-5",
                isFeatured ? "text-white" : "text-gray-400",
              )}
            />
          </div>
        </button>
      </div>

      <div className="hidden md:flex flex-col h-full p-8 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <h3
              className={clsx(
                "text-lg font-bold mb-4 uppercase tracking-wider",
                titleColor,
              )}
            >
              {title}
            </h3>
            {isFeatured && <Sparkles className="w-5 h-5 text-orange-200" />}
          </div>

          <div className="flex flex-col mb-3">
            <div className="flex items-baseline gap-1">
              <span
                className={clsx(
                  "text-4xl font-extrabold tracking-tighter",
                  priceColor,
                )}
              >
                ${price}
              </span>
              <span className={clsx("text-lg font-medium", periodColor)}>
                /{billingPeriod}
              </span>
            </div>
            {showReferencePrice && refPrice && (
              <span
                className={clsx(
                  "text-xs font-bold uppercase tracking-tight mt-1",
                  periodColor,
                )}
              >
                Monto ref: {currency === "VES" ? "Bs." : currency} {refPrice}
              </span>
            )}
          </div>

          {description && (
            <p
              className={clsx(
                "text-sm leading-relaxed font-medium",
                descriptionColor,
              )}
            >
              {description}
            </p>
          )}
        </div>

        <div
          className={clsx(
            "w-full h-px mb-8",
            isFeatured ? "bg-white/20" : "bg-gray-100",
          )}
        />

        <ul className="space-y-4 mb-8 flex-grow">
          {services.map((service, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className={clsx(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  checkBg,
                )}
              >
                <Check
                  className={clsx("w-3.5 h-3.5", checkColor)}
                  strokeWidth={3}
                />
              </div>
              <span className={clsx("text-sm leading-6", serviceTextColor)}>
                {service}
              </span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onButtonClick}
          className={clsx(
            "w-full py-7 text-base font-bold rounded-2xl shadow-lg transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]",
          )}
          style={{
            backgroundColor: isFeatured ? "#FFFFFF" : accentColor,
            color: isFeatured ? "#ea580c" : "#FFFFFF",
          }}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
