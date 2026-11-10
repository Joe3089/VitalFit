"use client";

import { useState, useMemo } from "react";
import { useServices } from "@/hooks/services/useServices";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceFullDetail } from "@vitalfit/sdk";
import { Input } from "@/components/ui/Input";

interface Props {
  token: string;
  onSelect: (service: ServiceFullDetail) => void;
  excludeIds: string[];
  placeholder: string;
}

export function ServiceGlobalSelector({
  token,
  onSelect,
  excludeIds,
  placeholder,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const { services, isLoading } = useServices(token, 1, {
    search: searchTerm,
    category: "all",
    limit: 100,
  });


  const available = useMemo(() => {
    return services.filter((s) => !excludeIds.includes(s.service_id));
  }, [services, excludeIds]);

  return (
    <Select
      onValueChange={(id) => {
        const found = services.find((s) => s.service_id === id);
        if (found) {
          onSelect(found);
          setSearchTerm("");
        }
      }}
    >
      <SelectTrigger className="bg-white h-10 shadow-sm">
        <SelectValue placeholder={isLoading ? "Cargando..." : placeholder} />
      </SelectTrigger>

      <SelectContent className="p-0 overflow-hidden">
        <div className="p-2 border-b bg-white">
          <Input
            placeholder="Buscar en catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          />
        </div>

        <div 
          key={excludeIds.join(",")} 
          className="max-h-[250px] overflow-y-auto overflow-x-hidden p-1"
        >
          {available.map((s) => (
            <SelectItem key={s.service_id} value={s.service_id}>
              {s.name}
            </SelectItem>
          ))}

          {available.length === 0 && !isLoading && (
            <div className="p-4 text-center text-xs text-muted-foreground italic">
              {searchTerm 
                ? "No se encontraron coincidencias" 
                : "No hay más servicios disponibles"}
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
}