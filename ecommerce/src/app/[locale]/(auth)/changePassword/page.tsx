"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import AuthFooter from "@/components/features/AuthFooter";
import { typography } from "@/styles/styles";
import AuthCard from "@/components/features/AuthCard";
import Logo from "@/components/features/Logo";
import PasswordInput from "@/components/ui/PasswordInput";
import { getPasswordSchema } from "@/lib/validation/passwordSchema";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";

export default function PasswordReset() {
  const router = useRouter();
  const t = useTranslations("security.forgotPassword");
  const tValidation = useTranslations("RegisterPage");
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    toast.dismiss();

    const passwordSchema = getPasswordSchema(tValidation);
    const result = passwordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === "password") {
          fieldErrors.password = err.message;
        }
        if (err.path[0] === "confirmPassword") {
          fieldErrors.confirmPassword = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const tokenCode = localStorage.getItem("code");

      if (!tokenCode) {
        toast.error(t("errors.tokenNotFound"), {
          description: t("errors.tokenDescription"),
        });
        return;
      }

      await api.auth.resetPassword(
        tokenCode,
        formData.password,
        formData.confirmPassword,
      );

      toast.success(t("success"));
      localStorage.removeItem("code");

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(t("errors.resetError"), {
        description: error.message || t("errors.default"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 sm:px-6 py-12 transition-all duration-500">
      <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AuthCard className="shadow-2xl shadow-black/5 border border-white/20">
          <div className="flex flex-col items-center w-full mb-8">
            <div className="p-3 bg-primary/5 rounded-2xl mb-4">
              <Logo slogan={false} width={70} />
            </div>
            <h2
              className={`${typography.h3} text-2xl font-bebas uppercase tracking-wider text-gray-900`}
            >
              {t("newPasswordTitle")}
            </h2>
            <p className="text-center text-muted-foreground mt-2 text-sm leading-relaxed max-w-[320px]">
              {t("subtitle")}
            </p>
          </div>

          <form className="w-full space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5 group">
              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 transition-colors group-focus-within:text-primary"
              >
                {t("newPasswordLabel")}
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder={t("placeholders.newPassword")}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-xl"
              />
              {errors.password && (
                <p className="text-destructive text-xs font-semibold ml-1 animate-in fade-in slide-in-from-top-1">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5 group">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 transition-colors group-focus-within:text-primary"
              >
                {t("confirmPasswordLabel")}
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder={t("placeholders.confirmPassword")}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-xl"
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-xs font-semibold ml-1 animate-in fade-in slide-in-from-top-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{tValidation("notifications.loading.submitting")}</span>
                </div>
              ) : (
                t("resetButton")
              )}
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-100 w-full">
            <AuthFooter
              text={t("footer.text")}
              linkText={t("footer.linkText")}
              href="/login"
              replace={true}
              className="justify-center"
            />
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
