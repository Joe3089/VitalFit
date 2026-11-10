"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { typography } from "@/styles/styles";
import { Notification } from "@/components/ui/Notification";
import { createRecoverSchema } from "@/lib/validation/recoverSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/sdk-config";

export default function ForgotPassword() {
  const t = useTranslations("ForgotPasswordPage");
  const [formData, setFormData] = useState({ usuario: "" });
  const [error, setError] = useState<{ usuario?: string[] }>({});
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const recoverSchema = createRecoverSchema(t);
    const result = recoverSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      const flattened = result.error.flatten();

      if (flattened.fieldErrors.usuario) {
        fieldErrors.usuario = flattened.fieldErrors.usuario;
      }

      setError(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await api.auth.forgotPassword(formData.usuario);
    } catch {
    } finally {
      localStorage.setItem("email", formData.usuario);
      setShowAlert(true);
      setError({});
      setFormData({ usuario: "" });
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ usuario: e.target.value });
    if (error.usuario) {
      setError({});
    }
  };

  const handleSuccessClose = () => {
    setShowAlert(false);
    router.replace("/confirmEmail?flow=recover");
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-5 py-4">
      {showAlert && (
        <Notification
          variant="success"
          title={t("notificationTitle")}
          description={t("notificationDescription")}
          onClose={handleSuccessClose}
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
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  {t("instruction")}
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <form className="w-full space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="usuario"
                      className="text-sm font-medium leading-none"
                    >
                      {t("emailLabel")}
                    </label>
                    <Input
                      id="usuario"
                      name="usuario"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={formData.usuario}
                      onChange={handleInputChange}
                      className="bg-background"
                      disabled={isLoading}
                    />
                    {error.usuario?.map((msg, i) => (
                      <p key={i} className="text-destructive text-sm mt-1">
                        {msg}
                      </p>
                    ))}
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
    </div>
  );
}