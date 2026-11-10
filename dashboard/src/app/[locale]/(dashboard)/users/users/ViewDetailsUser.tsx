"use client";
import type { Users } from "@/models/users";
import { roleLabels } from "@/models/users";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EyeIcon,
  PencilIcon,
  ComputerDesktopIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface ViewDetailsUserProps {
  user: Users;
  onBack: () => void;
}

export default function ViewDetailsUser({
  user,
  onBack,
}: ViewDetailsUserProps) {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded shadow">
      <PageHeader title="DETALLES DE USUARIOS">
        <Button variant="secondary" onClick={onBack}>
          Volver
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Información Personal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <strong>ID Usuario:</strong> {user.id}
            </div>
            <div>
              <strong>Estado:</strong>{" "}
              <span className="px-2 py-1 rounded-full border border-green-100 text-green-700 text-xs">
                {user.status === "active" ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div>
              <strong>Nombre Completo:</strong> {user.name} {user.lastname}
            </div>
            <div>
              <strong>Rol Asignado:</strong>
              <span className="px-2 py-1 rounded-full border border-orange-100 text-orange-700 text-xs">
                {roleLabels[user.rol] ?? "Rol desconocido"}
              </span>
            </div>
            <div>
              <strong>Correo electrónico:</strong> {user.email}
            </div>
            <div>
              <strong>Teléfono:</strong> {user.phone}
            </div>
            <div>
              <strong>ID:</strong> {user.document}
            </div>
            <div>
              <strong>Último Acceso:</strong> {user.uacceso}
            </div>
            <div>
              <strong>Fecha de creación:</strong>
              <CalendarIcon className="h-4 w-4 me-2" /> {user.date}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Acciones Rápidas
          </h2>
          <div className="border rounded-lg p-4 space-y-3">
            <Button variant="outline" className="w-full">
              <EyeIcon className="h-4 w-4" />
              Ver Registros de Actividades
            </Button>
            <Button variant="outline" className="w-full">
              <ComputerDesktopIcon className="h-4 w-4" />
              Ver Sesiones
            </Button>
            <Button variant="outline" className="w-full">
              <PencilIcon className="h-4 w-4" />
              Editar Usuario
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Información de sesiones
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 p-4 rounded shadow">
            <div className="text-sm text-gray-500">Sesiones Activas</div>
            <div className="text-2xl font-bold text-gray-800">2</div>
          </div>
          <div className="bg-gray-50 p-4 rounded shadow">
            <div className="text-sm text-gray-500">Total inicio de sesión</div>
            <div className="text-2xl font-bold text-gray-800">247</div>
          </div>
          <div className="bg-gray-50 p-4 rounded shadow">
            <div className="text-sm text-gray-500">Promedio Diario</div>
            <div className="text-2xl font-bold text-gray-800">3.5</div>
          </div>
        </div>
      </div>
    </div>
  );
}
