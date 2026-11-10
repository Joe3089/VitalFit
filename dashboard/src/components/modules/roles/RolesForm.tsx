"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Roles } from "@/models/roles";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { RoleFormData } from "@/lib/validation/roleSchema";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@vitalfit/sdk";

interface RolesFormProps {
  formData: Roles;
  onChange: (field: keyof Roles, value: string) => void;
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, isChecked: boolean) => void;
  disabled?: boolean;
  errors?: Partial<Record<keyof RoleFormData, string>>;
  onFieldBlur?: (field: keyof Roles, value: string) => void;
}

interface PermissionOption {
  key: string;
  label: string;
  description?: string; 
}

export default function RolesForm({
  formData,
  onChange,
  selectedPermissions = [],
  onPermissionChange,
  disabled = false,
  errors = {},
  onFieldBlur,
}: RolesFormProps) {
  const t = useTranslations("roles.form");
  const { token } = useAuth();
  const [permissions, setPermissions] = useState<PermissionOption[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const handleBlur = (field: keyof Roles, value: string) => {
    if (onFieldBlur) {
      onFieldBlur(field, value);
    }
  };

  const getFieldError = (field: keyof RoleFormData): string | undefined => {
    return errors[field];
  };

  useEffect(() => {
    const loadPermissions = async () => {
      if (!token) {
        setPermissionsError(t("errors.no_token"));
        setIsLoadingPermissions(false);
        return;
      }

      try {
        setIsLoadingPermissions(true);
        setPermissionsError(null);

        const response = await api.RBAC.getPermissions(token);

        if (response && Array.isArray(response.data)) {
          const mappedPermissions: PermissionOption[] = response.data.map(
            (permission: Permission) => ({
              key: permission.permission_id,
              label: permission.name || permission.permission_id,
              description: permission.description, 
            }),
          );

          setPermissions(mappedPermissions);
        } else {
          setPermissionsError(t("errors.load_permissions_failed"));
          setPermissions([]);
        }
      } catch (error) {
        console.error("Error al cargar permisos:", error);
        setPermissionsError(t("errors.server_error"));
        setPermissions([]);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, [token]);

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex-1">
          <label
            htmlFor="nombre"
            className="block text-sm font-bold text-gray-700 mb-1 text-left uppercase tracking-tighter italic"
          >
            {t("fields.name")}
          </label>
          <Input
            id="nombre"
            name="nombre"
            placeholder={t("fields.name_placeholder")}
            disabled={disabled}
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            onBlur={(e) => handleBlur("name", e.target.value)}
            className={`bg-white w-full ${getFieldError("name") ? "border-red-500" : ""}`}
          />
          {getFieldError("name") && (
            <p className="text-red-500 text-xs mt-1 font-bold italic uppercase">
              {getFieldError("name")}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="flex-1">
          <label
            htmlFor="description"
            className="block text-sm font-bold text-gray-700 mb-1 text-left uppercase tracking-tighter italic"
          >
            {t("fields.description")}
          </label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder={t("fields.description_placeholder")}
            disabled={disabled}
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            onBlur={(e) => handleBlur("description", e.target.value)}
            className={`bg-white w-full ${getFieldError("description") ? "border-red-500" : ""}`}
          />
          {getFieldError("description") && (
            <p className="text-red-500 text-xs mt-1 font-bold italic uppercase">
              {getFieldError("description")}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-tighter italic">
          {t("fields.permissions")}
        </span>

        {isLoadingPermissions && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground animate-pulse mb-4 italic">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
            <span>{t("fields.loading_permissions")}...</span>
          </div>
        )}

        {permissionsError && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm mb-4">
            {permissionsError}
          </div>
        )}

        <div className="border border-gray-200 rounded-xl bg-gray-50/50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300">
            {!isLoadingPermissions && permissions.length === 0 && !permissionsError && (
              <div className="p-8 text-center text-sm text-muted-foreground italic">
                {t("fields.no_permissions")}
              </div>
            )}

            {permissions.map(({ key, label, description }) => {
              const isChecked = selectedPermissions.includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                    isChecked 
                      ? "bg-white border-primary/20 shadow-sm" 
                      : "hover:bg-white hover:border-gray-200 border-transparent"
                  }`}
                >
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={disabled}
                      onChange={(e) => onPermissionChange(key, e.target.checked)}
                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-sm font-bold leading-none mb-1.5 ${isChecked ? "text-primary" : "text-gray-900"}`}>
                      {label}
                    </span>
                    {description && (
                      <span className="text-xs text-gray-500 leading-normal font-medium">
                        {description} 
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {!isLoadingPermissions && permissions.length > 0 && (
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-[10px] font-black uppercase italic tracking-widest text-gray-400">
              {t("fields.permissions_selected", { 
                selected: selectedPermissions.length, 
                total: permissions.length 
              })}
            </span>
            {getFieldError("permissionsID") && (
              <span className="text-red-500 text-[10px] font-bold uppercase italic animate-pulse">
                {getFieldError("permissionsID")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}