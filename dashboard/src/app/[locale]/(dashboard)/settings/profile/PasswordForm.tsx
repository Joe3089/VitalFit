"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { createPasswordSchema } from "@/lib/validation/passwordSchema";

export const PasswordForm: React.FC = () => {
  const { token } = useAuth();
  const t = useTranslations("ChangePasswordPage");

  const schema = z
    .object({
      currentPassword: z.string().min(1, { message: t("passwordRequired") }),
    })
    .and(createPasswordSchema(t));

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (!token) {
    return null;
  }

  const onSubmit = async (data: FormData) => {
    try {
      await api.user.UpgradePassword(
        token,
        data.currentPassword,
        data.password,
        data.confirmPassword
      );
      toast.success(t("successDescription")); // "Password reset successfully!"
      reset();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t("genericError"));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-6 bg-white space-y-6 rounded-xl shadow-sm"
    >
      <div className="space-y-4">
        <InputField
          label="Contraseña Actual*"
          type="password"
          placeholder="Ingresa tu contraseña actual"
          {...register("currentPassword")}
          error={errors.currentPassword?.message}
        />

        <InputField
          label={t("newPasswordLabel")}
          type="password"
          placeholder={t("newPasswordPlaceholder")}
          {...register("password")}
          error={errors.password?.message}
        />

        <InputField
          label={t("confirmPasswordLabel")}
          type="password"
          placeholder={t("confirmPasswordPlaceholder")}
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
      </div>

      <div className="pt-4">
        <Button variant="default" type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submitButtonDefault")}
        </Button>
      </div>
    </form>
  );
};
