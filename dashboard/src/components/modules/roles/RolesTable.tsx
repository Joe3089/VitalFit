"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Roles } from "@/models/roles";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import ArrowDownTray from "@heroicons/react/24/outline/ArrowDownTrayIcon";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { RoleResponse, Permission } from "@vitalfit/sdk";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

export default function RolesTable() {
  const t = useTranslations("roles");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Roles | null>(null);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [inputFilters, setInputFilters] = useState<Record<string, string>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const { token } = useAuth();
  const router = useRouter();

  const [rolesData, setRolesData] = useState<Roles[]>([]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputFilters.search || "");
    }, 500);
    return () => clearTimeout(timer);
  }, [inputFilters.search]);

  const handleView = (row: Roles) => {
    router.replace(`/users/roles/${row.id}`);
  };

  const handleEdit = (row: Roles) => {
    router.replace(`/users/roles/${row.id}/edit`);
  };

  const handleDeleteRole = async (role: Roles) => {
    if (!token) {
      toast.error(t("form.errors.no_token"));
      return;
    }

    if (!role?.id) {
      toast.error(t("common.delete_id_error"));
      return;
    }

    setIsDeleting(true);

    try {
      const response = await api.RBAC.deleteRole(role.id, token);

      console.warn("Respuesta de eliminación:", response);
      toast.success(t("common.delete_success"));

      setDeleteRowId(null);
      setSelectedRole(null);

      fetchRoles(page);
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("common.unknown_error");
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPermissionsCount = (
    permissions: Permission[] | undefined,
  ): string => {
    const count = permissions?.length || 0;
    return t("table.permissions_count", { count });
  };

  const columns: Column<Roles>[] = [
    {
      header: t("table.columns.name"),
      accessor: "name",
      filterType: "text",
    },
    {
      header: t("table.columns.description"),
      accessor: "description",
      filterType: "text",
      render: (description) => (
        <div className="max-w-[200px] truncate" title={description as string}>
          {description as string}
        </div>
      ),
    },
    {
      header: t("table.columns.permissions"),
      accessor: "Permission",
      render: (permissions) => (
        <div className="max-w-[100px] truncate">
          {getPermissionsCount(permissions as Permission[])}
        </div>
      ),
    },
  ];

  const fetchRoles = async (currentPage: number = page) => {
    if (!token) {
      console.log("No hay token disponible");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.RBAC.getRoles(
        {
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch || undefined,
          sort: "desc",
        },
        token,
      );

      const rolesArray = response.data || [];
      const total = response.total || response.count || 0;

      setTotalItems(total);

      if (Array.isArray(rolesArray)) {
        const rolesWithoutPermissions = rolesArray.map(
          (role: RoleResponse) => ({
            id: role.role_id,
            name: role.name,
            description: role.description,
            Permission: [],
          }),
        );

        setRolesData(rolesWithoutPermissions);

        const rolesWithPermissions = await Promise.all(
          rolesArray.map(async (role: RoleResponse) => {
            try {
              const permissionsResponse = await api.RBAC.getRoleByID(
                role.role_id,
                token,
              );
              const roleWithPermissions = permissionsResponse.data;

              return {
                id: role.role_id,
                name: role.name,
                description: role.description,
                Permission: roleWithPermissions?.permissions || [],
              };
            } catch (error) {
              console.error(
                `Error obteniendo permisos para rol ${role.role_id}:`,
                error,
              );
              return {
                id: role.role_id,
                name: role.name,
                description: role.description,
                Permission: [],
              };
            }
          }),
        );

        setRolesData(rolesWithPermissions);
      } else {
        console.error("La respuesta no contiene un array de roles:", response);
        setRolesData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error al obtener roles:", error);
      setRolesData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchRoles(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchRoles(page);
  }, [page, token]);

  const handleSearchChange = (value: string) => {
    setInputFilters((prev) => ({ ...prev, search: value }));
  };

  if (isLoading && rolesData.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div>{t("table.loading")}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-[250px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.filter_placeholder")}
            className="pl-9"
            value={inputFilters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

      </div>

      <DataTable<Roles>
        key={`roles-table-${page}-${debouncedSearch}`}
        columns={columns}
        data={rolesData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={(newPage) => {
          setPage(newPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        actions={(row) => (
          <div className="flex flex-col items-center justify-center w-full">
            <RowActions
              actions={[
                {
                  label: t("table.actions.view"),
                  icon: Eye,
                  onClick: () => handleView(row),
                },
                {
                  label: t("table.actions.edit"),
                  icon: Pencil,
                  onClick: () => handleEdit(row),
                },
                {
                  label: t("table.actions.delete"),
                  icon: Trash2,
                  onClick: () => setDeleteRowId(row.id),
                  variant: "danger",
                  separatorBefore: true,
                },
              ]}
            />
            {deleteRowId === row.id && (
              <GeneralAlertDialog
                open={true}
                onOpenChange={(open) => !open && setDeleteRowId(null)}
                title={t("table.delete_dialog.title")}
                description={t("table.delete_dialog.description")}
                type="confirmation"
                actionText={isDeleting ? t("table.delete_dialog.action_deleting") : t("table.delete_dialog.action_delete")}
                actionVariant="destructive"
                onAction={() => handleDeleteRole(row)}
              />
            )}
          </div>
        )}
      />
    </>
  );
}
