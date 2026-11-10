"use client";
import { useState, useEffect, useCallback } from "react";
import { Column, DataTable } from "@/components/ui/table/DataTable";
import { RowActions } from "@/components/ui/table/RowActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { Download, Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/sdk-config";
import { Banner } from "@vitalfit/sdk";

import { GeneralAlertDialog } from "@/components/ui/GeneralAlertDialog";

import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface StatsData {
    total: number;
    active: number;
}

interface BannersTableProps {
    onBannerUpdate?: (stats: StatsData) => void;
}

export default function BannersTable({ onBannerUpdate }: BannersTableProps) {
    const [data, setData] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
    const { token } = useAuth();
    const router = useRouter();
    const t = useTranslations("banners");

    const [filters, setFilters] = useState({
        search: "",
    });
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    const [stats, setStats] = useState<StatsData>({ total: 0, active: 0 });



    const loadBanners = useCallback(async () => {
        if (!token) {
            return;
        }

        try {
            setLoading(true);
            const response = await api.marketing.getBanner(token);
            const banners = response.data || [];
            setData(banners);


        } catch (error) {
            console.error("Error cargando banners:", error);
            toast.error(t("notifications.errorTitle"), {
                description: t("errors.load"),
            });
        } finally {
            setLoading(false);
        }
    }, [token, pageSize]);

    useEffect(() => {
        if (token) {
            loadBanners();
        }
    }, [token, loadBanners]);

    useEffect(() => {
        const getFilteredDataLocal = () => {
            let filtered = data;

            if (filters.search) {
                filtered = filtered.filter((banner) => {
                    return banner.name?.toLowerCase().includes(filters.search.toLowerCase()) ?? false;
                });
            }

            return filtered;
        };

        const filteredData = getFilteredDataLocal();
        const newStats = {
            total: filteredData.length,
            active: filteredData.filter((banner) => {
                return banner.is_active;
            }).length,
        };

        setStats(newStats);

        if (onBannerUpdate) {
            onBannerUpdate(newStats);
        }
    }, [data, filters, onBannerUpdate]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput.trim() === "") {
                if (filters.search !== "") {
                    setFilters((prev) => {
                        return { ...prev, search: "" };
                    });
                }
            } else if (searchInput !== filters.search) {
                setFilters((prev) => {
                    return { ...prev, search: searchInput };
                });
            }
        }, 500);

        return () => {
            clearTimeout(timeout);
        };
    }, [searchInput, filters.search]);

    const getFilteredData = () => {
        let filtered = data;

        if (filters.search) {
            filtered = filtered.filter((banner) => {
                return banner.name?.toLowerCase().includes(filters.search.toLowerCase()) ?? false;
            });
        }

        return filtered;
    };

    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    const handleView = (row: Banner) => {
        router.replace(`/marketing/banners/${row.banner_id}`);
    };

    const handleEdit = (row: Banner) => {
        router.replace(`/marketing/banners/${row.banner_id}/edit`);
    };

    const handleToggleActive = async (banner: Banner) => {
        if (!token) {
            return;
        }

        try {
            await api.marketing.updateBanner(
                banner.banner_id || "",
                {
                    name: banner.name,
                    image_url: banner.image_url,
                    link_url: banner.link_url,
                    is_active: !banner.is_active,
                },
                token
            );

            toast.success(t("notifications.successTitle"), {
                description: !banner.is_active ? t("notifications.activateSuccess") : t("notifications.deactivateSuccess"),
            });

            setTimeout(() => {
                loadBanners();
            }, 1000);
        } catch (error) {
            console.error("Error al actualizar el banner:", error);
            toast.error(t("notifications.errorTitle"), {
                description: t("notifications.updateStatusError"),
            });
        }
    };

    const handleDeleteBanner = async (banner: Banner) => {
        if (!token) {
            setDeleteRowId(null);
            return;
        }
        try {
            await api.marketing.deleteBanner(banner.banner_id || "", token);

            toast.success(t("notifications.successTitle"), {
                description: t("notifications.deleteSuccess"),
            });

            setDeleteRowId(null);

            setTimeout(() => {
                loadBanners();
            }, 1000);
        } catch (error) {
            console.error("Error al eliminar el banner:", error);
            setDeleteRowId(null);

            toast.error(t("notifications.errorTitle"), {
                description: t("notifications.deleteError"),
            });
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };



    const visibleColumns: Column<Banner>[] = [
        {
            header: t("table.headers.image"),
            accessor: "image_url",
            render: (imageUrl) => {
                return (
                    <div className="flex items-center justify-center">
                        <img
                            src={imageUrl as string}
                            alt="Banner"
                            className="w-16 h-16 object-cover rounded border"
                        />
                    </div>
                );
            },
        },
        {
            header: t("table.headers.name"),
            accessor: "name",
            filterType: "text",
        },
        {
            header: t("table.headers.link"),
            accessor: "link_url",
            render: (linkUrl) => {
                return (
                    <div className="max-w-[200px] truncate text-sm">
                        {linkUrl as string}
                    </div>
                );
            },
        },
        {
            header: t("table.headers.status"),
            accessor: "is_active",
            render: (isActive, row) => {
                return (
                    <div className="flex justify-center">
                        <Switch
                            checked={isActive as boolean}
                            onCheckedChange={() => {
                                handleToggleActive(row);
                            }}
                        />
                    </div>
                );
            },
        },
    ];

    if (loading && data.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">{t("table.loading")}</div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative w-full sm:w-[250px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t("table.searchPlaceholder")}
                            className="pl-9"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={loadBanners} disabled={loading}>
                        <Download className="mr-2 h-4 w-4" />
                        {loading ? t("table.downloading") : t("table.download")}
                    </Button>
                </div>
            </div>

            <DataTable<Banner>
                key={`banners-${filteredData.length}-${filters.search}`}
                columns={visibleColumns}
                data={filteredData}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                totalPages={totalPages}
                rowIdKey="banner_id"
                actions={(row) => {
                    return (
                        <div className="flex flex-col items-center justify-center w-full">
                            <RowActions
                                actions={[
                                    {
                                        label: t("table.actions.view"), icon: Eye, onClick: () => {
                                            handleView(row);
                                        }
                                    },
                                    {
                                        label: t("table.actions.modify"),
                                        icon: Pencil,
                                        onClick: () => {
                                            handleEdit(row);
                                        },
                                    },
                                    {
                                        label: t("table.actions.delete"),
                                        icon: Trash2,
                                        onClick: () => {
                                            setDeleteRowId(row.banner_id || null);
                                        },
                                        variant: "danger",
                                        separatorBefore: true,
                                    },
                                ]}
                            />
                            {deleteRowId === row.banner_id && (
                                <GeneralAlertDialog
                                    open={deleteRowId === row.banner_id}
                                    onOpenChange={(open) => {
                                        if (!open) {
                                            setDeleteRowId(null);
                                        }
                                    }}
                                    trigger={null}
                                    title={t("table.deleteDialog.title")}
                                    description={t("table.deleteDialog.description")}
                                    actionText={t("table.deleteDialog.action")}
                                    cancelText={t("table.deleteDialog.cancel")}
                                    onAction={() => {
                                        handleDeleteBanner(row);
                                    }}
                                    actionVariant="destructive"
                                />
                            )}
                        </div>
                    );
                }}
            />


        </>
    );
}
