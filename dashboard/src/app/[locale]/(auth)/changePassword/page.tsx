"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { typography } from "@/styles/styles";
import { createPasswordSchema } from "@/lib/validation/passwordSchema";
import { Notification } from "@/components/ui/Notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/sdk-config";
import InputField from "@/components/ui/InputField";

export default function ChangePassword() {
  const t = useTranslations("ChangePasswordPage");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [showServerError, setShowServerError] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowServerError({ visible: false, message: "" });

    const passwordSchema = createPasswordSchema(t);
    const result = passwordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: typeof errors = {};

      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        if (field in formData) {
          fieldErrors[field] = err.message;
        }
      });

      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const tokenCode = localStorage.getItem("code");

      if (!tokenCode) {
        setShowServerError({
          visible: true,
          message: t("tokenError"),
        });
        setIsLoading(false);
        return;
      }
      await api.auth.resetPassword(tokenCode, formData.password, formData.confirmPassword);

      setErrors({});
      setFormData({ password: "", confirmPassword: "" });
      setShowAlert(true);

    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);

      if (error.name === "NetworkError" || error.message?.includes("network") || error.message?.includes("conectar")) {
        setShowConnectionError(true);
      } else {
        setShowServerError({
          visible: true,
          message: error.message || t("genericError"),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowAlert(false);
    localStorage.removeItem("code");
    localStorage.removeItem("email");
    router.replace("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5 py-4">
      {showAlert && (
        <Notification
          variant="success"
          description={t("successDescription")}
          onClose={handleSuccessClose}
        />
      )}

      {showConnectionError && (
        <Notification
          variant="destructive"
          title={t("connectionErrorTitle")}
          description={t("connectionErrorDescription")}
          onClose={() => setShowConnectionError(false)}
        />
      )}

      {showServerError.visible && (
        <Notification
          variant="destructive"
          title={t("serverErrorTitle")}
          description={showServerError.message}
          onClose={() => setShowServerError({ visible: false, message: "" })}
        />
      )}

      <div className="w-full max-w-sm">
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
            <div className="text-left">
              <span className="text-sm text-muted-foreground">
                {t("instruction")}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <form className="w-full space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {/* Campo Nueva Contraseña */}
                <div className="space-y-2">


                  <InputField
                    label={t("newPasswordLabel")}
                    type="password"
                    placeholder={t("newPasswordPlaceholder")}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    className="bg-background"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Campo Confirmar Contraseña */}
                <div className="space-y-2">
                  <InputField
                    label={t("confirmPasswordLabel")}
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    className="bg-background"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t("submitButtonProcessing") : t("submitButtonDefault")}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {t("footerText")}{" "}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => router.replace("/login")}
              >
                {t("footerLink")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}