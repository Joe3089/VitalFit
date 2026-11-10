"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { typography } from "@/styles/styles";
import { Notification } from "@/components/ui/Notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/sdk-config";
import { createConfirmEmailSchema } from "@/lib/validation/confirmEmailSchema";

function ConfirmEmailContent() {
  const t = useTranslations("ConfirmEmailPage");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [showAlertConfirmation, setShowAlertConfirmation] = useState(false);
  const [incorrectCode, setIncorrectCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow");
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const verificationCode = code.join("").trim();
    const confirmEmailSchema = createConfirmEmailSchema(t);
    const result = confirmEmailSchema.safeParse({ code: verificationCode });

    if (!result.success) {
      setIncorrectCode(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.validateResetToken(verificationCode);
      console.warn(response);
      localStorage.setItem("code", verificationCode);
      setIncorrectCode(false);
      setShowAlert(true);
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      // Solo marcamos incorrecto, sin mostrar mensaje de conexión
      setIncorrectCode(true);
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.every((char) => char !== "");

  const resendCode = async () => {
    const email = localStorage.getItem("email");
    try {
      const response = await api.auth.forgotPassword(String(email));
      console.warn(response);
      setShowAlertConfirmation(true);
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      // No mostramos mensaje de conexión
      setIncorrectCode(true);
    }
  };

  const handleSuccessClose = () => {
    setShowAlert(false);
    router.replace(flow === "recover" ? "/changePassword" : "/dashboard");
  };

  const handleConfirmationClose = () => {
    setShowAlertConfirmation(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-5 py-4">
      {showAlert && (
        <Notification
          variant="success"
          title={flow === "recover" ? t("successTitleValid") : t("successTitleRegister")}
          description={
            flow === "recover"
              ? t("successDescValid")
              : t("successDescRegister")
          }
          onClose={handleSuccessClose}
        />
      )}

      {showAlertConfirmation && (
        <Notification
          variant="success"
          title={t("resendSuccessTitle")}
          description={t("resendSuccessDesc")}
          onClose={handleConfirmationClose}
        />
      )}

      <div className="flex justify-center w-full">
        <div className="max-w-sm w-full">
          <Card className="w-full">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src="/images/isotipo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <h2 className={typography.h3}>{t("title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("instruction")}
              </p>
            </CardHeader>

            <CardContent>
              <form className="w-full space-y-6" onSubmit={handleSubmit} noValidate>
                <div className="flex justify-between gap-2">
                  {code.map((char, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={char}
                      autoComplete="one-time-code"
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-10 h-12 text-center text-lg font-semibold uppercase border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#F27F2A]"
                      placeholder="-"
                      disabled={loading}
                    />
                  ))}
                </div>

                {incorrectCode && (
                  <div className="text-center">
                    <p className="text-destructive text-sm font-medium">
                      {t("errorTitle")}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isCodeComplete || loading}
                >
                  {loading ? t("submitButtonProcessing") : t("submitButtonDefault")}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button
                variant="link"
                onClick={resendCode}
                className="text-green-600 hover:text-green-700 font-medium"
                disabled={loading}
              >
                {t("resendButton")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmail() {
  const t = useTranslations("ConfirmEmailPage");

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>{t("loadingFallback")}</p>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
