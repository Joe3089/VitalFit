import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing"; 
import { setRequestLocale } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  
  if (!hasLocale(routing.locales, locale)) {
    notFound(); 
  }

  setRequestLocale(locale);
  
  let messages;
  try {
    messages = (await import(`../../../messages//${locale}.json`)).default; 
  } catch (error) {
    console.error(`Error al cargar los mensajes para el locale ${locale}:`, error);
    notFound(); 
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
    </NextIntlClientProvider>
  );
}