"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { useParams } from "next/navigation";
import type { Banner } from "@vitalfit/sdk";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/PageHeader";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "@/lib/cropImage";
import { PencilIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB;

const DEFAULT_BANNER_IMAGE =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjNmMyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CYW5uZXI8L3RleHQ+Cjwvc3ZnPg==";

export default function EditBannerPage() {
    const router = useRouter();
    const params = useParams();
    const { token } = useAuth();
    const t = useTranslations("banners");

    const [banner, setBanner] = useState<Banner | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [bannerImage, setBannerImage] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);

    const [cropModal, setCropModal] = useState<{
        open: boolean;
        imageSrc?: string;
        crop: { x: number; y: number };
        zoom: number;
        rotation: number;
        croppedAreaPixels?: { x: number; y: number; width: number; height: number };
    }>({
        open: false,
        crop: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0,
    });

    const [formData, setFormData] = useState({
        name: "",
        link_url: "",
        is_active: true,
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        link_url?: string;
    }>({});

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
                    setFormData({
                        name: foundBanner.name || "",
                        link_url: foundBanner.link_url || "",
                        is_active: foundBanner.is_active ?? true,
                    });
                    setBannerImage(foundBanner.image_url || "");
                    if (foundBanner.image_url) setImageLoading(true);
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

    const uploadToImgBB = async (file: File | Blob): Promise<string> => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(
                `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                console.warn(`Error ${response.status}: ${t("errors.imgUploadFailed")}`);
            }

            const data = await response.json();

            if (data.success) {
                return data.data.url;
            } else {
                throw new Error(
                    data.error?.message || t("errors.imgUploadUnknown")
                );
            }
        } catch (error) {
            console.error("Error subiendo a ImgBB:", error);
            return DEFAULT_BANNER_IMAGE;
        } finally {
            setUploading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: { name?: string; link_url?: string } = {};

        if (!formData.name.trim()) {
            errors.name = t("errors.nameRequired");
        }

        if (!formData.link_url.trim()) {
            errors.link_url = t("errors.urlRequired");
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !banner) {
            toast.error(t("errors.notAuthenticated"));
            return;
        }

        if (!validateForm()) {
            toast.error(t("errors.fixForm"));
            return;
        }

        if (!bannerImage) {
            toast.error(t("errors.noImage"));
            return;
        }

        setIsSubmitting(true);
        setIsSubmitting(true);

        try {
            await api.marketing.updateBanner(
                banner.banner_id || "",
                {
                    name: formData.name,
                    image_url: bannerImage,
                    link_url: formData.link_url,
                    is_active: formData.is_active,
                },
                token
            );

            toast.success(t("notifications.updated"));
            setTimeout(() => {
                router.replace("/marketing/banners");
            }, 1500);
        } catch (error) {
            console.error("Error al actualizar banner:", error);
            toast.error(t("notifications.errorTitle"), {
                description:
                    error instanceof Error
                        ? error.message
                        : t("errors.updateUnknown"),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBannerUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const imageUrl = await uploadToImgBB(file);
            setImageLoading(true);
            setBannerImage(imageUrl);
            setFormData((prev) => ({ ...prev, link_url: imageUrl }));
        } catch (error) {
            console.error("Error subiendo banner:", error);
            console.error("Error subiendo banner:", error);
            toast.error(t("errors.uploadDefault"));
        }
    };

    const handleBannerEdit = () => {
        if (!bannerImage) return;
        setCropModal({
            open: true,
            imageSrc: bannerImage,
            crop: { x: 0, y: 0 },
            zoom: 1,
            rotation: 0,
        });
    };

    const applyCrop = async () => {
        if (
            !cropModal.imageSrc ||
            !cropModal.croppedAreaPixels
        ) {
            return;
        }

        try {
            const blob = await getCroppedBlob(
                cropModal.imageSrc,
                cropModal.croppedAreaPixels,
                cropModal.rotation,
                0.92
            );

            setCropModal((s) => ({ ...s, open: false }));
            setImageLoading(true); // Show loading while re-uploading

            // Re-upload cropped image
            const imageUrl = await uploadToImgBB(blob);
            setBannerImage(imageUrl);
            setFormData((prev) => ({ ...prev, link_url: imageUrl }));

        } catch (error) {
            console.error("Error al recortar la imagen:", error);
            console.error("Error al recortar la imagen:", error);
            toast.error(t("errors.cropProcessing"));
        } finally {
            setImageLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="text-center">{t("loadingData")}</div>
            </div>
        );
    }

    if (!banner) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-6">
                <div className="text-center">{t("notFound")}</div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <PageHeader
                title={t("edit.title")}
                subtitle={t("create.subtitle")}
            />

            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("labels.name")} *</Label>
                        <Input
                            id="name"
                            placeholder={t("placeholders.name")}
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (formErrors.name) {
                                    setFormErrors({ ...formErrors, name: undefined });
                                }
                            }}
                            className={`bg-white ${formErrors.name ? "border-red-500" : ""}`}
                            required
                        />
                        {formErrors.name && (
                            <p className="text-red-500 text-sm">{formErrors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link_url">{t("labels.linkUrl")} *</Label>
                        <Input
                            id="link_url"
                            placeholder={t("placeholders.linkUrl")}
                            value={formData.link_url}
                            onChange={(e) => {
                                setFormData({ ...formData, link_url: e.target.value });
                                if (formErrors.link_url) {
                                    setFormErrors({ ...formErrors, link_url: undefined });
                                }
                            }}
                            className={`bg-white ${formErrors.link_url ? "border-red-500" : ""}`}
                            required
                            disabled
                        />
                        {formErrors.link_url && (
                            <p className="text-red-500 text-sm">{formErrors.link_url}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Label htmlFor="is_active">{t("labels.status")}</Label>
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => {
                                setFormData({ ...formData, is_active: checked });
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{t("labels.uploadUrl")} *</Label>

                    {bannerImage ? (
                        <div className="border-2 border-orange-300 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 relative min-h-[192px]">
                                    {imageLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded border z-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                                            <span className="text-sm text-gray-500 font-medium">Cargando...</span>
                                        </div>
                                    )}
                                    <img
                                        src={bannerImage}
                                        alt="Banner preview"
                                        className={`w-full h-48 rounded border object-cover transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"
                                            }`}
                                        onLoad={() => setImageLoading(false)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            id="banner-upload-edit"
                                            accept="image/*"
                                            onChange={handleBannerUpload}
                                            className="hidden"
                                        />
                                        <label htmlFor="banner-upload-edit">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    document.getElementById("banner-upload-edit")?.click();
                                                }}
                                                className="flex items-center gap-2 w-full"
                                            >
                                                {t("actions.change")}
                                            </Button>
                                        </label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleBannerEdit}
                                            className="flex items-center gap-2 w-full"
                                        >
                                            <PencilIcon className="h-4 w-4 text-red-500" />
                                            {t("crop.edit")}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-orange-300 rounded-lg p-12 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                id="banner-upload"
                                accept="image/*"
                                onChange={handleBannerUpload}
                                className="hidden"
                            />
                            <label htmlFor="banner-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium hover:text-orange-600">
                                            {uploading ? t("upload.uploading") : t("upload.callToAction")}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t("upload.format")}
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4 justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            router.replace("/marketing/banners");
                        }}

                    >
                        {t("actions.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={isSubmitting || uploading}
                    >
                        {isSubmitting ? t("actions.saving") : t("actions.save")}
                    </Button>
                </div>
            </form>



            {cropModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{t("crop.title")}</h3>
                            <button
                                onClick={() => setCropModal((s) => ({ ...s, open: false }))}
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="relative h-96 w-full rounded-lg overflow-hidden border">
                            <Cropper
                                image={cropModal.imageSrc!}
                                crop={cropModal.crop}
                                zoom={cropModal.zoom}
                                rotation={cropModal.rotation}
                                aspect={16 / 9}
                                onCropChange={(c) => setCropModal((s) => ({ ...s, crop: c }))}
                                onZoomChange={(z) => setCropModal((s) => ({ ...s, zoom: z }))}
                                onRotationChange={(r) =>
                                    setCropModal((s) => ({ ...s, rotation: r }))
                                }
                                onCropComplete={(_, p) =>
                                    setCropModal((s) => ({ ...s, croppedAreaPixels: p }))
                                }
                            />
                        </div>
                        <div className="mt-4 space-y-4">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                {/* Control de Zoom */}
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-xs text-gray-500">{t("crop.zoom")}</label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={cropModal.zoom}
                                        onChange={(e) => setCropModal(s => ({ ...s, zoom: Number(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                    />
                                </div>

                                {/* Control de Rotación */}
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-xs text-gray-500">{t("crop.rotation")}</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCropModal(s => ({ ...s, rotation: (s.rotation - 90) % 360 }))}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                            title={t("crop.rotateLeft")}
                                        >
                                            <ArrowPathIcon className="w-5 h-5 text-gray-600 rotate-180" />
                                        </button>

                                        <input
                                            type="range"
                                            min={0}
                                            max={360}
                                            step={1}
                                            value={cropModal.rotation}
                                            onChange={(e) => setCropModal(s => ({ ...s, rotation: Number(e.target.value) }))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setCropModal(s => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                            title={t("crop.rotateRight")}
                                        >
                                            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-4">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                {t("crop.adjustText")}
                                <div className="flex gap-4 font-medium text-gray-800">
                                    <span>
                                        {t("crop.zoomValue", { value: cropModal.zoom.toFixed(1) })}
                                    </span>
                                    <span>
                                        {t("crop.rotationValue", { value: cropModal.rotation })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={() => setCropModal((s) => ({ ...s, open: false }))}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    {t("actions.cancel")}
                                </Button>
                                <Button
                                    onClick={applyCrop}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600"
                                >
                                    {t("crop.apply")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
