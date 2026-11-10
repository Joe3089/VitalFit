"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { typography } from "@/styles/styles";
import Image from "next/image";
import { Card, CardHeader, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/sdk-config";
import { getActivateSchema } from "@/lib/validation/authSchema";
import LocaleSwitcher from "@/components/layout/localeSwitcher/LocaleSwitcher";

export default function ActivateInstructor() {
  const router = useRouter();
  const { token } = useParams();
  const t = useTranslations("auth.activate");

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const schema = getActivateSchema(t);
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    if (!token || typeof token !== "string") {
      toast.error(t("errors.invalid_token"));
      setIsLoading(false);
      return;
    }

    try {
      await api.auth.verifyStaff(token, formData.password, formData.confirmPassword);
      toast.success(t("success_message"));
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err: any) {
      if (err?.message?.includes("containsany")) {
        toast.error(t("errors.password_requirements"));
      } else {
        toast.error(err?.message || t("errors.server_error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 px-4 py-8 relative">

    <div className="absolute top-6 right-6">
      <LocaleSwitcher />
    </div>

    <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
      <Card className="border-none shadow-2xl bg-white rounded-[20px] overflow-hidden">
        <CardHeader className="flex flex-col items-center pt-12 pb-6 px-10">
          

          <div className="mb-6 flex justify-center w-full">
            <Image
              src="/logo/logovitalfit.png"
              alt="VitalFit Logo"
              width={180} 
              height={180}
              className="object-contain" 
              priority
            />
          </div>
          
          <div className="space-y-1 text-center">
            <h2 className="text-[30px] font-black leading-tight text-[#333333] tracking-tight uppercase">
              {t("title")}
            </h2>
          </div>

          <p className="text-[15px] text-zinc-600 text-center mt-6 font-medium leading-snug">
            {t("description")}
          </p>
        </CardHeader>

        <CardContent className="px-10 pb-12 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid gap-5">
              <InputField
                label={t("password_label")}
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                className="h-12 border-slate-300 rounded-lg"
              />

              <InputField
                label={t("confirm_password_label")}
                type="password"
                placeholder="********"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                className="h-12 border-slate-300 rounded-lg"
              />
            </div>

            <Button 
              className="w-full h-[52px] text-lg font-semibold transition-all mt-6 bg-[#f28733] hover:bg-[#e6761d] text-white rounded-xl shadow-md active:scale-[0.98]" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("button_loading")}
                </div>
              ) : (
                t("button_confirm")
              )}
            </Button>

            
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-xs text-slate-400 font-medium tracking-widest uppercase opacity-70">
        &copy; {new Date().getFullYear()} VitalFit • {t("footer_text") || "Dashboard System"}
      </p>
    </div>
  </div>
);
}