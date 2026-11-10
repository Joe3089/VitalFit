"use client";

import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User } from "@vitalfit/sdk";
import { api } from "@/lib/sdk-config";

import { useTranslations } from "next-intl";

type StepProps = {
  formData: any;
  handleChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  handleCustomChange: (field: string, value: any) => void;
  formErrors?: Record<string, string>;
  allBranchAdmins?: User[];
};

const horasApertura = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
];

const horasCierre = [
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
];

export default function Step3({
  formData,
  handleCustomChange,
  formErrors = {},
  allBranchAdmins = [],
}: StepProps) {
  const t = useTranslations("branches");

  const diasSemana = [
    { id: "lunes", label: t("create.form.admin.days.monday") },
    { id: "martes", label: t("create.form.admin.days.tuesday") },
    { id: "miercoles", label: t("create.form.admin.days.wednesday") },
    { id: "jueves", label: t("create.form.admin.days.thursday") },
    { id: "viernes", label: t("create.form.admin.days.friday") },
    { id: "sabado", label: t("create.form.admin.days.saturday") },
    { id: "domingo", label: t("create.form.admin.days.sunday") },
  ];

  const handleHorarioChange = (dia: string, campo: string, valor: any) => {
    const horarios = formData.horarios || {};
    const horarioDia = horarios[dia] || {
      apertura: "6:00 AM",
      cierre: "10:00 PM",
      cerrado: false,
    };

    handleCustomChange("horarios", {
      ...horarios,
      [dia]: {
        ...horarioDia,
        [campo]: valor,
      },
    });
  };

  const getHorarioDia = (dia: string) => {
    const horarios = formData.horarios || {};
    return (
      horarios[dia] || {
        apertura: "6:00 AM",
        cierre: "10:00 PM",
        cerrado: false,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {t("create.form.admin.title")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("create.form.admin.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              {t("create.form.admin.manager")}
            </span>
            <Select
              value={formData.manager_id || ""}
              onValueChange={(value) => handleCustomChange("manager_id", value)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder={t("create.form.admin.manager_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {allBranchAdmins.map((admin) => (
                  <SelectItem key={admin.user_id} value={admin.user_id}>
                    {`${admin.first_name} ${admin.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors?.["manager_id"] && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors["manager_id"]}
              </p>
            )}
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              {t("create.form.admin.capacity")}
            </span>
            <input
              type="number"
              value={formData.capacidadMiembros || ""}
              onChange={(e) =>
                handleCustomChange("capacidadMiembros", e.target.value)
              }
              placeholder={t("create.form.admin.capacity_placeholder")}
              min="1"
              className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${formErrors?.["capacidadMiembros"]
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-orange-500"
                }`}
            />
            {formErrors?.["capacidadMiembros"] && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors["capacidadMiembros"]}
              </p>
            )}
          </label>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
                  {t("create.form.admin.table.day")}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">
                  {t("create.form.admin.table.opening")}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">
                  {t("create.form.admin.table.closing")}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  {t("create.form.admin.table.closed")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {diasSemana.map((dia) => {
                const horario = getHorarioDia(dia.id);
                return (
                  <tr
                    key={dia.id}
                    className={horario.cerrado ? "bg-gray-50" : ""}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                      {dia.label}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <Select
                          value={horario.apertura}
                          onValueChange={(value) =>
                            handleHorarioChange(dia.id, "apertura", value)
                          }
                          disabled={horario.cerrado}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {horasApertura.map((hora) => (
                              <SelectItem
                                key={hora}
                                value={hora}
                                className="text-xs"
                              >
                                {hora}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <Select
                          value={horario.cierre}
                          onValueChange={(value) =>
                            handleHorarioChange(dia.id, "cierre", value)
                          }
                          disabled={horario.cerrado}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {horasCierre.map((hora) => (
                              <SelectItem
                                key={hora}
                                value={hora}
                                className="text-xs"
                              >
                                {hora}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={horario.cerrado}
                          onCheckedChange={(checked) =>
                            handleHorarioChange(dia.id, "cerrado", checked)
                          }
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
