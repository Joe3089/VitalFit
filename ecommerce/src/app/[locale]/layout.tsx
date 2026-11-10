import type { Metadata } from "next";
import { montserrat, bebas } from "@/styles/styles";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "@/context/AuthContext";
import { ClerkProvider } from "@clerk/nextjs";
import { esES, enUS } from "@clerk/localizations";

import "../../styles/globals.css";
import ToasterProvider from "@/components/ToasterProvider";
import FunnelTracker from "@/components/FunnelTracker";

export const metadata: Metadata = {
  title: "VITALFIT",
  description: "Administra tus reservas, entrenadores y sucursales de gimnasio",
};

type Props = {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const plainMessages = (messages as any)?.default ?? messages;
  const serializableMessages = JSON.parse(JSON.stringify(plainMessages));

  return (
    // 1. CORRECCIÓN AQUÍ: Agregamos suppressHydrationWarning
    <html
      lang={locale}
      className={`${montserrat.variable} ${bebas.variable}`}
      suppressHydrationWarning={true}
    >
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={serializableMessages}>
          <ClerkProvider
            localization={locale === "es" ? esES : enUS}
            signInFallbackRedirectUrl={`/${locale}/dashboard`}
            signUpFallbackRedirectUrl={`/${locale}/dashboard`}
          >
            <AuthProvider>
              <FunnelTracker />
              {children}
              <ToasterProvider />
            </AuthProvider>
          </ClerkProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
