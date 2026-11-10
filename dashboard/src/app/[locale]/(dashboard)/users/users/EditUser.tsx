"use client";

import type { Users } from "@/models/users";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import UsersForm from "./UsersForm";
import { useState } from "react";

interface EditUserProps {
  user: Users;
  onBack: () => void;
}

export default function EditUser({ user, onBack }: EditUserProps) {
  const normalizePhone = (phone: string) => phone.replace(/\s+/g, "");
  const [formData, setFormData] = useState<Users>({
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    phone: normalizePhone(user.phone),
    document: user.document,
    date: user.date,
    gender: user.gender,
    rol: user.rol,
    status: user.status,
    uacceso: user.uacceso,
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
        <PageHeader title="MODIFICAR USUARIO"></PageHeader>
        <p className="text-sm text-muted-foreground">
          información básica del usuario
        </p>
        <p className="text-sm text-muted-foreground">
          Modifica la información de un usuario
        </p>

        <UsersForm formData={formData} onChange={handleChange} edit={true} />
        <div className="flex gap-8">
          <Button className="w-full" variant="secondary" onClick={onBack}>
            Cancelar
          </Button>
          <Button className="w-full" variant="default">
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
