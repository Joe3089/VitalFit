"use client";

import { useState, useEffect, useRef } from "react";
import { typography, colors } from "@/styles/styles";
import AuthCard from "@/components/features/AuthCard";
import Logo from "@/components/features/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import TextInput from "@/components/ui/TextInput";
import { PhoneInput } from "@/components/ui/phone-input";
import { getRegisterSchema } from "@/lib/validation/registerSchema";
import { RegisterFormData } from "@/lib/validation/registerSchema";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/sdk-config";
import { UserGender } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "sonner";
import { useUser, useClerk } from "@clerk/nextjs";
import { trackFunnel } from "@/lib/tracking";

export default function RegisterPage() {
  const t = useTranslations("RegisterPage");

  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const [formData, setFormData] = useState<RegisterFormData>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    documento: "",
    genero: "",
    nacimiento: "",
    password: "",
    cpassword: "",
  });

  const [error, setError] = useState<
    Partial<Record<keyof RegisterFormData | "terms", string[]>>
  >({});

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terms, setTerms] = useState(false);
  const router = useRouter();

  // Generador de contraseña
  const generateSecurePassword = () =>
    `A${Math.random().toString(36).slice(-10)}!1`;

  // Función para LIMPIAR sesión y regresar al Login
  const handleCleanLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut();
      sessionStorage.removeItem("temp_email");
      sessionStorage.removeItem("temp_password");
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        documento: "",
        genero: "",
        nacimiento: "",
        password: "",
        cpassword: "",
      });
      router.replace("/login");
    } catch (error) {
      console.error("Error limpiando sesión:", error);
      router.replace("/login");
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (isSignedIn && user) {
        const phantomPass = generateSecurePassword();

        setFormData((prev) => ({
          ...prev,
          nombre: user.firstName || prev.nombre,
          apellido: user.lastName || prev.apellido,
          email: user.primaryEmailAddress?.emailAddress || prev.email,
          password: phantomPass,
          cpassword: phantomPass,
        }));

        setIsInitialized(true);

        toast.info(t("notifications.google.success"), {
          description: t("notifications.google.description"),
          duration: 5000,
          icon: "📝",
        });
      } else {
        console.warn("No hay sesión de Clerk activa en Register");
      }
    };

    loadUserData();
  }, [isSignedIn, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();

    const registerSchema = getRegisterSchema(t);
    const result = registerSchema.safeParse(formData);

    const fieldErrors: Partial<
      Record<keyof RegisterFormData | "terms", string[]>
    > = {};

    if (!result.success) {
      const flattened = result.error.flatten();
      Object.entries(flattened.fieldErrors).forEach(([key, value]) => {
        if (value) {
          fieldErrors[key as keyof RegisterFormData] = value as string[];
        }
      });
    }

    if (!terms) {
      fieldErrors.terms = [t("validation.termsRequired")];
    }

    if (Object.keys(fieldErrors).length > 0) {
      setError(fieldErrors);
      const errorCount = Object.keys(fieldErrors).length;

      toast.error(t("notifications.error.incompleteForm"), {
        description: t("notifications.error.incompleteFormDescription", {
          count: errorCount,
        }),
      });
      return;
    }

    const birthDateISO = formData.nacimiento
      ? new Date(formData.nacimiento).toISOString().split("T")[0]
      : "";

    const apiGender = formData.genero as UserGender;

    setIsSubmitting(true);

    const registerPromise = api.auth.signUp({
      first_name: formData.nombre,
      last_name: formData.apellido,
      email: formData.email,
      password: formData.password,
      identity_document: formData.documento,
      phone: formData.telefono,
      birth_date: birthDateISO,
      gender: apiGender,
    });

    toast.promise(registerPromise, {
      loading: t("notifications.loading.submitting"),
      success: (response) => {
        console.warn(response);
        trackFunnel("signup");

        sessionStorage.setItem("temp_email", formData.email);
        sessionStorage.setItem("temp_password", formData.password);

        setError({});
        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          telefono: "",
          documento: "",
          genero: "",
          nacimiento: "",
          password: "",
          cpassword: "",
        });
        setTerms(false);

        setTimeout(() => {
          router.replace("/confirmEmail?flow=register");
        }, 1500);

        return t("notifications.success.toast") || "¡Registro exitoso!";
      },
      error: (err: unknown) => {
        console.error("Error API:", err);
        setIsSubmitting(false);

        const error = err as { message?: string; messages?: string[] };
        const errorMsg = (error?.message || String(error)).toLowerCase();

        if (errorMsg.includes("conflict")) {
          return t("notifications.error.duplicateUser");
        }

        let message = t("notifications.error.unexpected");
        if (error?.messages && Array.isArray(error.messages)) {
          message = error.messages.join(", ");
        } else if (error?.message) {
          message = error.message;
        }

        return message;
      },
    });
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const inputBgClass = "bg-white";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex justify-center w-full max-w-6xl">
        <div className="w-full max-w-2xl lg:max-w-4xl">
          <AuthCard>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0 w-full">
              <div className="text-center lg:text-left">
                <h3
                  className={`${typography.h3} text-xl sm:text-2xl leading-normal`}
                >
                  <span className="prevent-clip">{t("title")}</span>
                </h3>
              </div>
              <div
                onClick={() => router.replace("/")}
                className="flex justify-center sm:justify-end text-right"
              >
                <Logo theme="dark" slogan={true} />
              </div>
            </div>

            <form className="w-full" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col mb-4 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="nombre"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                  >
                    {t("form.firstNameLabel")}*
                  </label>
                  <TextInput
                    id="nombre"
                    name="nombre"
                    ariaLabel={t("form.firstNameLabel")}
                    placeholder={t("form.firstNamePlaceholder")}
                    value={formData.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    className={`w-full ${inputBgClass}`}
                    disabled={isSignedIn && !!user?.firstName}
                  />
                  {error.nombre?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="apellido"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                  >
                    {t("form.lastNameLabel")}*
                  </label>
                  <TextInput
                    id="apellido"
                    name="apellido"
                    ariaLabel={t("form.lastNameLabel")}
                    placeholder={t("form.lastNamePlaceholder")}
                    value={formData.apellido}
                    onChange={(e) =>
                      handleInputChange("apellido", e.target.value)
                    }
                    className={`w-full ${inputBgClass}`}
                    disabled={isSignedIn && !!user?.lastName}
                  />
                  {error.apellido?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                >
                  {t("form.emailLabel")}*
                </label>
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  ariaLabel={t("form.emailLabel")}
                  placeholder={t("form.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full ${inputBgClass}`}
                  disabled={
                    isSignedIn && !!user?.primaryEmailAddress?.emailAddress
                  }
                />
                {error.email?.map((err, index) => (
                  <p
                    key={index}
                    className="text-red-500 text-xs sm:text-sm mt-1"
                  >
                    {err}
                  </p>
                ))}
              </div>

              <div className="flex flex-col mb-4 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                  >
                    {t("form.phoneLabel")}*
                  </label>
                  <PhoneInput
                    id="telefono"
                    value={formData.telefono}
                    onChange={(value) => handleInputChange("telefono", value)}
                    defaultCountry="VE"
                  />
                  {error.telefono?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="documento"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                  >
                    {t("form.documentLabel")}*
                  </label>
                  <TextInput
                    id="documento"
                    name="documento"
                    ariaLabel={t("form.documentLabel")}
                    placeholder={t("form.documentPlaceholder")}
                    value={formData.documento}
                    onChange={(e) =>
                      handleInputChange("documento", e.target.value)
                    }
                    className="bg-white w-full"
                  />
                  {error.documento?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="nacimiento"
                  className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                >
                  {t("form.birthDateLabel")}*
                </label>
                <TextInput
                  id="nacimiento"
                  type="date"
                  name="nacimiento"
                  ariaLabel={t("form.birthDateLabel")}
                  value={formData.nacimiento}
                  onChange={(e) =>
                    handleInputChange("nacimiento", e.target.value)
                  }
                  className="bg-white w-full"
                />
                {error.nacimiento?.map((err, index) => (
                  <p
                    key={index}
                    className="text-red-500 text-xs sm:text-sm mt-1"
                  >
                    {err}
                  </p>
                ))}
              </div>

              <div className="flex flex-col mb-4 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
                    {t("form.gender.label")}*
                  </label>
                  <div className="p-2 rounded-md flex flex-wrap items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="genero"
                        value="male"
                        checked={formData.genero === "male"}
                        onChange={() => handleInputChange("genero", "male")}
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <span className="ml-2">{t("form.gender.male")}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="genero"
                        value="female"
                        checked={formData.genero === "female"}
                        onChange={() => handleInputChange("genero", "female")}
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <span className="ml-2">{t("form.gender.female")}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="genero"
                        value="prefer-not-to-say"
                        checked={formData.genero === "prefer-not-to-say"}
                        onChange={() =>
                          handleInputChange("genero", "prefer-not-to-say")
                        }
                        className="form-radio h-4 w-4 text-primary"
                      />
                      <span className="ml-2">
                        {t("form.gender.preferNotToSay")}
                      </span>
                    </label>
                  </div>
                  {error.genero?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex flex-col mb-4 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                  >
                    {t("form.passwordLabel")}*
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    ariaLabel={t("form.passwordLabel")}
                    placeholder={t("form.passwordPlaceholder")}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full ${inputBgClass}`}
                    disabled={isSignedIn}
                  />
                  {error.password?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="cpassword"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left"
                  >
                    {t("form.confirmPasswordLabel")}*
                  </label>
                  <PasswordInput
                    id="cpassword"
                    name="cpassword"
                    ariaLabel={t("form.confirmPasswordLabel")}
                    placeholder={t("form.confirmPasswordPlaceholder")}
                    value={formData.cpassword}
                    onChange={(e) =>
                      handleInputChange("cpassword", e.target.value)
                    }
                    className={`w-full ${inputBgClass}`}
                    disabled={isSignedIn}
                  />
                  {error.cpassword?.map((err, index) => (
                    <p
                      key={index}
                      className="text-red-500 text-xs sm:text-sm mt-1"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-start mb-6 space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <Checkbox
                    labelText=""
                    checked={terms}
                    onCheckedChange={(checked) => setTerms(!!checked)}
                  />
                </div>
                <div className="flex-1">
                  <a
                    href="#"
                    style={{ color: colors.primary }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm hover:underline"
                  >
                    {t("form.termsText")}
                  </a>
                  {error.terms?.map((msg, i) => (
                    <p key={i} className="text-red-500 text-xs sm:text-sm mt-1">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6 w-full">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 text-base sm:py-2 ${isSubmitting ? "opacity-50 cursor-wait" : ""}`}
                >
                  {isSubmitting
                    ? t("notifications.loading.submitting")
                    : t("form.submitButton")}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t("footer.loginPrompt")}{" "}
              </span>
              <button
                onClick={handleCleanLogin}
                className="font-semibold hover:underline focus:outline-none transition-colors"
                style={{ color: colors.primary }}
              >
                {t("footer.loginLink")}
              </button>
            </div>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}
