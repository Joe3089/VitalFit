"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { getRegisterSchema } from "@/lib/validation/registerSchema";

export default function ChangePasswordPage() {
  const { token } = useAuth();
  const router = useRouter();
  const t = useTranslations("security.changePassword");
  const tValidation = useTranslations("RegisterPage");

  // Estado del formulario siguiendo la estructura de tu página de registro
  const [formData, setFormData] = useState({
    currentPassword: "",
    password: "", // Nueva contraseña
    cpassword: "", // Confirmación (cpassword en tu esquema)
  });

  // Estado para errores idéntico al de tu Registro
  const [error, setError] = useState<Partial<Record<string, string[]>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpia el error mientras el usuario escribe, igual que en el Registro
    if (error[field]) {
      setError((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.dismiss();

    // Validamos usando solo los campos de contraseña del registerSchema
    const registerSchema = getRegisterSchema(tValidation);
    const passwordValidation = registerSchema
      .pick({
        password: true,
        cpassword: true,
      })
      .safeParse({
        password: formData.password,
        cpassword: formData.cpassword,
      });

    const fieldErrors: Partial<Record<string, string[]>> = {};

    // Lógica de validación visual idéntica al registro
    if (!passwordValidation.success) {
      const flattened = passwordValidation.error.flatten();
      Object.entries(flattened.fieldErrors).forEach(([key, value]) => {
        if (value) {
          fieldErrors[key] = value;
        }
      });
    }

    // Validación manual para la contraseña actual
    if (!formData.currentPassword) {
      fieldErrors.currentPassword = [t("validation.currentPasswordRequired")];
    }

    if (Object.keys(fieldErrors).length > 0) {
      setError(fieldErrors);
      toast.error(tValidation("notifications.error.incompleteForm"));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.user.UpgradePassword(
        token,
        formData.currentPassword,
        formData.password,
        formData.cpassword,
      );

      toast.success(t("success"));
      router.replace("/profile");
    } catch (err: any) {
      const errorMsg = err.message?.toLowerCase() || "";

      if (errorMsg.includes("unauthorized") || err.status === 401) {
        toast.error(t("validation.currentPasswordIncorrect"));
        setError((prev) => ({
          ...prev,
          currentPassword: [t("validation.currentPasswordIncorrect")],
        }));
      } else if (
        errorMsg.includes("confirmpassword") ||
        errorMsg.includes("eqfield")
      ) {
        toast.error(t("validation.mismatch"));
        setError((prev) => ({
          ...prev,
          cpassword: [t("validation.mismatch")],
        }));
      } else {
        toast.error(err.message || t("error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="p-4 md:p-16 pt-6">
        <div className="max-w-xl mx-auto mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("ptitle")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{t("pdescription")}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto p-6 md:p-8 space-y-6"
          noValidate
        >
          <div className="space-y-2 text-left">
            <label className="block text-sm font-medium text-gray-700">
              {t("currentPasswordLabel")}
            </label>
            <PasswordInput
              value={formData.currentPassword}
              onChange={(e) =>
                handleInputChange("currentPassword", e.target.value)
              }
              placeholder={t("currentPasswordPlaceholder")}
              className={`py-2 ${error.currentPassword ? "border-red-500" : ""}`}
            />
            {error.currentPassword?.[0] && (
              <p className="text-red-500 text-xs mt-1">
                {error.currentPassword[0]}
              </p>
            )}
          </div>

          <div className="space-y-2 text-left">
            <label className="block text-sm font-medium text-gray-700">
              {t("newPasswordLabel")}
            </label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={t("newPasswordPlaceholder")}
              className={`py-2 ${error.password ? "border-red-500" : ""}`}
            />
            {error.password?.[0] && (
              <p className="text-red-500 text-xs mt-1">{error.password[0]}</p>
            )}
          </div>

          <div className="space-y-2 text-left">
            <label className="block text-sm font-medium text-gray-700">
              {t("confirmPasswordLabel")}
            </label>
            <PasswordInput
              value={formData.cpassword}
              onChange={(e) => handleInputChange("cpassword", e.target.value)}
              placeholder={t("confirmPasswordPlaceholder")}
              className={`py-2 ${error.cpassword ? "border-red-500" : ""}`}
            />
            {error.cpassword?.[0] && (
              <p className="text-red-500 text-xs mt-1">{error.cpassword[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="default"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? tValidation("notifications.loading.submitting")
              : t("saveNewPasswordButton")}
          </Button>
        </form>
      </div>
    </main>
  );
}
