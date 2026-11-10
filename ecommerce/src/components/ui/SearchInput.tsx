"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import TextInput from "@/components/ui/TextInput";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar Servicio...",
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      <TextInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
