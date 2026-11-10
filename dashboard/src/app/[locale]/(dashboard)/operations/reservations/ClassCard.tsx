"use client";

import { CalendarIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/navigation";

interface Reservation {
    id: string;
    name: string;
    creationTime: string;
    avatar?: string;
    status: "confirmed" | "pending";
}

interface ClassCardProps {
    classId: string;
    title: string;
    date: string;
    enrolled: number;
    capacity: number;
    confirmedReservations: Reservation[];
    waitingList: Reservation[];
    status: "completed" | "active" | "cancelled";
}

export function ClassCard({
    classId,
    title,
    date,
    enrolled,
    capacity,
    confirmedReservations,
    waitingList,
    status,
}: ClassCardProps) {
    const router = useRouter();

    const occupancyPercentage = capacity ? (enrolled / capacity) * 100 : 0;

    // intentar extraer instructor (si existe en confirmedReservations[0]) y la sala a partir de `date`
    const instructor = confirmedReservations?.[0]?.name || "";
    const parts = date.split("*");
    const dateText = parts[0]?.trim() || date;
    const location = parts[1]?.trim() || "";

    // separar fecha y tiempo (si hay rango o hora) usando regex
    const timeMatch = dateText.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/) || dateText.match(/\d{1,2}:\d{2}/);
    const timePart = timeMatch ? timeMatch[0] : "";
    const datePart = timePart ? dateText.replace(timePart, "").replace(/\s+-\s+/, " ").trim() : dateText;

    return (
        <div className="border rounded-lg bg-white shadow-sm p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <p className="text-lg font-bold text-gray-900">{title}</p>
                    {instructor && <p className="text-sm text-gray-600 mt-1">{instructor}</p>}

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{datePart}</span>
                            </div>
                            {timePart && (
                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{timePart}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            {location && (
                                <>
                                    <MapPinIcon className="h-4 w-4" />
                                    <span className="text-sm text-gray-700">{location}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
                        <div className="w-3/4 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-orange-500 w-auto h-full transition-all duration-300"
                                style={{ width: `${occupancyPercentage}%` }}
                            />
                        </div>
                        <span className="w-auto text-xs">{enrolled} / {capacity}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-gray-700">
                            <Button
                                size="sm" variant="ghost"
                                className="border border-gray-500"
                                onClick={() => router.push(`reservations/${classId}`)}>
                                Ver detalles
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}