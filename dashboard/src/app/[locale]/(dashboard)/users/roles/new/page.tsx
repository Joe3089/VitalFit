"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/sdk-config";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { Roles } from "@/models/roles";
import {
  validateRole,
  validateRoleField,
  RoleFormData,
} from "@/lib/validation/roleSchema";
import type { CreateRole as CreateRolePayload } from "@vitalfit/sdk";
import RolesForm from "@/components/modules/roles/RolesForm";
import { useRouter } from "@/i18n/navigation";

export default function CreateRolePage() {
  const t = useTranslations("roles.create");
  const tForm = useTranslations("roles.form");
  const router = useRouter();
  const { token } = useAuth();

  const [formData, setFormData] = useState<Roles>({
    id: "",
    name: "",
    description: "",
    Permission: [],
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof Roles, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof RoleFormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: keyof Roles, value: string) => {
    const result = validateRoleField(field as keyof RoleFormData, value, tForm);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error,
    }));
  };

  const handlePermissionChange = (permissionId: string, isChecked: boolean) => {
    const newPermissions = isChecked
      ? [...selectedPermissions, permissionId]
      : selectedPermissions.filter((id) => id !== permissionId);

    setSelectedPermissions(newPermissions);

    const result = validateRoleField("permissionsID", newPermissions, tForm);
    setErrors((prev) => ({
      ...prev,
      permissionsID: result.success ? undefined : result.error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("auth_error"));
      return;
    }

    const dataToValidate: RoleFormData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissionsID: selectedPermissions,
    };

    const validation = validateRole(dataToValidate, tForm);
    if (!validation.success) {
      const newErrors: Partial<Record<keyof RoleFormData, string>> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RoleFormData;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const payload: CreateRolePayload = {
        name: dataToValidate.name,
        description: dataToValidate.description,
        permissions: dataToValidate.permissionsID,
      };

      await api.RBAC.createRole(payload, token);

      toast.success(t("success"));
      router.push("/users/roles");
      router.refresh();
    } catch (err: any) {
      console.error("Error al crear rol:", err);
      const errorMessage = err?.messages?.[0] === "conflict" 
        ? t("conflict_error") 
        : (err?.error || t("error"));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="mx-auto max-w-5xl bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle")}
            actionButton={
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => router.push("/users/roles")}
                  disabled={isLoading}
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  variant="default" 
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? t("loading") : t("button")}
                </Button>
              </div>
            }
          />

          <hr className="border-slate-100" />

          <div className="overflow-x-hidden">
            <RolesForm
              formData={formData}
              onChange={handleChange}
              selectedPermissions={selectedPermissions}
              onPermissionChange={handlePermissionChange}
              onFieldBlur={handleFieldBlur}
              errors={errors}
            />
          </div>
        </form>
      </div>
    </div>
  );
}