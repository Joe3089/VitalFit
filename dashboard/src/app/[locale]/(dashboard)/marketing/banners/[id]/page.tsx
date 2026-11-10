"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/Label";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import {  useParams } from "next/navigation";
import { Banner } from "@vitalfit/sdk";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRouter } from "@/i18n/navigation";

export default function ViewBannerPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useAuth();
    const [banner, setBanner] = useState<Banner | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBanner = async () => {
            if (!token || !params.id) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.marketing.getBanner(token);
                const banners = response.data || [];
                const foundBanner = banners.find((b: Banner) => {
                    return b.banner_id === params.id;
                });

                if (foundBanner) {
                    setBanner(foundBanner);
                } else {
                    router.replace("/marketing/banners");
                }
            } catch (error) {
                console.error("Error cargando banner:", error);
                router.replace("/marketing/banners");
            } finally {
                setLoading(false);
            }
        };

        loadBanner();
    }, [token, params.id, router]);

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="text-center">Cargando datos...</div>
            </div>
        );
    }

    if (!banner) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="text-center">Banner no encontrado</div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <PageHeader
                title="Banners"
                subtitle="Vista de solo lectura/información completa del banner seleccionado"
            />

            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="space-y-4">
                    <p className="text-xl font-semibold">Información General</p>
                    <p className="text-sm text-gray-500">Visualización de imagen</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <div className="rounded-lg p-4">
                            <img
                                src={banner.image_url}
                                alt={banner.name}
                                className="w-3/4 h-48 rounded border object-cover"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Banner</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">{banner.name}</span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-2">
                            <div className="flex items-center gap-3">
                                <Label htmlFor="is_active">Estado(Activo/Inactivo)</Label>
                                <Switch
                                    id="is_active"
                                    checked={banner.is_active}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-col space-y-2">
                        <Label htmlFor="link_url">URL del sitio</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">{banner.link_url}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={() => {
                            router.replace("/marketing/banners");
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        ir al Listado
                    </Button>
                </div>
            </div>
        </div>
    );
}
