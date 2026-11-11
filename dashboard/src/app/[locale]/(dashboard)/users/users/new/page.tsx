"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import UsersForm from "../UsersForm";
import { useAuth } from "@/context/AuthContext";
import { Users } from "@/models/users";
import { api } from "@/lib/sdk-config";
import { SignUpRequest, UserGender } from "@vitalfit/sdk";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";


export default function CreateUserPage() {
    const router = useRouter();
    const { token } = useAuth();
    const t = useTranslations("user.management");
    const tAuth = useTranslations("auth.activate.errors");


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

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    // Set when the activation email could not be delivered: the admin shares the link manually.
    const [manualActivationUrl, setManualActivationUrl] = useState<string | null>(null);

    const handleChange = (field: keyof Users, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Si se cambia el documento, actualizar la contraseña automáticamente
        if (field === "document" && value.trim()) {
            // La contraseña por defecto será el documento de identidad
            // Podrías agregar aquí lógica adicional si necesitas
        }
    };

    const normalizeGenderForAPI = (gender: string): UserGender | null => {
        const genderMap: Record<string, UserGender> = {
            "masculino": UserGender.male,
            "femenino": UserGender.female,
            "prefiero no especificarlo": UserGender.preferNotToSay,
            "M": UserGender.male,
            "F": UserGender.female,
            "O": UserGender.preferNotToSay,
            "male": UserGender.male,
            "female": UserGender.female,
            "other": UserGender.preferNotToSay,
            "prefer-not-to-say": UserGender.preferNotToSay,
        };

        return genderMap[gender] || UserGender.preferNotToSay;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Field-level checks so the API never answers with a raw validation error.
        const required: [string, string][] = [
            [formData.name.trim(), "name"],
            [formData.lastname.trim(), "lastname"],
            [formData.email.trim(), "email"],
            [formData.phone.replace(/\D/g, ""), "phone"],
            [formData.document.trim(), "document"],
            [formData.date, "date"],
            [formData.rol, "role"],
        ];
        const missing = required.find(([value]) => !value);
        if (missing) {
            toast.error(t(`validation.${missing[1]}_required`));
            return;
        }
        if (formData.phone.replace(/\D/g, "").length < 10) {
            toast.error(t("validation.phone_invalid"));
            return;
        }

        if (!token) {
            setError(tAuth("check_password"));
            return;
        }


        setIsLoading(true);

        try {
            // La contraseña por defecto será el documento de identidad
            const defaultPassword = formData.document.trim();

            const signUpData: SignUpRequest = {
                first_name: formData.name.trim(),
                last_name: formData.lastname.trim(),
                email: formData.email.trim(),
                password: defaultPassword,
                identity_document: formData.document.trim(),
                phone: formData.phone.replace(/\D/g, "") || null,
                birth_date: formData.date,
                gender: normalizeGenderForAPI(formData.gender),
                profile_picture_url: null,
                role_name: formData.rol || null,
            };

            console.log("Datos de registro:", signUpData);

            const response = await api.auth.signUpStaff(signUpData, token);

            if (response && response.email_sent === false && response.activation_url) {
                setManualActivationUrl(response.activation_url);
                toast.warning(t("invitation.email_not_sent"));
                return;
            }

            toast.success(t("notifications.create_success"));


            setTimeout(() => {
                router.replace("/users/users");
            }, 2000);

        } catch (err: any) {
            console.error("Error al crear usuario:", err);
            const errorMessage = err.message || t("notifications.error_create");
            setError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    };

    if (manualActivationUrl) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
                <PageHeader title={t("invitation.title")} subtitle={t("invitation.subtitle", { email: formData.email })} />
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
                    <p className="text-sm text-amber-900">{t("invitation.instructions")}</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <code className="flex-1 break-all rounded bg-white p-2 text-xs">{manualActivationUrl}</code>
                        <Button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(manualActivationUrl);
                                toast.success(t("invitation.copied"));
                            }}
                        >
                            {t("invitation.copy")}
                        </Button>
                    </div>
                </div>
                <Button type="button" variant="secondary" onClick={() => router.replace("/users/users")}>
                    {t("invitation.back")}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
                <PageHeader
                    title={t("create_title")}
                    subtitle={t("create_subtitle")}
                />


                <UsersForm formData={formData} onChange={handleChange} edit={false} />

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.replace("/users/users")}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        {t("table.delete_dialog.cancel") || "Cancelar"}
                    </Button>
                    <Button
                        type="submit"
                        variant="default"
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {isLoading ? t("notifications.creating") : t("add_button")}
                    </Button>

                </div>
            </form>
        </div>
    );
}