"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export default function ForbiddenError() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
            <h1 className="text-9xl font-bold text-gray-900">403</h1>
            <p className="mt-4 text-lg font-bold text-gray-900">Acceso Prohibido</p>
            <p className="mt-2 max-w-md text-gray-500">
                No tienes el permiso necesario para ver este recurso.
            </p>
            <div className="mt-8 flex gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    Volver
                </Button>
                <Button variant="secondary" onClick={() => router.replace("/")}>
                    Volver a Inicio
                </Button>
            </div>
        </div>
    );
}
