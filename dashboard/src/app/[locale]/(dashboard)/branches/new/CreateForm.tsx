"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { Country, State, City } from "@/models/location";
import { api } from "@/lib/sdk-config";
import { CreateBranchRequest, User } from "@vitalfit/sdk";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Wizard from "../Wizard";
import StepForm from "../StepForm";

interface BranchFromProps {
  allCountries: Country[];
  allStates: State[];
  allCities: City[];
}

import { useTranslations } from "next-intl";

export default function CreateForm({
  allCountries,
  allStates,
  allCities,
}: BranchFromProps) {
  const t = useTranslations("branches");
  const router = useRouter();
  // ... existing states ...
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [allBranchAdmins, setAllBranchAdmins] = useState<User[]>([]);
  const { token } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    countryId: "",
    stateId: "",
    cityId: "",
    status: "active",
    phone: "",
    address: "",
    latitude: 0,
    longitude: 0,
    administrator: "",
    manager_id: "",
    capacity: 0,
    capacidadMiembros: "",
    horarios: {},
    operatingHours: {},
  });

  const steps = [
    { id: 1, name: t("create.steps.basic.name"), description: t("create.steps.basic.description") },
    { id: 2, name: t("create.steps.location.name"), description: t("create.steps.location.description") },
    { id: 3, name: t("create.steps.admin.name"), description: t("create.steps.admin.description") },
    { id: 4, name: t("create.steps.confirm.name"), description: t("create.steps.confirm.description") },
  ];

  useEffect(() => {
    if (!token) {
      return;
    }
    async function loadAdmins() {
      setIsDataLoading(true);
      try {
        const adminsRes = await api.user.getBranchAdmins(token || "");
        setAllBranchAdmins(adminsRes.data || []);
      } catch (error) {
        console.error("Error cargando administradores:", error);
      } finally {
        setIsDataLoading(false);
      }
    }
    loadAdmins();
  }, [token]);

  const validateStep = (stepToValidate: number) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (stepToValidate === 1) {
      if (!formData.name?.trim()) {
        errors.name = t("validations.name_required");
        isValid = false;
      }
      if (!formData.taxId?.trim()) {
        errors.taxId = t("validations.tax_id_required");
        isValid = false;
      }
      if (!formData.status?.trim()) {
        errors.status = t("validations.status_required");
        isValid = false;
      }
    } else if (stepToValidate === 2) {
      if (!formData.address?.trim()) {
        errors.address = t("validations.address_required");
        isValid = false;
      }
      if (formData.latitude === 0 || formData.longitude === 0) {
        errors.latitude = t("validations.location_required");
        errors.longitude = t("validations.location_required");
        isValid = false;
      }
      if (!formData.countryId?.trim()) {
        errors.countryId = t("validations.country_required");
        isValid = false;
      }
      if (!formData.stateId?.trim()) {
        errors.stateId = t("validations.state_required");
        isValid = false;
      }
    } else if (stepToValidate === 3) {
      if (!formData.manager_id?.trim()) {
        errors.manager_id = t("validations.manager_required");
        isValid = false;
      }
      if (
        !formData.capacidadMiembros ||
        Number(formData.capacidadMiembros) <= 0
      ) {
        errors.capacidadMiembros = t("validations.capacity_required");
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const toHHMMSS = (input?: string | null) => {
      if (!input) {
        return "00:00:00";
      }
      const s = input.trim();
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) {
        return s;
      }
      const hm = /^(\d{1,2}):(\d{2})$/.exec(s);
      if (hm) {
        return `${hm[1].padStart(2, "0")}:${hm[2]}:00`;
      }
      const ampm = /^(\d{1,2}):(\d{2})(?:\s*)(AM|PM)$/i.exec(s);
      if (ampm) {
        let hh = Number(ampm[1]);
        const mm = ampm[2];
        const period = ampm[3].toUpperCase();
        if (period === "PM" && hh < 12) {
          hh += 12;
        }
        if (period === "AM" && hh === 12) {
          hh = 0;
        }
        return `${hh.toString().padStart(2, "0")}:${mm}:00`;
      }
      return "00:00:00";
    };

    const dayMap: Record<string, string> = {
      lunes: "Monday",
      martes: "Tuesday",
      miercoles: "Wednesday",
      jueves: "Thursday",
      viernes: "Friday",
      sabado: "Saturday",
      domingo: "Sunday",
    };

    const horariosRecord = (formData.horarios as Record<string, any>) || {};
    const daysOrder = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];

    const operating_hours = daysOrder.map((dayKey) => {
      const h = horariosRecord[dayKey] || {
        apertura: "00:00",
        cierre: "00:00",
        cerrado: true,
      };
      const isClosed = !!h.cerrado;
      return {
        day_of_week: dayMap[dayKey],
        open_time: isClosed ? "00:00:00" : toHHMMSS(h.apertura),
        close_time: isClosed ? "00:00:00" : toHHMMSS(h.cierre),
        is_closed: isClosed,
      };
    });

    const statusMap: Record<string, string> = {
      active: "Active",
      inactive: "Inactive",
      maintenance: "Maintenance",
    };

    const rawStatus = (formData.status || "Active").toString();
    const normalizedStatus =
      statusMap[rawStatus.toLowerCase()] ??
      rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

    const apiPayload: CreateBranchRequest = {
      name: formData.name?.trim() || "",
      tax_id: formData.taxId?.trim() || "",
      address: formData.address?.trim() || "",
      phone: (formData.phone || "").replace(/\D/g, ""),
      country: formData.countryId?.trim() || "",
      state: formData.stateId?.trim() || "",
      latitude:
        typeof formData.latitude === "number"
          ? formData.latitude
          : parseFloat(formData.latitude as any) || 0,
      longitude:
        typeof formData.longitude === "number"
          ? formData.longitude
          : parseFloat(formData.longitude as any) || 0,
      manager_id: formData.manager_id || "",
      max_capacity:
        formData.capacidadMiembros && !isNaN(Number(formData.capacidadMiembros))
          ? Number(formData.capacidadMiembros)
          : formData.capacity || 0,
      operating_hours: operating_hours,
      status: normalizedStatus,
    };

    if (
      !apiPayload.name ||
      !apiPayload.tax_id ||
      !apiPayload.country ||
      !apiPayload.state
    ) {
      alert(t("notifications.error_required"));
      return;
    }


    api.branch
      .createBranch(apiPayload, token || "")
      .then((data) => {
        router.push("/branches?status=success");
      })
      .catch((err) => {
        console.error("Error creando sucursal:", err);
        alert("Error al crear sucursal: " + (err?.message || String(err)));
      });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const processedValue = type === "number" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleCustomChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto overflow-y-auto ">
      <CardHeader className="sticky top-0 bg-white z-10 pt-6 pb-4 border-b">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-2xl font-bold text-gray-800">
            {t("create.title")}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Image
              src="/images/logo-vitalfit.png"
              alt="Logo Vitalfit"
              width={148}
              height={40}
              priority
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-4">
        <p className="text-sm text-gray-600 mb-6">
          {t("create.subtitle")}
        </p>
        <Wizard steps={steps} currentStep={currentStep} />

        <div className="mt-8">
          <StepForm
            step={currentStep}
            formData={formData}
            handleChange={handleChange}
            handleCustomChange={handleCustomChange}
            formErrors={formErrors}
            allBranchAdmins={allBranchAdmins}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between px-6 pb-6 border-t pt-6">
        <Button
          onClick={handleBack}
          disabled={currentStep === 1}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t("create.form.buttons.back")}
        </Button>
        <Button
          onClick={currentStep === steps.length ? handleSubmit : handleNext}
          className="flex items-center gap-2"
        >
          {currentStep === steps.length ? (
            t("create.form.buttons.create")
          ) : (
            <>
              {t("create.form.buttons.next")}
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </div>
  );
}
