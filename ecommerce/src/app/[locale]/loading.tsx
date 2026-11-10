"use client";

import React from "react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center">
        <Image
          src="/logo/logo-vitalfit-orange.png"
          alt="VitalFit Logo"
          width={250}
          height={250}
          className="rounded-full animate-pulse"
          priority
        />
        <div className="mt-6 flex space-x-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400"></span>
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:0.2s]"></span>
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:0.4s]"></span>
        </div>
      </div>
    </div>
  );
}
