export interface Reservation {
    id: string;
    name: string;
    creationTime: string;
    avatar?: string;
    status: "confirmed" | "pending";
}

export interface ClassData {
    classId: string;
    title: string;
    date: string;
    dateISO?: string;
    enrolled: number;
    capacity: number;
    status: "completed" | "active" | "cancelled";
    confirmedReservations: Reservation[];
    waitingList: Reservation[];
}

export const classesData: ClassData[] = [
    {
        classId: "cardio-hiit-001",
        title: "Cardio HIIT",
        date: "Viernes 14 10:00-11:00 *Sala2",
        dateISO: "2025-11-14",
        enrolled: 30,
        capacity: 40,
        status: "completed",
        confirmedReservations: [
            {
                id: "1",
                name: "Ana López",
                creationTime: "8:00",
                status: "confirmed",
            },
            {
                id: "2",
                name: "Lucía Pérez",
                creationTime: "1:00",
                status: "confirmed",
            },
            {
                id: "3",
                name: "Blanca Fernández",
                creationTime: "1:30",
                status: "confirmed",
            },
        ],
        waitingList: [
            {
                id: "4",
                name: "Lucía Pérez",
                creationTime: "1:00",
                status: "pending",
            },
        ],
    },
    {
        classId: "pilates-002",
        title: "Pilates",
        date: "Viernes 14 12:00-13:00 *Sala1",
        dateISO: "2025-11-14",
        enrolled: 15,
        capacity: 20,
        status: "active",
        confirmedReservations: [
            {
                id: "5",
                name: "Carlos Rodríguez",
                creationTime: "9:30",
                status: "confirmed",
            },
            {
                id: "6",
                name: "María García",
                creationTime: "10:15",
                status: "confirmed",
            },
        ],
        waitingList: [
            {
                id: "7",
                name: "Pedro Martínez",
                creationTime: "11:45",
                status: "pending",
            },
        ],
    },
    {
        classId: "yoga-003",
        title: "Yoga",
        date: "Viernes 14 16:00-17:00 *Sala3",
        dateISO: "2025-11-14",
        enrolled: 25,
        capacity: 25,
        status: "active",
        confirmedReservations: [
            {
                id: "8",
                name: "Laura Sánchez",
                creationTime: "8:30",
                status: "confirmed",
            },
            {
                id: "9",
                name: "Diego Ramírez",
                creationTime: "14:20",
                status: "confirmed",
            },
            {
                id: "10",
                name: "Elena Torres",
                creationTime: "15:45",
                status: "confirmed",
            },
        ],
        waitingList: [],
    },
    {
        classId: "yoga-morning-004",
        title: "Yoga Matutino",
        date: "Lunes, 24 de noviembre 7:00 - 8:00 *Sala A",
        dateISO: "2025-11-24",
        enrolled: 18,
        capacity: 20,
        status: "active",
        confirmedReservations: [
            { id: "11", name: "María González", creationTime: "7:00", status: "confirmed" }
        ],
        waitingList: [],
    },
    {
        classId: "spinning-005",
        title: "Spinning",
        date: "Martes, 25 de noviembre 18:00 - 19:00 *Sala B",
        dateISO: "2025-11-25",
        enrolled: 12,
        capacity: 18,
        status: "active",
        confirmedReservations: [
            { id: "12", name: "Jorge Díaz", creationTime: "17:00", status: "confirmed" }
        ],
        waitingList: [],
    },
    {
        classId: "zumba-006",
        title: "Zumba",
        date: "Miercoles, 26 de noviembre 19:00 - 20:00 *Sala C",
        dateISO: "2025-11-26",
        enrolled: 22,
        capacity: 25,
        status: "active",
        confirmedReservations: [
            { id: "13", name: "Sofía Ruiz", creationTime: "18:00", status: "confirmed" }
        ],
        waitingList: [],
    },
    {
        classId: "pilates-007",
        title: "Pilates Intermedio",
        date: "Jueves, 27 de noviembre 10:00 - 11:00 *Sala1",
        dateISO: "2025-11-27",
        enrolled: 10,
        capacity: 16,
        status: "active",
        confirmedReservations: [
            { id: "14", name: "Daniela Vega", creationTime: "9:30", status: "confirmed" }
        ],
        waitingList: [],
    },
    {
        classId: "yoga-008",
        title: "Yoga Tarde",
        date: "Viernes, 05 de diciembre 16:00 - 17:00 *Sala3",
        dateISO: "2025-12-05",
        enrolled: 20,
        capacity: 25,
        status: "active",
        confirmedReservations: [
            { id: "15", name: "Carlos Méndez", creationTime: "15:45", status: "confirmed" }
        ],
        waitingList: [],
    },
    {
        classId: "crossfit-009",
        title: "CrossFit",
        date: "Sabado, 06 de diciembre 08:00 - 09:00 *Sala Cross",
        dateISO: "2025-12-06",
        enrolled: 14,
        capacity: 20,
        status: "active",
        confirmedReservations: [
            { id: "16", name: "Alberto Núñez", creationTime: "7:00", status: "confirmed" }
        ],
        waitingList: [],
    },
    {
        classId: "yoga-010",
        title: "Yoga Noche",
        date: "Lunes, 12 de enero 20:00 - 21:00 *Sala3",
        dateISO: "2026-01-12",
        enrolled: 9,
        capacity: 20,
        status: "active",
        confirmedReservations: [
            { id: "17", name: "Marina Salas", creationTime: "19:30", status: "confirmed" }
        ],
        waitingList: [],
    },
];