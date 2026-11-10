"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { typography } from "@/styles/styles";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/sdk-config";
import { getActivateSchema } from "@/lib/validation/authSchema";

export default function ActivateInstructor() {
  const router = useRouter();
  const { token } = useParams();
  const t = useTranslations("auth.activate"); 

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ password: "" });
  const [errors, setErrors] = useState<{ password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const schema = getActivateSchema(t);
    const validation = schema.safeParse(formData);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setErrors({ password: firstError.message });
      toast.error(t("errors.check_password"));
      setIsLoading(false);
      return;
    }

    // 2. Validar Token
    if (!token || typeof token !== "string") {
      toast.error(t("errors.invalid_token"));
      setIsLoading(false);
      return;
    }

    try {

      await api.auth.verifyStaff(token, formData.password, formData.password);

      toast.success(t("success_message"));
      
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);

      if (err?.message?.includes("containsany") || err?.error?.includes("containsany")) {
        toast.error(t("errors.password_requirements"));
      } else {
        toast.error(err?.message || t("errors.server_error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-8">
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="pt-8 pb-4 flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white rounded-full p-1 shadow-inner">
              <Image
                src="/logo/logovitalfit.png"
                alt="VitalFit Logo"
                width={120}
                height={120}
                className="rounded-full object-cover"
                priority
              />
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h2 className={`${typography.h3} text-slate-900 tracking-tight font-bold uppercase`}>
              {t("title")}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {t("description")}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="relative">
                <InputField
                  label={t("password_label")}
                  type="password"
                  placeholder={t("password_placeholder")}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                  className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <Button 
              className="w-full h-11 text-base font-semibold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("button_loading")}
                </div>
              ) : (
                t("button_confirm")
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} VitalFit. All rights reserved.
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
}