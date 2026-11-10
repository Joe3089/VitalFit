import { CheckCircle2, Circle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

export interface PackageOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  base_currency?: string;
  duration_days?: number;
}

interface PackageCardProps {
  pkg: PackageOption;
  isSelected: boolean;
  onClick: () => void;
}

export const PackageCard = ({ pkg, isSelected, onClick }: PackageCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={`
        relative group cursor-pointer transition-all duration-200 min-w-[220px] flex-1 flex flex-col
        border-2
        ${
          isSelected
            ? "border-orange-500 bg-orange-50/10 shadow-md"
            : "border-gray-200 hover:border-orange-200 hover:shadow-sm bg-white"
        }
      `}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle
            className="text-sm font-bold text-gray-900 truncate"
            title={pkg.name}
          >
            {pkg.name}
          </CardTitle>

          {/* Indicador visual de selección (Check vs Circulo vacío) */}
          <div className="text-orange-500 shrink-0">
            {isSelected ? (
              <CheckCircle2 size={18} className="fill-orange-100" />
            ) : (
              <Circle
                size={18}
                className="text-gray-300 group-hover:text-orange-300"
              />
            )}
          </div>
        </div>

        {pkg.duration_days && (
          <CardDescription className="text-xs text-gray-500 font-medium mt-1">
            Duración: {pkg.duration_days} días
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0  flex flex-col justify-between">
        <div className="mb-3 h-10">
          {pkg.description ? (
            <p
              className="text-xs text-gray-600 line-clamp-2 leading-relaxed"
              title={pkg.description}
            >
              {pkg.description}
            </p>
          ) : (
            <span className="text-xs text-gray-300 italic">
              Sin descripción adicional
            </span>
          )}
        </div>

        <div className="pt-3 border-t border-dashed border-gray-100 flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">
            ${pkg.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-semibold text-gray-500">
            {pkg.base_currency || "USD"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
