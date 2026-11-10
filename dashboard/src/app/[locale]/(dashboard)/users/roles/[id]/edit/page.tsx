"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/sdk-config";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Roles } from "@/models/roles";
import {
  validateRole,
  validateRoleField,
  RoleFormData,
} from "@/lib/validation/roleSchema";
import { RoleResponse,  DataResponse } from "@vitalfit/sdk";
import RolesForm from "@/components/modules/roles/RolesForm";
import { useRouter } from "@/i18n/navigation";

export default function EditRolePage() {
  const t = useTranslations("roles.edit");
  const tForm = useTranslations("roles.form");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [formData, setFormData] = useState<Roles>({
    id: "",
    name: "",
    description: "",
    Permission: [],
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [initialData, setInitialData] = useState<{
    name: string;
    description: string;
    permissions: string[];
  } | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      if (!id || !token) {
        return;
      }
      setIsLoading(true);
      try {
        const response: DataResponse<RoleResponse> = await api.RBAC.getRoleByID(id, token);
        if (response?.data) {
          const { role_id, name, description, permissions } = response.data;
          const permissionIds = permissions?.map((p) => p.permission_id) || [];

          setFormData({ id: role_id, name, description, Permission: permissions });
          setSelectedPermissions(permissionIds);
          setInitialData({
            name,
            description,
            permissions: [...permissionIds].sort(),
          });
        }
      } catch (err) {
        toast.error(t("load_error"));
      } finally {
        setIsLoading(false);
      }
    };
    loadRole();
  }, [id, token, t]);

  const isDirty = useMemo(() => {
    if (!initialData) {
      return false;
    }
    const hasNameChanged = formData.name.trim() !== initialData.name;
    const hasDescriptionChanged = formData.description.trim() !== initialData.description;
    const currentPermsSorted = [...selectedPermissions].sort();
    const hasPermissionsChanged = 
      currentPermsSorted.length !== initialData.permissions.length ||
      currentPermsSorted.some((val, index) => val !== initialData.permissions[index]);

    return hasNameChanged || hasDescriptionChanged || hasPermissionsChanged;
  }, [formData.name, formData.description, selectedPermissions, initialData]);

  const handleChange = (field: keyof Roles, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof RoleFormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: keyof Roles, value: any) => {
    const result = validateRoleField(field as keyof RoleFormData, value, tForm);
    setErrors((prev) => ({ ...prev, [field]: result.success ? undefined : result.error }));
  };

  const handlePermissionChange = (permissionId: string, isChecked: boolean) => {
    const newPermissions = isChecked
      ? [...selectedPermissions, permissionId]
      : selectedPermissions.filter((id) => id !== permissionId);

    setSelectedPermissions(newPermissions);
    const result = validateRoleField("permissionsID", newPermissions, tForm);
    setErrors((prev) => ({ ...prev, permissionsID: result.success ? undefined : result.error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !token || !isDirty) {
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
    setIsSaving(true);

    try {
      await api.RBAC.updateRole(formData.id, { ...dataToValidate, permissions: [] }, token);
      await api.RBAC.addPermission(formData.id, selectedPermissions, token);
      toast.success(t("success"));
      router.push("/users/roles");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.error || t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="mx-auto max-w-5xl bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <PageHeader
            title={t("title")}
            subtitle={t("subtitle", { name: formData.name })}
            actionButton={
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => router.push("/users/roles")}
                  disabled={isSaving}
                >
                  {t("cancel")}
                </Button>
                <Button 
                  type="submit" 
                  variant="default" 
                  className="w-full sm:w-auto"
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? t("loading") : t("button")}
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