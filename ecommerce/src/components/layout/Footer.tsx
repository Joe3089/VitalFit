"use client";
import Image from "next/image";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline"; // Usé Outline para un look más limpio, cambia a solid si prefieres peso visual
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");

  const servicesConfig = [
    { key: "yoga" },
    { key: "crossfit" },
    { key: "spinning" },
    { key: "pilates" },
  ];

  const quickLinksConfig = [
    { key: "services", href: "/services" },
    { key: "membership", href: "/memberships" },
    { key: "branches", href: "/branches" },
    { key: "contact", href: "/contact" },
  ];

  return (
    <footer className="bg-gray-50 text-gray-800 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="flex flex-col items-start space-y-6">
            <div className="relative w-48 h-auto">
              <Image
                src="/logo/logo-vitalfit-orange.png"
                alt="Logo VitalFit"
                width={200}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              {t("tagline")}
            </p>

            <div className="flex space-x-3 pt-2">
              {[
                {
                  icon: FaInstagram,
                  href: "https://www.instagram.com/vitalfit.68",
                  label: "social.instagram",
                },
                {
                  icon: FaTwitter,
                  href: "https://x.com/VITALFIT68",
                  label: "social.twitter",
                },
                {
                  icon: FaFacebookF,
                  href: "https://facebook.com",
                  label: "social.facebook",
                },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-[#F27F2A] hover:text-white hover:border-[#F27F2A] transition-all duration-300 shadow-sm"
                  aria-label={t(social.label)}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-6">
              {t("quickLinks.title")}
            </h3>
            <ul className="space-y-3">
              {quickLinksConfig.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-[#F27F2A] transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 transition-all duration-300 overflow-hidden text-[#F27F2A] mr-0 group-hover:mr-1">
                      •
                    </span>
                    {t(`quickLinks.links.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-6">
              {t("services.title")}
            </h3>
            <ul className="space-y-3">
              {servicesConfig.map((service) => (
                <li key={service.key} className="text-sm text-gray-600">
                  {t(`services.list.${service.key}`)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-6">
              {t("contact.title")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <PhoneIcon className="w-5 h-5 text-[#F27F2A] shrink-0" />
                <span className="mt-0.5">{t("contact.phone")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <EnvelopeIcon className="w-5 h-5 text-[#F27F2A] shrink-0" />
                <span className="mt-0.5">{t("contact.email")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <MapPinIcon className="w-5 h-5 text-[#F27F2A] shrink-0" />
                <span className="leading-snug mt-0.5">
                  {t("contact.address")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
