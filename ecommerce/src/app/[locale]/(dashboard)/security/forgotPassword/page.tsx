"use client";

import React, { useEffect, useRef, useState } from "react";
import { Notification } from "@/components/ui/Notification";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/ui/PasswordInput";
import { Input } from "@/components/ui/Input";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";

import { useTranslations } from "next-intl";

export default function ForgotPassword() {
  const t = useTranslations("ForgotPasswordPage");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showAlertConfirmation, setShowAlertConfirmation] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [incorrectCode, setIncorrectCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const isValidChar = (char: string) => /^[a-zA-Z0-9]$/.test(char);

  const handleInputChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    if (!isValidChar(char) && char !== "") {
      return;
    }

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    if (incorrectCode) {
      setIncorrectCode(false);
      setErrorMessage(null);
    }

    if (index < code.length - 1 && char !== "") {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      const newCode = [...code];
      if (newCode[index] !== "") {
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        newCode[index - 1] = "";
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const chars = pastedData.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
    if (chars.length > 0) {
      const newCode = [...code];
      chars.split("").forEach((char, index) => {
        newCode[index] = char.toUpperCase();
      });
      setCode(newCode);
      inputRefs.current[Math.min(chars.length, 5)]?.focus();
    }
  };

  const isCodeComplete = code.every((c) => c !== "");

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("").trim();
    if (verificationCode.length !== 6) {
      setIncorrectCode(true);
      setErrorMessage(t("errors.incompleteCode"));
      return;
    }

    setLoading(true);
    try {
      //   await api.auth.validateResetToken(verificationCode);
      //   setToken(verificationCode);
      setStep("reset");
      setIncorrectCode(false);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error al validar token:", error);
      setIncorrectCode(true);
      setErrorMessage(t("errors.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    const email = localStorage.getItem("email");
    try {
      await api.auth.forgotPassword(String(email));
      setShowAlertConfirmation(true);
    } catch (error) {
      console.error("Error al reenviar código:", error);
      setShowConnectionError(true);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMessage(t("errors.required"));
      setIncorrectCode(true);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t("errors.mismatch"));
      setIncorrectCode(true);
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, password, confirmPassword);
      setShowAlert(true);
      setTimeout(() => router.replace("/login"), 1200);
    } catch (error) {
      console.error("Error al resetear contraseña:", error);
      setShowConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="p-4 md:p-16 pt-6">
        <div className="flex items-center justify-center min-h-[60vh] px-2 py-4">
          <div className="w-full">
            {showAlert && (
              <Notification
                variant="success"
                title={
                  step === "reset"
                    ? t("success.passwordUpdated")
                    : t("success.codeValid")
                }
                description={
                  step === "reset"
                    ? t("success.passwordDescription")
                    : t("success.codeDescription")
                }
                onClose={() => setShowAlert(false)}
              />
            )}

            {showAlertConfirmation && (
              <Notification
                variant="success"
                title={t("success.resentTitle")}
                description={t("success.resentDescription")}
                onClose={() => setShowAlertConfirmation(false)}
              />
            )}

            {showConnectionError && (
              <Notification
                variant="destructive"
                title={t("errors.connectionTitle")}
                description={t("errors.connectionDescription")}
                onClose={() => setShowConnectionError(false)}
              />
            )}

            <p className="text-2xl font-semibold mb-6 text-center">
              {t("title")}
            </p>

            {step === "verify" ? (
              <>
                <p className="w-full text-center">{t("description")}</p>
                <p className="text-center my-6">
                  {t("emailSent", { email: user?.email || "..." })}
                </p>

                <form
                  className="w-full text-center"
                  onSubmit={handleVerifySubmit}
                  noValidate
                >
                  <div className="flex justify-between gap-2 mb-6 max-w-md text-center mx-auto">
                    {code.map((char, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={char}
                        autoComplete="one-time-code"
                        onChange={(e) =>
                          handleInputChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-10 h-10 text-center border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg font-semibold uppercase"
                        placeholder="-"
                      />
                    ))}
                  </div>

                  {incorrectCode && (
                    <div className="text-center font-medium my-3">
                      <span className="text-red-500">
                        {errorMessage ?? t("errors.invalidCode")}
                      </span>
                    </div>
                  )}

                  <Button
                    className="w-full max-w-md text-center mx-auto"
                    type="submit"
                    disabled={!isCodeComplete || loading}
                  >
                    {loading ? t("verifying") : t("verifyButton")}
                  </Button>

                  <div className="mt-4 w-full max-w-md mx-auto text-right">
                    <button
                      type="button"
                      onClick={resendCode}
                      className="text-green-500 hover:underline font-bold"
                    >
                      {t("resendCode")}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="text-center mb-4">{t("resetSubtitle")}</p>
                <form
                  className="w-full max-w-md mx-auto space-y-4"
                  onSubmit={handleResetSubmit}
                  noValidate
                >
                  <div className="max-w-md mx-auto text-left">
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t("newPasswordLabel")}
                    </label>
                    <div className="flex justify-center">
                      <PasswordInput
                        id="new-password"
                        placeholder={t("newPasswordPlaceholder")}
                        ariaLabel={t("newPasswordPlaceholder")}
                        className="w-full max-w-md py-2"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="max-w-md mx-auto text-left">
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {t("confirmPasswordLabel")}
                    </label>
                    <div className="flex justify-center">
                      <PasswordInput
                        id="confirm-password"
                        placeholder={t("confirmPasswordPlaceholder")}
                        ariaLabel={t("confirmPasswordPlaceholder")}
                        className="w-full max-w-md py-2"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {incorrectCode && (
                    <div className="text-center font-medium my-2">
                      <span className="text-red-500">{errorMessage}</span>
                    </div>
                  )}

                  <div className="max-w-md mx-auto">
                    <Button className="w-full" type="submit" disabled={loading}>
                      {loading ? t("submitting") : t("submitButton")}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
