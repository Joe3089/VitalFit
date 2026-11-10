"use client";

import { useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import InputField from "@/components/ui/InputField";
import { useTranslations } from "next-intl";

const MapboxPicker = dynamic(() => import("@/components/ui/MapboxPicker"), {
  ssr: false,
});

type StepProps = {
  formData: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  handleCustomChange: (field: string, value: unknown) => void;
  formErrors?: Record<string, string>;
};

export default function Step2({
  formData,
  handleChange,
  handleCustomChange,
  formErrors = {},
}: StepProps) {
  const t = useTranslations("branches");
  const [loading, setLoading] = useState(false);

  const handleMapSelect = (data: {
    latitud: string;
    longitud: string;
    address: string;
    city: string;
    state: string;
    country: string;
  }) => {
    handleCustomChange("latitud", data.latitud);
    handleCustomChange("longitud", data.longitud);

    const latNum = parseFloat(data.latitud);
    const lngNum = parseFloat(data.longitud);
    if (!isNaN(latNum)) { handleCustomChange("latitude", latNum); }
    if (!isNaN(lngNum)) { handleCustomChange("longitude", lngNum); }

    handleCustomChange("cityId", data.city);
    handleCustomChange("stateId", data.state);
    handleCustomChange("countryId", data.country);

    if (data.address) {
      handleCustomChange("address", data.address);
    }
  };

  const searchByAddress = async () => {
    if (!formData.address || formData.address.length < 5) {
      return;
    }
    setLoading(true);

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(formData.address)}.json?access_token=${token}&language=en&limit=1`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const f = data.features[0];
        const [lng, lat] = f.center;
        const ctx = f.context || [];

        const city = ctx.find((c: any) => c.id.includes("place"))?.text ||
          ctx.find((c: any) => c.id.includes("locality"))?.text || "";
        const state = ctx.find((c: any) => c.id.includes("region"))?.text ||
          ctx.find((c: any) => c.id.includes("place"))?.text || "";
        const country = ctx.find((c: any) => c.id.includes("country"))?.text || "";

        handleMapSelect({
          latitud: lat.toString(),
          longitud: lng.toString(),
          address: f.place_name,
          city: city,
          state: state,
          country: country,
        });
      }
    } catch (error) {
      console.error("Error buscando dirección:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {t("create.form.location.title")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("create.form.location.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-6 relative">
          <InputField
            label={t("create.form.location.address")}
            id="address"
            name="address"
            value={formData.address || ""}
            error={formErrors["address"]}
            onChange={handleChange}
            onBlur={searchByAddress}
            onKeyDown={(e: any) => e.key === "Enter" && searchByAddress()}
            placeholder={t("create.form.location.address_placeholder")}
            className="focus:ring-orange-500 focus:border-transparent pr-10"
          />
          <button
            type="button"
            onClick={searchByAddress}
            className="absolute right-3 top-[34px] text-orange-600 hover:text-orange-700 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin size-5" /> : <Search size={20} />}
          </button>
        </div>

        <div className="col-span-6 md:col-span-4">
          <InputField
            label={t("create.form.location.state")}
            id="stateId"
            name="stateId"
            value={formData.stateId || ""}
            readOnly
            className="bg-gray-50 text-gray-700"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <InputField
            label={t("create.form.location.country")}
            id="countryId"
            name="countryId"
            value={formData.countryId || ""}
            readOnly
            className="bg-gray-50 text-gray-700"
          />
        </div>

        <div className="col-span-6 flex items-center gap-2 mt-4">
          <MapPin className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-700">
            {t("create.form.location.gps_coords")}
          </span>
        </div>

        <div className="col-span-6 md:col-span-3">
          <InputField
            label={t("create.form.location.latitude")}
            id="latitud"
            name="latitud"
            value={formData.latitud || ""}
            readOnly
            className="bg-gray-50 text-gray-700"
          />
        </div>

        <div className="col-span-6 md:col-span-3">
          <InputField
            label={t("create.form.location.longitude")}
            id="longitud"
            name="longitud"
            value={formData.longitud || ""}
            readOnly
            className="bg-gray-50 text-gray-700"
          />
        </div>
      </div>

      <MapboxPicker
        lat={formData.latitud}
        lng={formData.longitud}
        onSelect={handleMapSelect}
      />
    </div>
  );
}