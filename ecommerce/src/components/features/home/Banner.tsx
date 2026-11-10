import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BannerProps {
  imageUrl: string;
  title: string | React.ReactNode;
  subtitle?: string;
  height?: string;
  overlay?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({
  imageUrl,
  title,
  subtitle,
  height = "h-[500px]",
  overlay = true,
  className = "",
  actions,
}) => {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-slate-950",
        height,
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt="Banner Background"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Overlay: gradiente para mejorar contraste */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10" />
      )}

      <div className="relative z-20 h-full container mx-auto px-6">
        <div className="flex flex-col justify-center h-full max-w-4xl">
          {/* CORRECCIÓN: Agregamos !text-white para anular el global.css */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[0.85] text-white drop-shadow-2xl">
            {title}
          </h1>

          {subtitle && (
            <div className="mt-8 flex items-center gap-4 animate-fade-in-up">
              <div className="h-1 w-12 bg-primary rounded-full shrink-0" />
              <p
                className="text-lg md:text-2xl text-white/90 font-body font-medium leading-tight italic"
                dangerouslySetInnerHTML={{ __html: subtitle }}
              />
            </div>
          )}

          {actions && (
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up delay-300">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Partículas Animadas */}
      <ul className="absolute inset-0 z-10 pointer-events-none">
        {[
          { left: "10%", size: "w-10 h-10", delay: "0s", duration: "20s" },
          { left: "20%", size: "w-20 h-20", delay: "2s", duration: "17s" },
          { left: "32%", size: "w-40 h-40", delay: "7s", duration: "25s" },
          { left: "70%", size: "w-10 h-10", delay: "0s", duration: "15s" },
          { left: "85%", size: "w-32 h-32", delay: "11s", duration: "22s" },
        ].map((item, index) => (
          <li
            key={index}
            className={cn(
              "absolute list-none bg-white/10 animate-square bottom-[-150px]",
              item.size,
            )}
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}
      </ul>
    </div>
  );
};

export default Banner;
