"use client";

import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Membership } from "./data";
import { Button } from "@/components/ui/button";

interface ExpireFormProps {
  membership: Membership;
  onChange?: (field: keyof Membership, value: string) => void;
  mode?: "view" | "edit";
  errors?: Partial<Record<keyof Membership, string>>;
}

export default function ExpireForm({
  membership,
  errors = {},
  onChange = () => {},
  mode = "view",
}: ExpireFormProps) {
  const disabled = mode === "view";

  const handleChange = (field: keyof Membership, value: string) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-8">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">INFORMACIÓN DEL CLIENTE</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Nombre Completo</label>
            <Input
              value={membership.client}
              onChange={(e) => handleChange("client", e.target.value)}
              placeholder="Nombre del cliente"
              disabled={disabled}
            />
            {errors.client && <p className="text-sm text-red-500 mt-1">{errors.client}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Correo Electrónico</label>
            <Input
              value={membership.email || ""} 
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Membresía Adquirida</label>
            <Input
              value={membership.membership_name}
              onChange={(e) => handleChange("membership_name", e.target.value)}
              placeholder="Membresía adquirida"
              disabled={disabled}
            />
            {errors.membership_name && <p className="text-sm text-red-500 mt-1">{errors.membership_name}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Status</label>
            <Select
              value={membership.status}
              onValueChange={(value: Membership["status"]) => handleChange("status", value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="renewed">Renovado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status}</p>}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">DETALLES DEL PAGO</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Monto Total pendiente</label>
            <Input
              value={membership.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="Monto pendiente"
              disabled={disabled}
            />
            {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Fecha de Inicio</label>
            <Input
              value="2025-11-23 09:45:32" // Datos de ejemplo de la imagen
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Próximo pago</label>
            <Input
              value="2025-11-23 09:45:32" // Datos de ejemplo de la imagen
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Estado de la membresía</label>
            <Select
              value={membership.status}
              onValueChange={(value: Membership["status"]) => handleChange("status", value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de membresía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="renewed">Renovado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button>
          Enviar documento
        </Button>
      </div>
    </div>
  );
}