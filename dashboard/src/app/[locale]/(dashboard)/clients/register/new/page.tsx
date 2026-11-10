"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { SignUpRequest, UserGender, isAPIError } from "@vitalfit/sdk";
import { toast } from "sonner";
import { getClientSchema } from "@/lib/validation/clientSchema";
import { useTranslations } from "next-intl";
import ClientsForm, { ClientData } from "@/components/modules/clients/ClientsForm";

function normalizeGenderForAPI(gender: string): UserGender | null {
    const genderMap: Record<string, UserGender> = {
        "male": UserGender.male,
        "female": UserGender.female,
        "prefer-not-to-say": UserGender.preferNotToSay,
        "masculino": UserGender.male,
        "femenino": UserGender.female,
        "prefiero no especificarlo": UserGender.preferNotToSay,
    };

    return genderMap[gender] || null;
}

export default function NewClient() {
    const t = useTranslations("clients.create");
    const tForm = useTranslations("clients.form.validations");
    const router = useRouter();
    const { token } = useAuth();

    const [client, setClient] = useState<ClientData>({
        first_name: "",
        last_name: "",
        email: "",
        birth_date: "",
        gender: "prefer-not-to-say", 
        identity_document: "",
        phone: "",
        profile_picture_url: "",
        role_name: "client" 
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientData, string>>>({});

    const handleCreate = async () => {
        if (!token) {
            setError(t("auth_error"));
            return;
        }

        const schema = getClientSchema(tForm);
        const result = schema.safeParse(client);

        if (!result.success) {
            const formattedErrors: Partial<Record<keyof ClientData, string>> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as keyof ClientData;
                formattedErrors[path] = issue.message;
            });
            setFormErrors(formattedErrors);
            return;
        }

        setFormErrors({});
        setIsSaving(true);
        setError(null);

        try {
            const createData = {
                first_name: client.first_name.trim(),
                last_name: client.last_name.trim(),
                email: client.email.toLowerCase().trim(),
                birth_date: client.birth_date, 
                gender: normalizeGenderForAPI(client.gender),
                identity_document: client.identity_document.trim(),
                phone: client.phone || "",
                profile_picture_url: client.profile_picture_url || "",
                role_name: "client" 
            };
            await api.auth.signUpStaff(createData as SignUpRequest, token);

            toast.success(t("success"));

            setTimeout(() => {
                router.replace("/clients/register");
            }, 1000);

        } catch (error: any) {
            console.error("Error creating client:", error);
            let errorMessage = t("error");

            if (isAPIError(error)) {
                errorMessage = error.messages.join(", ");
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.replace("/clients/register");
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl mx-auto">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            >
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    {t("cancel_button")}
                </Button>
            </PageHeader>

            <div className="grid gap-6">
                <ClientsForm
                    client={client}
                    onChange={(field, value) => {
                        setClient(prev => ({ ...prev, [field]: value }));
                        if (formErrors[field]) {
                            setFormErrors(prev => ({ ...prev, [field]: undefined }));
                        }
                    }}
                    errors={formErrors}
                    mode="create"
                />

                <Button 
                    className="w-full h-12 text-base font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.01]" 
                    onClick={handleCreate} 
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>{t("creating")}</span>
                        </div>
                    ) : (
                        t("create_button")
                    )}
                </Button>

                {error && (
                    <p className="text-sm font-medium text-destructive text-center animate-bounce">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}