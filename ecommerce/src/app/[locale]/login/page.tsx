"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import AuthFooter from "@/components/features/AuthFooter";
import AuthCard from "@/components/features/AuthCard";
import Logo from "@/components/features/Logo";
import GoogleLoginButton from "@/components/ui/GoogleLoginButton";
import PasswordInput from "@/components/ui/PasswordInput";
import TextInput from "@/components/ui/TextInput";
import { getLoginSchema } from "@/lib/validation/loginSchema";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "sonner";
import { useSignIn, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const t = useTranslations("LoginPage");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});

  const [isValidating, setIsValidating] = useState(false);

  const { signIn, isLoaded } = useSignIn();
  const { getToken, isSignedIn, signOut } = useClerkAuth();

  const handleGoogleLogin = async () => {
    if (!isLoaded) {
      return;
    }
    try {
      await signOut();
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `/${locale}/sso-callback`,
        redirectUrlComplete: `/${locale}/login?check_google=true`,
      });
    } catch (err) {
      console.error("Error Google:", err);
      toast.error(t("errors.connectionError"));
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (isSignedIn) {
        const isGoogleRedirect = searchParams.get("check_google") === "true";
        if (!isGoogleRedirect) {
          await signOut();
          return;
        }

        setIsValidating(true);
        try {
          const clerkToken = await getToken({ template: "vitalfit-backend" });
          if (!clerkToken) {
            setIsValidating(false);
            return;
          }

          const response = await api.auth.oAuthLogin({
            session_token: clerkToken,
          });

          if (response && response.token) {
            await login(response.token, response.refresh_token || "");
            toast.success(t("messages.success"));
            router.replace("/dashboard");
          }
        } catch (error: any) {
          handleAuthError(error);
        } finally {
          setIsValidating(false);
        }
      }
    };

    checkSession();
  }, [isSignedIn, getToken, login, router, t, signOut, searchParams]);

  const handleAuthError = (error: any) => {
    let errorMsg =
      typeof error === "string"
        ? error
        : error.message || JSON.stringify(error);
    errorMsg = errorMsg.toLowerCase();

    if (
      errorMsg.includes("not found") ||
      errorMsg.includes("404") ||
      errorMsg.includes("no registrado")
    ) {
      toast.info(t("noAccount.text"), { description: t("noAccount.link") });
      router.replace("/register");
    } else {
      console.error("Auth Error:", error);
      toast.error(t("errors.incorrectCredentials"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.dismiss();

    const loginSchema = getLoginSchema(t);
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.auth.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.token) {
        await login(response.token, response.refresh_token || "");
        toast.success(t("messages.success"));
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(t("errors.incorrectCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center lg:justify-end px-4 sm:px-6 lg:px-20 py-10 transition-all duration-500"
      style={{
        backgroundImage: `url("/images/login-bg.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/20 lg:bg-transparent lg:bg-gradient-to-l lg:from-black/40 lg:to-transparent pointer-events-none" />

      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg transition-all duration-300 ease-in-out">
        <AuthCard>
          <div
            onClick={() => router.replace("/")}
            className="flex flex-col items-center space-y-4 mb-8"
          >
            <Logo slogan={false} width={60} />
            <div className="space-y-1 text-center">
              <h3 className="text-3xl font-bebas leading-none tracking-wide text-gray-900 uppercase">
                <span className="prevent-clip">{t("title")}</span>
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                {t("credentialsPrompt")}
              </p>
            </div>
          </div>

          {isValidating ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
              <p className="font-medium animate-pulse">
                {t("submitButton.loading")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                onClick={handleGoogleLogin}
                className="w-full transform transition-transform active:scale-[0.98]"
              >
                <GoogleLoginButton text={t("googleLogin")} />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-bold tracking-widest italic">
                    O
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-bold text-gray-700 ml-1"
                    >
                      {t("email.label")}*
                    </label>
                    <TextInput
                      id="email"
                      name="email"
                      placeholder={t("email.placeholder")}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all ${errors.email ? "border-red-500 ring-1 ring-red-500" : ""}`}
                    />
                    {errors.email?.[0] && (
                      <p className="text-red-500 text-xs font-semibold ml-1 animate-in fade-in slide-in-from-top-1">
                        {errors.email[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-gray-700 ml-1"
                    >
                      {t("password.label")}*
                    </label>
                    <PasswordInput
                      id="password"
                      name="password"
                      placeholder={t("password.placeholder")}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      className={`h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all ${errors.password ? "border-red-500 ring-1 ring-red-500" : ""}`}
                    />
                    {errors.password?.[0] && (
                      <p className="text-red-500 text-xs font-semibold ml-1 animate-in fade-in slide-in-from-top-1">
                        {errors.password[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(!!c)}
                      className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium text-gray-600 cursor-pointer select-none"
                    >
                      {t("rememberMe")}
                    </label>
                  </div>
                  <AuthFooter
                    text=""
                    linkText={t("forgotPassword.link")}
                    href="/recoverPassword"
                  />
                </div>

                {/* Botón Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-12 text-base font-bold uppercase tracking-wider transition-all duration-200 
                    ${isSubmitting ? "opacity-70" : "hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99]"}`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>{t("submitButton.loading")}</span>
                      </div>
                    ) : (
                      t("submitButton.default")
                    )}
                  </Button>
                </div>
              </form>
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <AuthFooter
                  text={t("noAccount.text")}
                  linkText={t("noAccount.link")}
                  href="/register"
                  replace={true}
                />
                <AuthFooter
                  text={t("activateAccount.text")}
                  linkText={t("activateAccount.link")}
                  href="/login/activate"
                />
              </div>
            </div>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
