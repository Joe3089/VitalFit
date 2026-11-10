"use client";
import { Users } from "@/models/users";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import EquipmentForm from "./UsersForm";
import { useState } from "react";

interface CreateUsersProps {
  onBack: () => void;
}

export default function CreateUser({ onBack }: CreateUsersProps) {
  const [formData, setFormData] = useState<Users>({
    id: "",
    name: "",
    lastname: "",
    email: "",
    phone: "",
    document: "",
    date: "",
    gender: "",
    rol: "client",
    status: "active",
    uacceso: "",
  });

  const handleChange = (field: keyof Users, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.warn("enviar formulario");
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded shadow">
      <form onSubmit={handleSubmit} className="space-y-2">
        <PageHeader title="REGISTRAR NUEVO USUARIO"></PageHeader>
        <p className="text-sm text-muted-foreground">
          Ingrese la información de un usuario
        </p>

        <EquipmentForm formData={formData} onChange={handleChange} />
        <div className="flex gap-8">
          <Button className="w-full" variant="secondary" onClick={onBack}>
            Cancelar
          </Button>
          <Button className="w-full" variant="default">
            Agregar Usuario
          </Button>
        </div>
      </form>
    </div>
  );
}
