"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { typography } from "@/styles/styles";
import AuthCard from "@/components/features/AuthCard";
import Logo from "@/components/features/Logo";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function ConfirmEmailContent() {
  const t = useTranslations("ConfirmEmail");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow");
  const router = useRouter();

  const { login } = useAuth();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const resendCode = useCallback(async () => {
    // Busca email en sessionStorage (registro/activar) o localStorage (recuperar)
    const email =
      flow === "recover"
        ? localStorage.getItem("email")
        : sessionStorage.getItem("temp_email");

    if (!email) {
      toast.error(t("errors.noEmail"));
      return;
    }

    try {
      if (flow === "recover") {
        await api.auth.forgotPassword(email);
      } else {
        await api.user.resendActivateOtp(email);
      }
      toast.success(t("notifications.resendSuccess"));
    } catch (error) {
      console.error("Error al reenviar código:", error);
      toast.error(t("notifications.resendError"));
    }
  }, [t, flow]);

  // CORRECCIÓN: Se elimina la ejecución automática de resendCode() para el flujo activate.
  // Solo se envía manualmente si el usuario presiona "Reenviar Código".
  useEffect(() => {
    if (flow === "activate") {
      // resendCode(); <--- LÍNEA ELIMINADA PARA EVITAR DUPLICADOS
    }
  }, [flow, resendCode]);

  const isValidChar = (char: string) => /^[a-zA-Z0-9]$/.test(char);

  const handleInputChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    if (!isValidChar(char) && char !== "") {
      return;
    }

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    if (char !== "" && index < code.length - 1) {
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
    toast.dismiss();

    const verificationCode = code.join("").trim();
    if (verificationCode.length !== 6) {
      toast.error(t("errors.incompleteCode"));
      return;
    }

    setLoading(true);

    try {
      if (flow === "register" || flow === "activate") {
        await api.auth.verifyEmail(verificationCode);
      } else {
        await api.auth.validateResetToken(verificationCode);
      }

      localStorage.setItem("code", verificationCode);

      if (flow === "register") {
        const tempEmail = sessionStorage.getItem("temp_email");
        const tempPassword = sessionStorage.getItem("temp_password");

        if (tempEmail && tempPassword) {
          try {
            const loginResponse = await api.auth.login({
              email: tempEmail,
              password: tempPassword,
            });

            if (loginResponse.token) {
              toast.success(t("success.register"));
              await login(
                loginResponse.token,
                loginResponse.refresh_token || "",
              );
              sessionStorage.removeItem("temp_email");
              sessionStorage.removeItem("temp_password");
              router.replace("/dashboard");
              return;
            }
          } catch (error) {
            console.error("Falló el auto-login:", error);
          }
        }
      }

      const mensajeExito =
        flow === "recover" ? t("success.recover") : t("success.register");
      toast.success(mensajeExito);

      setTimeout(() => {
        if (flow === "recover") {
          router.replace("/changePassword");
        } else if (flow === "activate") {
          router.replace("/login");
        } else {
          router.replace("/dashboard");
        }
      }, 2000);
    } catch (error) {
      console.error("Error validación:", error);
      toast.error(t("errors.invalidCode"));
      setLoading(false);
    }
  };

  const isCodeComplete = code.every((char) => char !== "");

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <AuthCard>
          <div className="flex flex-col items-center space-y-4 mb-8">
            <Logo slogan={false} width={70} />
            <div className="space-y-2 text-center">
              <h2 className={`${typography.h3} uppercase tracking-tight`}>
                {t("title")}
              </h2>
              <p className="text-sm text-muted-foreground px-4">
                {t("description")}
              </p>
            </div>
          </div>

          <form className="w-full space-y-8" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-full px-1">
              {code.map((char, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-full aspect-square text-center text-xl font-bold border-2 rounded-lg transition-all duration-200 uppercase focus:outline-none focus:ring-4 ${char ? "border-primary bg-primary/5 ring-primary/10" : "border-gray-200 bg-gray-50/50 focus:border-primary focus:ring-primary/10"}`}
                  placeholder="•"
                />
              ))}
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold uppercase"
                disabled={!isCodeComplete || loading}
              >
                {loading ? t("verifying") : t("verifyButton")}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  className="text-primary font-bold hover:underline text-sm"
                >
                  {t("resendCode")}
                </button>
              </div>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";

export default function ConfirmEmail() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
