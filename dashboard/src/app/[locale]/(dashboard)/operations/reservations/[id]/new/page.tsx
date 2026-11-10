"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { api } from "@/lib/sdk-config";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { PaginatedBranch, BranchClassInfo, BranchInstructorInfo } from "@vitalfit/sdk";

export default function CreateInstructor() {
    const { token } = useAuth();

    const [branches, setBranches] = useState<PaginatedBranch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    type EnrichedClass = BranchClassInfo & { service_name?: string };
    const [classes, setClasses] = useState<EnrichedClass[]>([]);
    const [instructors, setInstructors] = useState<BranchInstructorInfo[]>([]);

    const [formData, setFormData] = useState({
        clase: "",
        sucursal: "",
        instructor: "",
        cliente: "",
        fecha: "",
        hora: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            console.warn("No estás autenticado. Por favor, inicia sesión nuevamente.");
            return;
        }
        console.warn("Datos de reserva:", formData);
    };

    useEffect(() => {
        const fetchBranches = async () => {
            if (!token){return;}
            try {
                const response = await api.branch.getBranches({ page: 1, limit: 50 }, token);
                setBranches(response.data);
            } catch (error) {
                console.error("Error al cargar sucursales:", error);
            }
        };

        fetchBranches();
    }, [token]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!token || !selectedBranch){return;}
            try {
                const response = await api.schedule.ListBranchesClass(selectedBranch, token);
                const enriched = await Promise.all(
                    response.data.map(async (clase) => {
                        try {
                            const service = await api.products.getServiceByID(clase.service_id, token);
                            return { ...clase, service_name: service.data.name };
                        } catch {
                            return { ...clase, service_name: clase.service_id };
                        }
                    })
                );
                setClasses(enriched);
            } catch (error) {
                console.error("Error al cargar clases:", error);
            }
        };
        fetchClasses();
    }, [selectedBranch, token]);

    type RawInstructor = {
        instructorID: string;
        instructor_name: string;
        email: string;
        phone: string;
    };

    useEffect(() => {
        const fetchInstructors = async () => {
            if (!token || !selectedBranch){return;}
            try {
                const response = await api.instructor.getBranchInstructors(
                    selectedBranch,
                    { page: 1, limit: 50 },
                    token
                );

                const adapted = response.data.map((instructor: any) => ({
                    instructorID: instructor.instructorID || instructor.instructor_id,
                    instructorName: instructor.instructor_name || instructor.name || instructor.instructorName,
                    email: instructor.email || "",
                    phone: instructor.phone || "",
                }));

                setInstructors(adapted);
            } catch (error) {
                console.error("Error al cargar instructores:", error);
            }
        };
        fetchInstructors();
    }, [selectedBranch, token]);

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
                <PageHeader
                    title="CREAR RESERVA"
                    subtitle="crear las reservas en pocos pasos"
                >
                    <Button variant="default" type="submit">Crear</Button>
                </PageHeader>
                <p className="text-md font-bold mb-3">Información Básica</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>
                        <Label htmlFor="clase">Clase</Label>
                        <Select
                            value={formData.clase}
                            onValueChange={(value) => handleChange("clase", value)}
                            disabled={!selectedBranch}
                        >
                            <SelectTrigger id="clase" className="w-full">
                                <SelectValue placeholder="Selecciona una clase" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((clase) => (
                                    <SelectItem key={clase.class_id} value={clase.class_id}>
                                        {clase.service_name ?? clase.service_id} { }
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="instructor">Instructor de planta</Label>
                        <Select
                            value={formData.instructor}
                            onValueChange={(value) => handleChange("instructor", value)}
                            disabled={!selectedBranch}
                        >
                            <SelectTrigger id="instructor" className="w-full">
                                <SelectValue placeholder="Selecciona un instructor" />
                            </SelectTrigger>
                            <SelectContent>
                                {instructors.map((instructor, index) => (
                                    <SelectItem
                                        key={`${instructor.instructorID}-${index}`}
                                        value={instructor.instructorID}
                                    >
                                        {instructor.instructorName || "Sin nombre"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="sucursal">Sucursal</Label>
                        <Select
                            value={selectedBranch}
                            onValueChange={(value) => {
                                setSelectedBranch(value);
                                handleChange("sucursal", value);
                            }}
                        >
                            <SelectTrigger id="sucursal" className="w-full">
                                <SelectValue placeholder="Selecciona una sucursal" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.branch_id} value={branch.branch_id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="cliente">Cliente</Label>
                        <Input
                            id="cliente"
                            value={formData.cliente}
                            onChange={(e) => handleChange("cliente", e.target.value)}
                            placeholder="Marta Perez"
                        />
                    </div>


                </div>
                <p className="text-md font-bold mb-3">Horario para la reserva</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="flex-col">
                        <Label htmlFor="fecha">Fecha</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={formData.fecha}
                            onChange={(e) => handleChange("fecha", e.target.value)}
                        />
                    </div>

                    <div className="flex-col">
                        <Label htmlFor="hora">Hora</Label>
                        <Input
                            id="hora"
                            type="time"
                            value={formData.hora}
                            onChange={(e) => handleChange("hora", e.target.value)}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}