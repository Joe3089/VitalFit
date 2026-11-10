"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginResponse } from "@vitalfit/sdk";
import {
  LoginFormData,
  LoginPayload,
  loginSchema,
} from "@/lib/validation/loginSchema";
import { Button } from "@/components/ui/button";
import { colors, montserrat } from "@/styles/styles";
import InputField from "@/components/ui/InputField";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/layout/localeSwitcher/LocaleSwitcher";

type Challenge = { id: string; hint?: string };

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const t = useTranslations("LoginPage");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const completeLogin = async (response: LoginResponse) => {
    const accessToken = response.token;
    const refreshToken = response.refresh_token;

    if (!accessToken || !refreshToken) {
      throw new Error("Faltan tokens en la respuesta del servidor");
    }

    await login(accessToken, refreshToken);

    // HU-ADMIN-07: an expired password must be changed before continuing.
    router.replace(response.password_expired ? "/settings/profile?tab=security&password_expired=1" : "/");
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    const payload: LoginPayload = {
      ...data,
      context: "dashboard",
    };

    try {
      const response = await api.auth.login(payload);

      // HU-ADMIN-03: administrative users must confirm a code sent by email.
      if (response.two_factor_required && response.challenge_id) {
        setChallenge({ id: response.challenge_id, hint: response.email_hint });
        setCode("");
        setResent(false);
        return;
      }

      await completeLogin(response);
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      if (err instanceof Error) {
        const status = (err as any).response?.status || (err as any).status;

        if (status === 401) {
          setErrorMessage(t("errorCredentials"));
        } else {
          setErrorMessage(t("errorUnexpected"));
        }
      } else {
        setErrorMessage(t("errorGeneric"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.auth.verifyTwoFactor({ challenge_id: challenge.id, code });
      await completeLogin(response);
    } catch {
      setErrorMessage(t("twoFactor.invalidCode"));
    } finally {
      setIsLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!challenge) {
      return;
    }
    setErrorMessage(null);
    try {
      await api.auth.resendTwoFactor(challenge.id);
      setResent(true);
    } catch {
      setChallenge(null);
      setErrorMessage(t("twoFactor.expired"));
    }
  };

  return (
    <div className={`relative bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-8 md:p-12 w-full max-w-md ${montserrat.className}`}>
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="flex flex-col items-center mb-10">
        <div className="bg-gray-50 p-2 rounded-full mb-6 ring-8 ring-gray-50/50">
          <Image
            src="/logo/isotipo.png"
            alt="VitalFit Logo"
            width={100}
            height={100}
            className="rounded-full"
            priority
          />
        </div>

        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          {challenge ? t("twoFactor.title") : t("title")}
        </h2>
        <p className="text-center text-gray-500 text-base max-w-[280px]">
          {challenge ? t("twoFactor.description", { email: challenge.hint ?? "" }) : t("subtitle")}
        </p>
      </div>

      {challenge ? (
        <form onSubmit={onVerifyCode} className="space-y-5">
          <InputField
            label={t("twoFactor.codeLabel")}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-lg tracking-[0.5em]"
            autoFocus
          />

          <Button
            type="submit"
            disabled={isLoading || code.length !== 6}
            variant="default"
            size="lg"
            className="py-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] w-full"
          >
            {t("twoFactor.verifyButton")}
          </Button>

          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => setChallenge(null)}
              className="text-gray-500 hover:underline"
            >
              {t("twoFactor.back")}
            </button>
            <button
              type="button"
              onClick={onResendCode}
              disabled={resent}
              style={{ color: colors.primary }}
              className="font-semibold hover:opacity-80 disabled:opacity-60"
            >
              {resent ? t("twoFactor.resent") : t("twoFactor.resend")}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <InputField
              label={t("emailLabel")}
              type="email"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
              error={errors.email?.message}
              className="hover:border-gray-300 transition-colors"
            />

            <div className="space-y-1">
              <InputField
                label={t("passwordLabel")}
                type="password"
                placeholder={t("passwordPlaceholder")}
                {...register("password")}
                error={errors.password?.message}
                className="hover:border-gray-100 transition-colors"
              />
              <div className="flex justify-end">
                <Link
                  href="/forgotPassword"
                  style={{ color: colors.primary }}
                  className="text-sm font-semibold hover:opacity-80 transition-opacity duration-200"
                >
                  {t("forgotPasswordLink")}
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="default"
            size="lg"
            className="py-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] w-full"
          >
            {t("accessButton")}
          </Button>
        </form>
      )}
      {errorMessage && (
        <div
          className="mt-6 p-4 text-center text-red-600 bg-red-50 border border-red-100 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
