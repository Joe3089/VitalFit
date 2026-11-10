"use client";
import { useTranslations } from "next-intl"; 
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstructorDataList } from "@vitalfit/sdk";
import {
  InstructorFormData,
  validateInstructorField, 
} from "@/lib/validation/instructorSchema";

interface CategoryOption {
  category_id: string;
  name: string;
}

type ExtendedInstructorData = InstructorDataList & {
  specialties?: any[];
  biography?: string;
};

interface InstructorFormProps {
  formData: InstructorDataList;
  onChange: (field: keyof InstructorDataList, value: any) => void;
  mode?: "view" | "edit";
  disabled?: boolean;
  errors?: Partial<Record<keyof InstructorFormData, string>>;

  setErrors?: (errors: any) => void; 
  onFieldBlur?: (field: keyof InstructorDataList, value: string) => void;
  categories?: CategoryOption[];
}

export default function InstructorForm({
  formData,
  onChange,
  mode = "view",
  errors = {},
  onFieldBlur,
  categories = [],
}: InstructorFormProps) {
  const t = useTranslations("catalog.instructor.form");
  const data = formData as ExtendedInstructorData;
  const isView = mode === "view";

  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) {
      return "";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())){
       return dateString;
    }
    return date.toISOString().split("T")[0];
  };

  const handleBlur = (field: keyof InstructorDataList, value: string) => {
    validateInstructorField(field, value, t);

    if (onFieldBlur) {
      onFieldBlur(field, value);
    }
  };

  const getFieldError = (field: keyof InstructorFormData): string | undefined => {
    return errors[field];
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="flex-1">
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.first_name")}*
          </label>
          <Input
            id="first_name"
            disabled={isView}
            placeholder={t("placeholders.first_name")}
            value={data.first_name}
            onChange={(e) => onChange("first_name", e.target.value)}
            onBlur={(e) => handleBlur("first_name", e.target.value)}
            className={`bg-white w-full ${getFieldError("first_name") ? "border-red-500" : ""}`}
          />
          {getFieldError("first_name") && (
            <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("first_name")}</p>
          )}
        </div>

        <div className="flex-1">
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.last_name")}*
          </label>
          <Input
            id="last_name"
            disabled={isView}
            placeholder={t("placeholders.last_name")}
            value={data.last_name}
            onChange={(e) => onChange("last_name", e.target.value)}
            onBlur={(e) => handleBlur("last_name", e.target.value)}
            className={`bg-white w-full ${getFieldError("last_name") ? "border-red-500" : ""}`}
          />
          {getFieldError("last_name") && (
            <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("last_name")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
        <div className="flex-1">
          <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.identity_document")}*
          </label>
          <Input
            id="documento"
            disabled={isView}
            placeholder={t("placeholders.identity_document")}
            value={data.identity_document}
            onChange={(e) => onChange("identity_document", e.target.value)}
            onBlur={(e) => handleBlur("identity_document", e.target.value)}
            className={`bg-white w-full ${getFieldError("identity_document") ? "border-red-500" : ""}`}
          />
          {getFieldError("identity_document") && (
            <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("identity_document")}</p>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.specialties")}
          </label>
          {(() => {
            const raw = data.specialties;
            let selectedValue = "";
            if (Array.isArray(raw) && raw.length > 0) {
              selectedValue = raw[0]?.category_id ?? raw[0]?.specialty_id ?? String(raw[0] ?? "");
            } else if (typeof raw === "string") {
              selectedValue = raw;
            }

            return (
              <Select
                onValueChange={(val) => {
                  onChange("specialties" as any, [{ category_id: val }]);
                  handleBlur("specialties" as any, val);
                }}
                value={selectedValue}
                disabled={isView}
              >
                <SelectTrigger className={`w-full bg-white ${getFieldError("specialties" as any) ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={t("placeholders.select_specialty")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {categories.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
          {getFieldError("specialties" as any) && (
             <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("specialties" as any)}</p>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
          {t("labels.biography")}
        </label>
        <Textarea
          disabled={isView}
          className={`w-full rounded-md border px-3 py-2 resize-vertical h-24 ${getFieldError("biography" as any) ? "border-red-500" : "border-gray-200"}`}
          value={data.biography ?? ""}
          onChange={(e) => onChange("biography" as any, e.target.value)}
          onBlur={(e) => handleBlur("biography" as any, e.target.value)}
        />
        {getFieldError("biography" as any) && (
          <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("biography" as any)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.email")}*
          </label>
          <Input
            id="email"
            type="email"
            disabled={isView}
            placeholder={t("placeholders.email")}
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            className={`bg-white w-full ${getFieldError("email") ? "border-red-500" : ""}`}
          />
          {getFieldError("email") && <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("email")}</p>}
        </div>
        <div className="flex-1">
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.phone")}*
          </label>
          <PhoneInput
            id="telefono"
            disabled={isView}
            value={data.phone}
            defaultCountry="VE"
            onChange={(value) => {
              onChange("phone", value);
              handleBlur("phone", value);
            }}
            className={getFieldError("phone") ? "border-red-500 rounded-md" : ""}
          />
          {getFieldError("phone") && <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("phone")}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="flex-1">
          <label htmlFor="nacimiento" className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.birth_date")}*
          </label>
          <Input
            id="nacimiento"
            type="date"
            disabled={isView}
            value={formatDateForBackend(data.birth_date)}
            onChange={(e) => onChange("birth_date", e.target.value)}
            onBlur={(e) => handleBlur("birth_date", e.target.value)}
            className={`bg-white w-full ${getFieldError("birth_date") ? "border-red-500" : ""}`}
          />
          {getFieldError("birth_date") && (
            <p className="text-red-500 text-xs mt-1 text-left">{getFieldError("birth_date")}</p>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 sm:text-base text-left">
            {t("labels.gender")}*
          </label>
          <div className="space-y-2 mt-2">
            {[
              { id: "male", label: t("gender_options.male") },
              { id: "female", label: t("gender_options.female") },
              { id: "prefer-not-to-say", label: t("gender_options.other") }
            ].map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  disabled={isView}
                  type="radio"
                  name="genero"
                  value={option.id}
                  checked={data.gender === option.id}
                  onChange={() => {
                    onChange("gender", option.id);
                    handleBlur("gender", option.id);
                  }}
                  className="form-radio h-4 w-4 text-primary"
                />
                <span className="ml-2 text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {getFieldError("gender") && (
            <p className="text-red-500 text-xs mt-2 text-left">{getFieldError("gender")}</p>
          )}
        </div>
      </div>
    </>
  );
}