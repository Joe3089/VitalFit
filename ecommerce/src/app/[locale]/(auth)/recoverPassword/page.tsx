"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import AuthFooter from "@/components/features/AuthFooter";
import { typography } from "@/styles/styles";
import AuthCard from "@/components/features/AuthCard";
import Logo from "@/components/features/Logo";
import TextInput from "@/components/ui/TextInput";
import { getRecoverSchema } from "@/lib/validation/recoverSchema";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/sdk-config";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";

export default function RecoverPassword() {
  const t = useTranslations("security.RecoverPassword");
  const [formData, setFormData] = useState({ usuario: "" });
  const [error, setError] = useState<{ usuario?: string[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss();

    const recoverSchema = getRecoverSchema(t);
    const result = recoverSchema.safeParse(formData);

    if (!result.success) {
      setError(result.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    const finalize = () => {
      toast.success(t("successNotification.title"), {
        description: t("successNotification.description"),
      });
      setTimeout(() => {
        router.replace("/confirmEmail?flow=recover");
      }, 2000);
    };

    try {
      await api.auth.forgotPassword(formData.usuario);
      localStorage.setItem("email", formData.usuario);
      setError({});
      setFormData({ usuario: "" });
      finalize();
    } catch (error) {
      finalize();
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
              {t("title")}
            </h2>
            <p className="text-center text-muted-foreground mt-2 text-sm leading-relaxed max-w-[300px]">
              {t("subtitle")}
            </p>
          </div>

          <form className="w-full space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2 group">
              <label
                htmlFor="usuario"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 transition-colors group-focus-within:text-primary"
              >
                {t("form.emailLabel")}
              </label>
              <TextInput
                id="usuario"
                name="usuario"
                ariaLabel="usuario"
                placeholder={t("form.emailPlaceholder")}
                value={formData.usuario}
                onChange={(e) => {
                  setFormData({ ...formData, usuario: e.target.value });
                  if (error.usuario) {
                    setError({});
                  }
                }}
                className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-xl"
              />
              {error.usuario?.map((msg, i) => (
                <p
                  key={i}
                  className="text-destructive text-xs font-semibold ml-1 animate-in fade-in slide-in-from-top-1"
                >
                  {msg}
                </p>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>{t("form.processing")}</span>
                </div>
              ) : (
                t("form.submitButton")
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
