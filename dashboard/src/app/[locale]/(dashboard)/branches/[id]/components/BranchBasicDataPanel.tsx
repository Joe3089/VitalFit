"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { MapPin } from "lucide-react";

import { BranchDetails, UpdateBranchRequest, User } from "@vitalfit/sdk";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { branchDetailsSchema } from "@/lib/validation/branchDetailsSchema";
import { UserRole } from "@/lib/roles";

import BranchSchedule from "@/components/modules/branches/details/BranchSchedule";
import { Alert, AlertDescription } from "@/components/ui/alert";
import InputField from "@/components/ui/InputField";
import { PhoneInput } from "@/components/ui/phone-input";
import MapboxPicker from "@/components/ui/MapboxPicker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BasicDataPanelProps {
  mode?: "view" | "edit";
  formData: BranchDetails;
  setFormData: React.Dispatch<React.SetStateAction<BranchDetails>>;
}

interface MapSelectData {
  latitud: string;
  longitud: string;
  address: string;
  state: string;
  country: string;
}

const toHHMMSS = (input?: string | null) => {
  if (!input) return "00:00:00";
  const s = input.trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}:00`;
  return "00:00:00";
};

export default function BranchBasicDataPanel({
  mode = "edit",
  formData,
  setFormData,
}: BasicDataPanelProps) {
  const t = useTranslations("branches");
  const [loading, setLoading] = useState(false);
  const [allBranchAdmins, setAllBranchAdmins] = useState<User[]>([]);
  const isViewMode = mode === "view";
  const { token, hasRole } = useAuth();

  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN);

  const currentManagerId = (formData as any).manager || "";
  const currentManagerFullName = (formData as any).manager_first_name
    ? `${(formData as any).manager_first_name} ${(formData as any).manager_last_name}`
    : "Seleccionar Manager";

  useEffect(() => {
    if (!token || !isSuperAdmin) return;
    const loadAdmins = async () => {
      try {
        const res = await api.user.getBranchAdmins(token);
        setAllBranchAdmins(res.data || []);
      } catch (error) {
        console.error("Error loading branch admins:", error);
      }
    };
    loadAdmins();
  }, [token, isSuperAdmin]);

  const transformDataForAPI = (data: BranchDetails): UpdateBranchRequest => {
    const opHours = data.operating_hours.map((h) => ({
      day_of_week: h.day_of_week,
      open_time: h.is_closed ? "00:00:00" : toHHMMSS(h.open_time),
      close_time: h.is_closed ? "00:00:00" : toHHMMSS(h.close_time),
      is_closed: h.is_closed,
    }));

    return {
      name: data.name,
      tax_id: data.tax_id,
      address: data.address,
      phone: (data.phone || "").replace(/\D/g, ""),
      status: data.status,
      state: data.state,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      max_capacity: data.max_capacity,
      manager_id:
        typeof (data as any).manager === "object"
          ? (data as any).manager?.user_id
          : (data as any).manager || "",
      operating_hours: opHours,
      payment_methods: [],
    };
  };

  const handleSaveChanges = async () => {
    const result = branchDetailsSchema.safeParse(formData);
    if (!result.success) {
      const messages = result.error.issues
        .map((issue) => `${String(issue.path[0])}: ${issue.message}`)
        .join("\n");
      toast.error(messages);
      return;
    }

    setLoading(true);
    try {
      const payload = transformDataForAPI(formData);
      await api.branch.updateBranch(formData.branch_id, payload, token || "");
      toast.success(t("details.basic.success_update"));
    } catch (err) {
      console.error(err);
      toast.error(t("details.basic.error_update"));
    } finally {
      setLoading(false);
    }
  };

  const handleManagerChange = (id: string) => {
    if (!isSuperAdmin) {
      return;
    }

    const selectedAdmin = allBranchAdmins.find((a) => a.user_id === id);

    setFormData((prev: any) => ({
      ...prev,
      manager: id,
      manager_first_name: selectedAdmin?.first_name || prev.manager_first_name,
      manager_last_name: selectedAdmin?.last_name || prev.manager_last_name,
    }));
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-gray-900">
          {t("details.basic.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t("details.basic.subtitle")}
        </p>

        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <InputField
            id="name"
            label={t("details.basic.name")}
            value={formData.name ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            readOnly={isViewMode}
          />
          <InputField
            id="taxId"
            label={t("details.basic.tax_id")}
            value={formData.tax_id ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tax_id: e.target.value }))
            }
            readOnly={isViewMode}
          />
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("details.basic.phone")}
            </label>
            <PhoneInput
              id="phone"
              name="phone"
              value={formData.phone ? (formData.phone.startsWith("+") ? formData.phone : `+${formData.phone}`) : ""}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, phone: value || "" }));
              }}
              disabled={isViewMode}
              defaultCountry="VE"
              className="w-full"
            />
          </div>
          <InputField
            id="maxCapacity"
            label={t("details.basic.capacity")}
            type="number"
            value={formData.max_capacity ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                max_capacity: Number(e.target.value),
              }))
            }
            readOnly={isViewMode}
          />

          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("details.basic.status")}
            </label>
            <Select
              value={formData.status ?? ""}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
              disabled={isViewMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">
                  {t("table.status.active")}
                </SelectItem>
                <SelectItem value="Inactive">
                  {t("table.status.inactive")}
                </SelectItem>
                <SelectItem value="Maintenance">
                  {t("table.status.maintenance")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("create.form.admin.manager")}
            </label>
            <Select
              value={currentManagerId}
              onValueChange={handleManagerChange}
              disabled={isViewMode || !isSuperAdmin}
            >
              <SelectTrigger
                className={
                  !isSuperAdmin && !isViewMode
                    ? "bg-gray-50 opacity-100 border-gray-200"
                    : ""
                }
              >
                <SelectValue placeholder={currentManagerFullName}>
                  {currentManagerFullName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {!isSuperAdmin ? (
                  <SelectItem value={currentManagerId}>
                    {currentManagerFullName}
                  </SelectItem>
                ) : (
                  allBranchAdmins.map((admin) => (
                    <SelectItem key={admin.user_id} value={admin.user_id}>
                      {`${admin.first_name} ${admin.last_name}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isSuperAdmin && !isViewMode && (
              <p className="text-[10px] text-orange-600 font-medium italic mt-1">
                * Solo un Super Administrador puede cambiar el encargado.
              </p>
            )}
          </div>
        </form>

        <Alert className="mt-6">
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>{t("details.basic.hint")}</AlertDescription>
        </Alert>
      </section>

      <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-900">
            {t("details.basic.location_title")}
          </h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {t("details.basic.location_subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-6">
            <InputField
              label={t("create.form.location.address")}
              value={formData.address || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              readOnly={isViewMode}
            />
          </div>

          <div className="md:col-span-3">
            <InputField
              label={t("create.form.location.state")}
              value={formData.state || ""}
              readOnly
              className="bg-slate-50 border-slate-200"
            />
          </div>
          <div className="md:col-span-3">
            <InputField
              label={t("create.form.location.country")}
              value={formData.country || ""}
              readOnly
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="md:col-span-3">
            <InputField
              label={t("create.form.location.latitude")}
              value={
                formData.latitude !== undefined ? String(formData.latitude) : ""
              }
              readOnly
              className="bg-slate-50 border-slate-200 font-mono text-xs font-bold"
            />
          </div>
          <div className="md:col-span-3">
            <InputField
              label={t("create.form.location.longitude")}
              value={
                formData.longitude !== undefined
                  ? String(formData.longitude)
                  : ""
              }
              readOnly
              className="bg-slate-50 border-slate-200 font-mono text-xs  font-bold"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <MapboxPicker
              key={`${formData.latitude}-${formData.longitude}`}
              lat={formData.latitude ? String(formData.latitude) : "10.4903"}
              lng={formData.longitude ? String(formData.longitude) : "-66.8835"}
              onSelect={(data: MapSelectData) => {
                if (isViewMode) {
                  return;
                }
                setFormData((prev) => ({
                  ...prev,
                  latitude: Number(data.latitud),
                  longitude: Number(data.longitud),
                  address: data.address || prev.address,
                  state: data.state || prev.state,
                  country: data.country || prev.country,
                }));
              }}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t("details.basic.schedule_title")}
        </h2>
        <BranchSchedule
          schedule={formData.operating_hours || []}
          onScheduleChange={(updatedSchedule: any) =>
            setFormData((prev) => ({
              ...prev,
              operating_hours: updatedSchedule,
            }))
          }
          mode={mode}
        />
      </section>

      {!isViewMode && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSaveChanges}
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading
              ? t("create.form.buttons.saving")
              : t("create.form.buttons.save")}
          </Button>
        </div>
      )}
    </div>
  );
}
