import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export default function UnderConstruction() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        <Construction className="h-32 w-32 text-muted-foreground" />

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            En Construcción
          </h1>
          <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
            Estamos trabajando duro para habilitar este módulo.
            <br />
            Pronto estará disponible para el equipo.
          </p>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Volver al Dashboard</Link>
          </Button>

          <Button asChild>
            <Link href="/">Ir al Inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
