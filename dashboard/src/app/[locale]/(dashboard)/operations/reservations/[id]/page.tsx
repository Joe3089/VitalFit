"use client";

import React from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/table/DataTable";
import { classesData } from "../data";

type Attendee = {
    id: number | string;
    name: string;
    className: string;
    checkinTime: string;
    status: "Confirmado" | "Pendiente" | "Cancelado";
};

export default function ReservationDetailPage() {
    const params = useParams();
    const reservationId = params?.id ?? "-";

    const [search, setSearch] = useState("");
    const [page, setPage] = useState<number>(1);

    const classItem = classesData.find((c) => c.classId === reservationId);

    const attendees: Attendee[] = (classItem?.confirmedReservations ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        className: classItem ? classItem.title : "",
        checkinTime: r.creationTime,
        status: r.status === "confirmed" ? "Confirmado" : "Pendiente",
    }));

    const filtered = attendees.filter((a) =>
        `${a.name} ${a.className}`.toLowerCase().includes(search.trim().toLowerCase()),
    );

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    // Si el filtro reduce las filas por debajo de la página actual, ajustamos la página
    React.useEffect(() => {
        if (page > totalPages){setPage(1);}
    }, [filtered.length, totalPages, page]);

    // reset page when changing to another reservation
    React.useEffect(() => {
        setPage(1);
    }, [reservationId]);

    const columns: Column<Attendee>[] = [
        { header: "Nombre del Usuario", accessor: "name" },
        { header: "Clase", accessor: "className" },
        { header: "Hora de Check-in", accessor: "checkinTime" },
        {
            header: "Estado",
            accessor: "status",
            render: (value) => {
                const cls =
                    value === "Confirmado"
                        ? "bg-green-100 text-green-800"
                        : value === "Pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800";
                return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
                        {value}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4">
                <PageHeader title="DETALLES DE RESERVA" subtitle={`ID: ${reservationId}`} />

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-6 mt-6 mb-6 border-b ">
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-bold">Fecha</p>
                                <p className="font-medium">lunes, 24 de noviembre</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Horario</p>
                                <p className="font-medium">7:00 - 8:00</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Reservados</p>
                                <p className="font-medium">18 / 20</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Ocupación</p>
                                <p className="font-medium">90%</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="w-full pl-10 pr-4"
                                placeholder="Filtrar por nombre"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <Button variant="outline" className="h-10 w-10 p-2">
                                <Download className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-lg font-semibold mb-3">Lista de Asistentes ({filtered.length})</p>

                    <div className="overflow-hidden">
                        <div className="p-4">
                            <DataTable
                                columns={columns}
                                data={filtered}
                                enableRowSelection={false}
                                page={page}
                                pageSize={pageSize}
                                totalPages={totalPages}
                                onPageChange={(p) => setPage(p)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}