"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { Users, roleLabels } from "@/models/users";
import { api } from "@/lib/sdk-config";
import { GetUserResponse } from "@vitalfit/sdk";
import {
    EyeIcon,
    PencilIcon,
    ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { UserSession } from "@vitalfit/sdk";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner"; 

type UserRole = Users["rol"];

export default function ViewUserPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { token } = useAuth();
    const t = useTranslations("user.management");
    const tRoles = useTranslations("user.UserSelectionCard.roles");

    const [user, setUser] = useState<Users | null>(null);
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizePhone = (phone: string) => phone.replace(/\s+/g, "");

    const normalizeGender = (gender: string): string => {
        const genderMap: Record<string, string> = {
            "M": "male",
            "F": "female",
            "O": "other",
            "masculino": "male",
            "femenino": "female",
            "prefiero no especificarlo": "other",
            "male": "male",
            "female": "female",
            "other": "other",
        };

        return genderMap[gender] || "other";
    };

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
                    const normalizedGender = normalizeGender(userData.gender || "");

                    const mappedUser: Users = {
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
                    };
                    setUser(mappedUser);

                    try {
                        const sessionsRes = await api.auth.getUserSessionByID(mappedUser.id, token);
                        setSessions(sessionsRes.data || []);
                    } catch (sessionErr) {
                        console.error("Error loading sessions:", sessionErr);
                    }
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

    const handleEdit = () => {
        router.replace(`/users/users/${id}/edit`);
    };

    const revokeAllSessions = async () => {
        if (!token || !user) {
            toast.error("Token de autenticación no disponible");
            return;
        }

        setIsRevoking(true);
        try {
            await api.auth.revokeAllSessions(token);
            
            toast.success(t("notifications.sessions_revoked"), {
                description: `Usuario: ${user.name} ${user.lastname}`,
                duration: 5000,
            });
            
            try {
                const updatedSessions = await api.auth.getUserSessionByID(user.id, token);
                setSessions(updatedSessions.data || []);
            } catch (updateErr) {
                setSessions([]);
            }
            
        } catch (error) {
            console.error("Error revocando sesiones:", error);
            toast.error(t("notifications.sessions_revoked_error"), {
                duration: 5000,
            });
        } finally {
            setIsRevoking(false);
        }
    };

    const stats = useMemo(() => {
        if (!sessions.length) return { active: 0, total: 0, average: 0 };

        const now = new Date();
        const active = sessions.filter(s => !s.is_blocked && new Date(s.expires_at) > now).length;
        const total = sessions.length;

        const dates = sessions.map(s => new Date(s.created_at).getTime());
        const minDate = Math.min(...dates);
        const maxDate = now.getTime();
        const diffDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
        const average = parseFloat((total / diffDays).toFixed(1));

        return { active, total, average };
    }, [sessions]);

    // Activities are now shown on a dedicated page (`/users/users/[id]/audit`)

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


    if (error || !user) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="text-red-500 text-center p-4">{error || t("notifications.error_loading")}</div>
                <div className="flex justify-center">
                    <Button variant="default" onClick={() => router.replace("/users/users")}>
                        {t("actions.cancel")}
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
            <PageHeader
                title={t("view_title")}
                subtitle={t("view_subtitle", { name: user.name, lastname: user.lastname })}
            />


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {t("personal_info")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>
                            <strong>{t("user_id")}:</strong> {user.id}
                        </div>
                        <div>
                            <strong>{t("table.columns.status")}:</strong>{" "}
                            <span className="px-2 py-1 rounded-full border border-green-100 text-green-700 text-xs font-bold">
                                {user.status === "active" ? t("table.columns.status_active") : t("table.columns.status_inactive")}
                            </span>
                        </div>
                        <div>
                            <strong>{t("form.name").replace("*", "")}:</strong> {user.name}
                        </div>
                        <div>
                            <strong>{t("form.lastname").replace("*", "")}:</strong> {user.lastname}
                        </div>
                        <div>
                            <strong>{t("form.role").replace("*", "")}:</strong>
                            <span className="px-2 py-1 rounded-full border border-orange-100 text-orange-700 text-xs font-bold ml-1">
                                {tRoles(user.rol.toLowerCase()) ?? user.rol}
                            </span>
                        </div>
                        <div>
                            <strong>{t("form.email").replace("*", "")}:</strong> {user.email}
                        </div>
                        <div>
                            <strong>{t("form.phone").replace("*", "")}:</strong> {user.phone}
                        </div>
                        <div>
                            <strong>{t("form.document").replace("*", "")}:</strong> {user.document}
                        </div>
                        <div>
                            <strong>{t("form.gender").replace("*", "")}:</strong> {t(`form.genders.${user.gender}`)}
                        </div>
                        <div>
                            <strong>{t("form.birth_date").replace("*", "")}:</strong> {user.date}
                        </div>
                    </div>
                </div>


                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {t("quick_actions.title")}
                    </h2>
                    <div className="border rounded-lg p-4 space-y-3">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/users/users/${id}/audit`)}
                        >
                            <EyeIcon className="h-4 w-4" />
                            {t("quick_actions.view_activity")}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsSessionsModalOpen(true)}>
                            <ComputerDesktopIcon className="h-4 w-4" />
                            {t("quick_actions.view_sessions")}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleEdit}>
                            <PencilIcon className="h-4 w-4" />
                            {t("quick_actions.edit_user")}
                        </Button>
                    </div>
                </div>

            </div>

            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {t("sessions_info")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 p-4 rounded shadow">
                        <div className="text-sm text-gray-500">{t("stats.active_sessions")}</div>
                        <div className="text-2xl font-bold text-gray-800">{stats.active}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded shadow">
                        <div className="text-sm text-gray-500">{t("stats.total_logins")}</div>
                        <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded shadow">
                        <div className="text-sm text-gray-500">{t("stats.daily_average")}</div>
                        <div className="text-2xl font-bold text-gray-800">{stats.average}</div>
                    </div>
                </div>
            </div>

            <Dialog open={isSessionsModalOpen} onOpenChange={setIsSessionsModalOpen}>
                <DialogContent className="max-w-2xl overflow-hidden flex flex-col h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>{t("sessions_modal.title", { name: user.name, lastname: user.lastname })}</DialogTitle>
                    </DialogHeader>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-bold text-red-800">{t("sessions_modal.security_label")}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
                            <div className="flex flex-col">
                                <p className="text-red-700">
                                    {t("sessions_modal.security_description")}
                                </p>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <Button 
                                    onClick={revokeAllSessions} 
                                    className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={isRevoking || sessions.length === 0}
                                >
                                    {isRevoking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            {t("sessions_actions.revoking")}
                                        </>
                                    ) : (
                                        t("sessions_actions.revoke_all")
                                    )}
                                </Button>
                                <p className="text-xs text-red-600 mt-1 text-right">
                                    {t("sessions_modal.count", { count: sessions.length })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4 py-4">
                            {sessions.length > 0 ? (
                                sessions.map((session) => (
                                    <div key={session.id} className="p-4 border rounded-lg bg-slate-50 space-y-3 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-full border shadow-sm">
                                                    <ComputerDesktopIcon className="h-5 w-5 text-orange-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 break-all line-clamp-2 text-sm" title={session.user_agent}>
                                                        {session.user_agent}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        ID: {session.id}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge variant={session.is_blocked ? "error" : "success"}>
                                                {session.is_blocked ? t("sessions_modal.status.blocked") : t("sessions_modal.status.active")}
                                            </Badge>
                                        </div>


                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{t("sessions_modal.ip_address")}</span>
                                                <span className="text-gray-700">{session.client_ip}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{t("sessions_modal.started")}</span>
                                                <span className="text-gray-700">{new Date(session.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col sm:col-span-2">
                                                <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{t("sessions_modal.expires")}</span>
                                                <span className="text-gray-700">{new Date(session.expires_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
                                    <ComputerDesktopIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 font-medium">{t("sessions_modal.empty")}</p>
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}