"use client";

import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useInstructors } from "@/hooks/instructor/useInstructors";
import { InstructorDataList } from "@vitalfit/sdk";
import { Input } from "@/components/ui/Input";

interface Props {
  token: string;
  onSelect: (instructor: InstructorDataList) => void;
  excludeIds: string[];
  placeholder: string;
}

export function InstructorGlobalSelector({ token, onSelect, excludeIds, placeholder }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useInstructors(token, 1, { 
    sort: "asc",
    search: searchTerm,
    limit: 100,
    skipSummary: true
  });

  const availableInstructors = data.filter(
    (i) => !excludeIds.includes(i.instructor_id)
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <Select 
        onValueChange={(id) => {
          const instructor = data.find((i) => i.instructor_id === id);
          if (instructor) {
            onSelect(instructor);
            setSearchTerm(""); 
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Cargando catálogo..." : placeholder} />
        </SelectTrigger>
        
        <SelectContent >
          <div className="p-2 border-b sticky top-0 bg-white z-10">
            <Input 
              placeholder="Escribe para buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => e.stopPropagation()} 
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading && data.length === 0 ? (
              <div className="p-4 text-xs text-center text-muted-foreground italic">
                Buscando instructores...
              </div>
            ) : availableInstructors.length === 0 ? (
              <div className="p-4 text-xs text-center text-muted-foreground">
                No hay instructores disponibles
              </div>
            ) : (
              availableInstructors.map((i) => (
                <SelectItem key={i.instructor_id} value={i.instructor_id}>
                  {i.first_name} {i.last_name}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}