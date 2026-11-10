"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import UsersForm from "../../UsersForm";
import { useAuth } from "@/context/AuthContext";
import { Users } from "@/models/users";
import { api } from "@/lib/sdk-config";
import { GetUserResponse, UpdateUserStaffRequest } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";


type UserRole = Users["rol"];

export default function EditUserPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();
    const t = useTranslations("user.management");


    const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");

    const mapGenderToBackend = (gender: string): "male" | "female" | "prefer-not-to-say" => {
        const backendMap: Record<string, "male" | "female" | "prefer-not-to-say"> = {
            "masculino": "male",
            "femenino": "female",
            "prefiero no especificarlo": "prefer-not-to-say",
            "male": "male",
            "female": "female",
            "other": "prefer-not-to-say",
            "prefer-not-to-say": "prefer-not-to-say",
        };

        return backendMap[gender] || "prefer-not-to-say";
    };

    const [formData, setFormData] = useState<Users>({
        id: "",
        name: "",
        lastname: "",
        email: "",
        phone: "",
        document: "",
        date: "",
        gender: "",
        rol: "client",
        status: "active",
        uacceso: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const mapRoleNameToValidRole = (roleName: string): UserRole => {
        const roleMapping: Record<string, UserRole> = {
            "super_admin": "super_admin",
            "superadmin": "super_admin",
            "branch_admin": "branch_admin",
            "accountant": "accountant",
            "data_analyst": "data_analyst",
            "instructor": "instructor",
            "recepcionist": "recepcionist",
            "staff": "staff",
            "client": "client",
            "Super Administrador": "super_admin",
            "Administrador de sede": "branch_admin",
            "Contador": "accountant",
            "Analista de datos": "data_analyst",
            "Instructor": "instructor",
            "Recepcionista": "recepcionist",
            "Cliente": "client",
        };

        return roleMapping[roleName] || "client";
    };

    useEffect(() => {
        const loadUser = async () => {
            if (!id || !token) {
                if (!token) {
                    setError(t("notifications.error_unauthorized"));
                    setIsLoading(false);
                    return;
                }
                setError(t("notifications.error_loading"));
                setIsLoading(false);
                return;
            }


            setIsLoading(true);
            setError(null);
            try {
                const response = await api.user.GetUserByID(id, token);
                const userData = response.data as GetUserResponse;

                if (userData) {
                    const roleName = userData.role_name || "";
                    const validRole = mapRoleNameToValidRole(roleName);
                    const normalizedGender = mapGenderToBackend(userData.gender);

                    setFormData({
                        id: userData.user_id || "",
                        name: userData.first_name || "",
                        lastname: userData.last_name || "",
                        email: userData.email || "",
                        phone: normalizePhone(userData.phone || ""),
                        document: userData.identity_document || "",
                        date: userData.birth_date || "",
                        gender: normalizedGender,
                        rol: validRole,
                        status: "active",
                        uacceso: "",
                    });
                } else {
                    setError(t("notifications.error_not_found"));
                }

            } catch (err) {
                console.error("Error loading user:", err);
                setError(t("notifications.error_loading"));
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, [id, token]);

    const handleChange = (field: keyof Users, value: string) => {
        if (field === "rol") {
            const validRoles: UserRole[] = ["super_admin", "branch_admin", "accountant", "data_analyst", "instructor", "recepcionist", "client", "staff"];
            const isValidRole = validRoles.includes(value as UserRole);

            setFormData((prev) => ({
                ...prev,
                [field]: isValidRole ? value as UserRole : "client"
            }));
        } else if (field === "status") {
            // Validar que status sea solo "active" o "inactive"
            const isValidStatus = value === "active" || value === "inactive";
            setFormData((prev) => ({
                ...prev,
                [field]: isValidStatus ? value as "active" | "inactive" : "active"
            }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError(t("notifications.error_update"));
            return;
        }

        if (!id) {
            setError(t("notifications.error_update"));
            return;
        }


        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const updateData: UpdateUserStaffRequest = {
                first_name: formData.name.trim() || undefined,
                last_name: formData.lastname.trim() || undefined,
                email: formData.email.trim() || undefined,
                phone: formData.phone.replace(/\D/g, "") || undefined,
                identity_document: formData.document.trim() || undefined,
                birth_date: formData.date || undefined,
                gender: mapGenderToBackend(formData.gender),
                role_name: formData.rol || undefined,
            };

            console.log("Enviando datos de actualización:", updateData);

            // Llamar al API para actualizar el usuario
            const response = await api.user.updateUserStaff(id, updateData, token);

            toast.success(t("notifications.update_success"));


            setTimeout(() => {
                router.replace(`/users/users/${id}`);
            }, 1500);


        } catch (err: any) {
            console.error("Error al actualizar usuario:", err);
            const errorMessage = err.message || t("notifications.error_update");
            setError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <div>{t("notifications.error_loading")}...</div>
                </div>
            </div>
        );
    }


    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
                <PageHeader
                    title={t("edit_title")}
                    subtitle={t("edit_subtitle", { name: formData.name, lastname: formData.lastname })}
                />


                <UsersForm
                    formData={formData}
                    onChange={handleChange}
                    edit={true}
                />

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.replace(`/users/users/${id}`)}
                        className="flex-1"
                        disabled={isSaving}
                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="default"
                        disabled={isSaving}
                        className="flex-1"
                    >
                        {isSaving ? (
                            <span className="flex items-center justify-center">
                                {t("notifications.saving")}
                            </span>
                        ) : t("actions.save")}
                    </Button>

                </div>
            </form>
        </div>
    );
}