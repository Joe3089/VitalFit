"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Roles } from "@/models/roles";
import { RoleResponse, DataResponse } from "@vitalfit/sdk";
import RolesForm from "@/components/modules/roles/RolesForm";
import { useRouter } from "@/i18n/navigation";
import { PencilIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ViewRolePage() {
  const t = useTranslations("roles");
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      if (!id || !token) {
        setError(t("edit.load_error"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response: DataResponse<RoleResponse> = await api.RBAC.getRoleByID(id, token);
        if (response?.data) {
          const { role_id, name, description, permissions } = response.data;
          setFormData({
            id: role_id,
            name,
            description,
            Permission: permissions,
          });

          const permissionIds = permissions?.map((p) => p.permission_id) || [];
          setSelectedPermissions(permissionIds);
        } else {
          setError(t("view.error_not_found"));
        }
      } catch (err) {
        console.error("Error cargando rol:", err);
        setError(t("edit.load_error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [id, token, t]);

  const handleEdit = () => router.push(`/users/roles/${id}/edit`);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground">{t("edit.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center space-y-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-center max-w-md w-full">
          {error}
        </div>
        <Button variant="outline" onClick={() => router.push("/users/roles")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {t("view.back_button")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="mx-auto max-w-5xl bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <form className="space-y-8">
          <PageHeader
            title={t("view.title")}
            subtitle={t("view.subtitle", { name: formData.name })}
            actionButton={
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => router.push("/users/roles")}
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  {t("view.back_button")}
                </Button>
                <Button 
                  type="button" 
                  variant="default" 
                  className="w-full sm:w-auto"
                  onClick={handleEdit}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  {t("view.button_edit")}
                </Button>
              </div>
            }
          />

          <hr className="border-slate-100" />

          <div className="overflow-x-hidden opacity-90">
            <RolesForm
              formData={formData}
              onChange={() => {}}
              selectedPermissions={selectedPermissions}
              onPermissionChange={() => {}}
              onFieldBlur={() => {}}
              errors={{}}
              disabled={true} 
            />
          </div>
        </form>
      </div>
    </div>
  );
}