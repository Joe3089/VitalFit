"use client";

import { useDropzone } from "react-dropzone";
import Cropper from "react-easy-crop";
import { useState, useEffect, useRef, useCallback } from "react";
import { getCroppedBlob } from "@/lib/cropImage";
import {
    DocumentPlusIcon,
    TrashIcon,
    EyeIcon,
    ScissorsIcon,
    XMarkIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
    StarIcon as StarIconSolid,
    EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";

type UploadedImage = {
    id: string;
    file: File;
    preview: string;
    originalPreview: string;
    croppedBlob?: Blob;
    croppedPreview?: string;
    status: "pending" | "cropped" | "uploading" | "uploaded" | "error";
    url?: string;
    error?: string;
    isPrimary?: boolean;
    order: number;
    description?: string;
};

export type ImageUploaderProps = {
    maxFiles?: number;
    aspect?: number;
    onChange?: (images: UploadedImage[]) => void;
    initialImages?: UploadedImage[];
    disableManualUpload?: boolean;
};

export default function ImageUploader({
    maxFiles = 10,
    aspect = 1,
    onChange,
    initialImages = [],
    disableManualUpload = false,
}: ImageUploaderProps) {
    const t = useTranslations("catalog.services.CreateService.ImageUploader");
    const imagePreviews = useRef<Map<string, string>>(new Map());
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (onChange) {
            onChange(images);
        }
    }, [images, onChange, hasInitialized]);

    useEffect(() => {
        if (!hasInitialized && initialImages.length > 0) {
            setImages(initialImages);
            setHasInitialized(true);
        }
    }, [initialImages, hasInitialized]);

    const [cropModal, setCropModal] = useState<{
        open: boolean;
        imageId?: string;
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

    const [previewModal, setPreviewModal] = useState<{
        open: boolean;
        imageSrc?: string;
        fileName?: string;
    }>({
        open: false,
    });

    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const createAndStorePreview = useCallback((file: File, id: string) => {
        const preview = URL.createObjectURL(file);
        const originalPreview = URL.createObjectURL(file);

        imagePreviews.current.set(`${id}_preview`, preview);
        imagePreviews.current.set(`${id}_original`, originalPreview);

        return { preview, originalPreview };
    }, []);

    const getPreview = useCallback((id: string, type = "preview") => {
        return imagePreviews.current.get(`${id}_${type}`);
    }, []);

    const onDrop = (acceptedFiles: File[]) => {
        const next = acceptedFiles
            .slice(0, maxFiles - images.length)
            .filter((file) => file && file.size > 0)
            .map((file, index) => {
                const id = crypto.randomUUID();
                const { preview, originalPreview } = createAndStorePreview(file, id);

                return {
                    id,
                    file,
                    preview,
                    originalPreview,
                    status: "pending" as const,
                    isPrimary: images.length === 0 && index === 0,
                    order: images.length + index,
                    description: "",
                };
            });

        const updated = [...images, ...next];

        const primaryCount = updated.filter((img) => img.isPrimary).length;
        if (primaryCount > 1) {
            updated.forEach((img, idx) => {
                img.isPrimary = idx === 0;
            });
        }

        setImages(updated);
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: { "image/*": [] },
        onDrop,
        multiple: true,
    });

    const openCrop = (img: UploadedImage) => {
        const imageToCrop = img.croppedPreview ? img.originalPreview : img.preview;

        setCropModal({
            open: true,
            imageId: img.id,
            imageSrc: imageToCrop,
            crop: { x: 0, y: 0 },
            zoom: 1,
            rotation: 0,
        });
    };

    const applyCrop = async () => {
        if (
            !cropModal.imageSrc ||
            !cropModal.croppedAreaPixels ||
            !cropModal.imageId
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

            const croppedPreview = URL.createObjectURL(blob);

            imagePreviews.current.set(`${cropModal.imageId}_cropped`, croppedPreview);

            setImages((prev) =>
                prev.map((img) =>
                    img.id === cropModal.imageId
                        ? {
                            ...img,
                            croppedBlob: blob,
                            croppedPreview: croppedPreview,
                            preview: croppedPreview,
                            status: "cropped" as const,
                        }
                        : img
                )
            );

            setCropModal((s) => ({ ...s, open: false }));
        } catch (error) {
            console.error("Error al recortar la imagen:", error);
            setCropModal((s) => ({ ...s, open: false }));
        }
    };

    const handleRevertCrop = (id: string) => {
        setImages((prev) =>
            prev.map((img) => {
                if (img.id === id && img.croppedPreview) {
                    URL.revokeObjectURL(img.croppedPreview);
                    imagePreviews.current.delete(`${id}_cropped`);

                    const originalPreview = getPreview(id, "original");

                    return {
                        ...img,
                        croppedBlob: undefined,
                        croppedPreview: undefined,
                        preview: originalPreview || img.originalPreview,
                        status: "pending" as const,
                    };
                }
                return img;
            })
        );
    };

    const handleRemove = (id: string) => {
        setImages((prev) => {
            const removedImg = prev.find((img) => img.id === id);
            const updated = prev
                .filter((img) => img.id !== id)
                .map((img, idx) => ({
                    ...img,
                    order: idx,
                }));

            if (removedImg) {
                URL.revokeObjectURL(removedImg.preview);
                URL.revokeObjectURL(removedImg.originalPreview);
                if (removedImg.croppedPreview) {
                    URL.revokeObjectURL(removedImg.croppedPreview);
                }

                imagePreviews.current.delete(`${id}_preview`);
                imagePreviews.current.delete(`${id}_original`);
                imagePreviews.current.delete(`${id}_cropped`);
            }

            if (removedImg?.isPrimary && updated.length > 0) {
                updated[0].isPrimary = true;
            }

            return updated;
        });
    };

    const handleSetPrimary = (id: string) => {
        setImages((prev) =>
            prev.map((img) => ({
                ...img,
                isPrimary: img.id === id,
            }))
        );
    };

    const reorderImages = (startIndex: number, endIndex: number) => {
        if (startIndex === endIndex) {
            return;
        }

        setImages((prev) => {
            const result = [...prev];
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);

            const reordered = result.map((img, idx) => ({
                ...img,
                order: idx,
            }));

            const primaryImages = reordered.filter((img) => img.isPrimary);
            if (primaryImages.length > 1) {
                reordered.forEach((img, idx) => {
                    img.isPrimary = idx === 0;
                });
            }

            return reordered;
        });
    };

    const handleDragStart = (
        e: React.DragEvent<HTMLDivElement>,
        index: number
    ) => {
        dragItem.current = index;
        setDraggingIndex(index);
        setIsDragging(true);

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());

        e.currentTarget.classList.add(
            "border-2",
            "border-dashed",
            "border-orange-400",
            "opacity-50"
        );
    };

    const handleDragOver = (
        e: React.DragEvent<HTMLDivElement>,
        index: number
    ) => {
        e.preventDefault();

        if (dragItem.current === null || dragItem.current === index) {
            return;
        }

        dragOverItem.current = index;

        const items = document.querySelectorAll("[data-draggable=\"true\"]");
        
        items.forEach((el) => {
            el.classList.remove(
                "border-t-4",
                "border-t-orange-500",
                "border-b-4",
                "border-b-orange-500",
                "pt-1",
                "pb-1"
            );
        });

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isOverTop = e.clientY < midpoint;

        if (isOverTop) {
            e.currentTarget.classList.add("border-t-4", "border-t-orange-500", "pt-1");
        } else {
            e.currentTarget.classList.add("border-b-4", "border-b-orange-500", "pb-1");
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove(
            "border-t-4",
            "border-t-orange-500",
            "border-b-4",
            "border-b-orange-500",
            "pt-1",
            "pb-1"
        );
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        const items = document.querySelectorAll("[data-draggable=\"true\"]");
        items.forEach((el) => {
            el.classList.remove(
                "border-2",
                "border-dashed",
                "border-blue-400",
                "opacity-50",
                "border-t-4",
                "border-t-blue-500",
                "border-b-4",
                "border-b-blue-500",
                "pt-1",
                "pb-1"
            );
        });

        if (dragItem.current !== null && dragItem.current !== index) {
            let targetIndex = index;

            if (e.currentTarget.classList.contains("border-t-4")) {
                targetIndex = index;
            } else if (e.currentTarget.classList.contains("border-b-4")) {
                targetIndex = index + 1;
                if (targetIndex > images.length) {
                    targetIndex = images.length;
                }
            }

            reorderImages(dragItem.current, targetIndex);
        }

        setIsDragging(false);
        setDraggingIndex(null);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggingIndex(null);
        dragItem.current = null;
        dragOverItem.current = null;

       const items = document.querySelectorAll("[data-draggable=\"true\"]");
        items.forEach((el) => {
            el.classList.remove(
                "border-2",
                "border-dashed",
                "border-blue-400",
                "opacity-50",
                "border-t-4",
                "border-t-blue-500",
                "border-b-4",
                "border-b-blue-500",
                "pt-1",
                "pb-1"
            );
        });
    };

    const handleContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const openPreview = (img: UploadedImage) => {
        const imageToShow = img.croppedPreview || img.preview;

        setPreviewModal({
            open: true,
            imageSrc: imageToShow,
            fileName: img.file?.name || img.url?.split("/").pop() || "Imagen",
        });
    };

    const updateDescription = (id: string, description: string) => {
        setImages((prev) =>
            prev.map((img) => (img.id === id ? { ...img, description } : img))
        );
    };

    useEffect(() => {
        return () => {
            imagePreviews.current.forEach((url, key) => {
                URL.revokeObjectURL(url);
            });
            imagePreviews.current.clear();

            images.forEach((img) => {
                URL.revokeObjectURL(img.preview);
                URL.revokeObjectURL(img.originalPreview);
                if (img.croppedPreview) {
                    URL.revokeObjectURL(img.croppedPreview);
                }
            });
        };
    }, []);

    const sortedImages = [...images].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-gradient-to-br from-gray-50/50 to-orange-50/30 hover:from-gray-50 hover:to-orange-50 transition-all duration-300 cursor-pointer hover:border-orange-400 hover:shadow-lg"
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <DocumentPlusIcon className="w-12 h-12 text-orange-500" />
                    <p className="text-gray-700 font-medium">{t("dropzone")}</p>
                </div>
            </div>

            {images.length > 0 && (
                <div
                    className="border rounded-lg overflow-hidden shadow-sm"
                    onDragOver={handleContainerDragOver}
                >
                    <div className="divide-y divide-gray-100">
                        {sortedImages.map((img, index) => (
                            <div
                                key={`${img.id}_${img.order}`}
                                data-draggable="true"
                                className={`relative flex items-center gap-4 p-4 hover:bg-gray-50 transition-all duration-200 group ${draggingIndex === index ? "opacity-50 bg-blue-50" : ""}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex p-0 ml-6 cursor-move text-gray-400">
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                    <EllipsisVerticalIcon className="w-5 h-5" />
                                </div>

                                <div className="relative w-16 h-16 flex-shrink-0">
                                    <img
                                        src={img.preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                                    />
                                    {img.isPrimary && (
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white p-0.5 rounded-full shadow-sm">
                                            <StarIconSolid className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-medium text-gray-800 truncate">
                                            {img.file?.name || img.url?.split("/").pop() || "Imagen"}
                                        </p>
                                        {img.isPrimary && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                <StarIconSolid className="w-3 h-3" />
                                                {t("primary")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${img.status === "pending"
                                                    ? "bg-gray-100 text-gray-800"
                                                    : img.status === "cropped"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-green-100 text-green-800"
                                                }`}
                                        >
                                            {t(`status.${img.status}`)}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={t("descriptionPlaceholder")}
                                        value={img.description || ""}
                                        className="w-full max-w-md mt-2 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => updateDescription(img.id, e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openPreview(img)}
                                        title={t("actions.view")}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => openCrop(img)}
                                        title={t("actions.crop")}
                                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                    >
                                        <ScissorsIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleRemove(img.id)}
                                        title={t("actions.remove")}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isDragging && (
                        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-sm text-blue-700 flex items-center gap-2 font-medium">
                            <EllipsisVerticalIcon className="w-4 h-4" />
                            {t("dropToReorder")}
                            <span className="text-xs bg-blue-200 px-2 py-0.5 rounded ml-auto">
                                {draggingIndex !== null
                                    ? t("movingImage", { index: draggingIndex + 1 })
                                    : t("dragging")}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {previewModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-semibold text-lg">
                                {t("previewModal.title")}
                            </h3>
                            <button onClick={() => setPreviewModal({ open: false })}>
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-center max-h-[70vh] overflow-auto">
                            <img
                                src={previewModal.imageSrc}
                                alt="Preview"
                                className="max-w-full rounded-lg shadow-lg"
                            />
                        </div>
                        <div className="p-4 border-t flex justify-between items-center bg-white text-sm text-gray-500">
                            {t("previewModal.helper")}
                            <button
                                onClick={() => setPreviewModal({ open: false })}
                                className="px-4 py-2 bg-gray-100 rounded-lg font-medium"
                            >
                                {t("previewModal.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cropModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg">{t("cropModal.title")}</h3>
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
                                aspect={aspect}
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
                                    <label className="text-xs text-gray-500">{t("cropModal.zoom")}</label>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={cropModal.zoom}
                                        onChange={(e) => setCropModal(s => ({ ...s, zoom: Number(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>

                                {/* Control de Rotación */}
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-xs text-gray-500">{t("cropModal.rotation")}</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCropModal(s => ({ ...s, rotation: (s.rotation - 90) % 360 }))}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                            title={t("cropModal.rotateLeft")}
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
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setCropModal(s => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                            title={t("cropModal.rotateRight")}
                                        >
                                            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="mt-4 flex flex-col gap-4">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                {t("cropModal.helper")}
                                <div className="flex gap-4 font-medium text-gray-800">
                                    <span>
                                        {t("cropModal.zoom")}: {cropModal.zoom.toFixed(1)}x
                                    </span>
                                    <span>
                                        {t("cropModal.rotation")}: {cropModal.rotation}°
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setCropModal((s) => ({ ...s, open: false }))}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    {t("cropModal.cancel")}
                                </button>
                                <button
                                    onClick={applyCrop}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
                                >
                                    {t("cropModal.apply")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
