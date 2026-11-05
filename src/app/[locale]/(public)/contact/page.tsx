"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import Logo from "@/components/features/Logo";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import Footer from "@/components/layout/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/sdk-config";

const REASONS = {
  consulta: "general",
  membresia: "memberships",
  servicios: "services",
  reclamo: "complaint",
  sugerencia: "suggestion",
} as const;

const PREFERENCES = {
  email: "email",
  telefono: "phone",
  whatsapp: "whatsapp",
} as const;

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const t = useTranslations("ContactPage");

  const [motivoContacto, setMotivoContacto] = useState("");
  const [preferenciaContacto, setPreferenciaContacto] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const needsPhone =
    preferenciaContacto === "telefono" || preferenciaContacto === "whatsapp";

  // HU-ECOMMERCE-23: messages are stored in the backend and answered from the dashboard.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!motivoContacto || !mensaje.trim()) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const reason = t(
      `form.reasons.${REASONS[motivoContacto as keyof typeof REASONS]}`,
    );
    const preference = preferenciaContacto
      ? t(
          `form.preferences.${PREFERENCES[preferenciaContacto as keyof typeof PREFERENCES]}`,
        )
      : "";
    try {
      await api.crm.sendContactMessage({
        name: `${nombre} ${apellido}`.trim(),
        email: correo.trim(),
        phone: telefono.trim() || undefined,
        subject: preference ? `${reason} · ${preference}` : reason,
        message: mensaje.trim(),
      });
      setStatus("sent");
      setNombre("");
      setApellido("");
      setCorreo("");
      setTelefono("");
      setMensaje("");
      setMotivoContacto("");
      setPreferenciaContacto("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="pt-28 pb-20 px-4 md:px-8 bg-white min-h-screen font-sans">
      <Navbar transparent={false} />

      <section className="bg-gray-50 py-12 px-6 rounded-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl text-left font-heading italic uppercase leading-tight mb-4 text-slate-900">
                <span className="prevent-clip">{t("hero.title")}</span>
              </h1>
              <p className="text-gray-600 text-lg">{t("hero.subtitle")}</p>
            </div>
            <div>
              <Logo theme="dark" slogan={true} />
            </div>
          </div>

          <form className="p-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("form.nameLabel")}*
                </label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder={t("form.namePlaceholder")}
                  required
                  maxLength={70}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="apellido"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("form.lastNameLabel")}*
                </label>
                <Input
                  id="apellido"
                  name="apellido"
                  type="text"
                  placeholder={t("form.lastNamePlaceholder")}
                  required
                  maxLength={70}
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="correo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("form.emailLabel")}*
              </label>
              <Input
                id="correo"
                name="correo"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                required
                maxLength={255}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Select
                  value={motivoContacto}
                  onValueChange={setMotivoContacto}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("form.reasonPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulta">
                      {t("form.reasons.general")}
                    </SelectItem>
                    <SelectItem value="membresia">
                      {t("form.reasons.memberships")}
                    </SelectItem>
                    <SelectItem value="servicios">
                      {t("form.reasons.services")}
                    </SelectItem>
                    <SelectItem value="reclamo">
                      {t("form.reasons.complaint")}
                    </SelectItem>
                    <SelectItem value="sugerencia">
                      {t("form.reasons.suggestion")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={preferenciaContacto}
                  onValueChange={setPreferenciaContacto}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("form.preferencePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      {t("form.preferences.email")}
                    </SelectItem>
                    <SelectItem value="telefono">
                      {t("form.preferences.phone")}
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      {t("form.preferences.whatsapp")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {needsPhone && (
              <div className="mb-6">
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("form.phoneLabel")}*
                </label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+58 412 0000000"
                  required
                  maxLength={50}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            <div className="mb-5">
              <Textarea
                id="mensaje"
                name="mensaje"
                placeholder={t("form.messagePlaceholder")}
                rows={5}
                required
                maxLength={5000}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full resize-none text-center border-0 shadow-sm text-lg font-medium"
              />
            </div>

            {status === "sent" && (
              <p
                role="status"
                className="mb-4 rounded-md bg-green-50 p-3 text-center text-sm font-medium text-green-700"
              >
                {t("form.success")}
              </p>
            )}
            {status === "error" && (
              <p
                role="alert"
                className="mb-4 rounded-md bg-red-50 p-3 text-center text-sm font-medium text-red-700"
              >
                {motivoContacto ? t("form.error") : t("form.reasonRequired")}
              </p>
            )}

            <Button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-primary text-white font-semibold py-5 rounded-md"
            >
              {status === "sending"
                ? t("form.sending")
                : t("form.submitButton")}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
