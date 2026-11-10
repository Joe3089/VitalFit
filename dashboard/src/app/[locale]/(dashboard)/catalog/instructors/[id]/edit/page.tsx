"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  UserGender,
  InstructorDataList,
  ServiceCategoryInfo,
} from "@vitalfit/sdk";
import { Instructor } from "@/models/instructor";
import { useAuth } from "@/context/AuthContext";
import {
  validateInstructor,
  validateInstructorField,
  InstructorFormData,
} from "@/lib/validation/instructorSchema";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import InstructorForm from "@/components/modules/instructor/InstructorForm";
import { useRouter } from "@/i18n/navigation";

export default function EditInstructorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.instructor.form");

  const [instructor, setInstructor] = useState<InstructorDataList | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof InstructorFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<Array<{ category_id: string; name: string }>>([]);

  useEffect(() => {
    if (!id || !token) {
      return;
    }
    const loadInstructor = async () => {
      try {
        setLoading(true);
        const response = await api.instructor.getInstructorById(id, token);
        let data = response.data ?? response;

        if (data?.specialties && Array.isArray(data.specialties) && data.specialties.length > 0) {
          const lastSpecialty = data.specialties[data.specialties.length - 1];
          data.specialties = [lastSpecialty];
        }

        setInstructor(data);
      } catch (err) {
        console.error(err);
        toast.error(t("errors.load_error") || "No se pudo cargar el instructor.");
      } finally {
        setLoading(false);
      }
    };
    loadInstructor();
  }, [id, token, t]);

  useEffect(() => {
    if (!token){
       return;
    }
    let mounted = true;
    const loadCategories = async () => {
      try {
        const res = await api.products.getCategories(token);
        const categories = (res?.data ?? []) as ServiceCategoryInfo[];
        if (!mounted) {
          return;
        }
        setCategoriesOptions(
          categories.map((cat) => ({
            category_id: cat.category_id,
            name: cat.name,
          }))
        );
      } catch (err) {
        console.warn(err);
      }
    };
    loadCategories();
    return () => { mounted = false; };
  }, [token]);

  const formatDateForBackend = (dateString: string): string => {
    if (!dateString) {
      return "";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0];
  };

  const mapGenderToEnum = (gender: string): UserGender => {
    switch (gender) {
      case "male": return UserGender.male;
      case "female": return UserGender.female;
      case "prefer-not-to-say": return UserGender.preferNotToSay;
      default: return UserGender.preferNotToSay;
    }
  };

  const handleChange = (field: keyof InstructorDataList, value: any) => {
    setInstructor((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field as keyof InstructorFormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: keyof InstructorDataList, value: string) => {

    const result = validateInstructorField(field, value, t);
    if (!result.success && result.error) {
      setErrors((prev) => ({ ...prev, [field]: result.error }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructor || !token) {
      return;
    }


    const validationResult = validateInstructor(instructor, t);
    if (!validationResult.success) {
      const newErrors: Partial<Record<keyof InstructorFormData, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof InstructorFormData;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      toast.error(t("errors.check_fields"));
      return;
    }

    setErrors({});
    setIsLoading(true);

    const payload: Instructor = {
      ...instructor,
      birth_date: formatDateForBackend(instructor.birth_date),
      gender: mapGenderToEnum(instructor.gender),
      biography: instructor.biography || "",
      profile_picture_url: instructor.profile_picture_url || "",
    } as Instructor;

    try {
      await api.instructor.updateInstructor(instructor.instructor_id, payload, token);

      const specialtyVal = (instructor as any).specialties;
      if (specialtyVal) {
        const selected = Array.isArray(specialtyVal) ? specialtyVal[0] : specialtyVal;
        const selectedId = typeof selected === "string" ? selected : (selected?.category_id || selected?.specialty_id);
        
        if (selectedId) {
          await api.instructor.addSpecialty(instructor.instructor_id, [selectedId], token);
        }
      }

      toast.success(t("create.success_update") || "¡Instructor actualizado!");
      setTimeout(() => router.push("/catalog/instructors"), 1500);
      
    } catch (err: any) {
      console.error(err);
      if (err?.messages?.[0] === "conflict") {
        toast.error(t("errors.conflict"));
      } else {
        toast.error(err?.error || t("errors.server_error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">{t("loading") || "Cargando..."}</div>;
  }
  if (!instructor) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PageHeader
          title={t("edit_title") || "Editar Instructor"}
          subtitle={`${t("edit_subtitle") || "Modificando a"}: ${instructor.first_name} ${instructor.last_name}`}
          actionButton={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.push("/catalog/instructors")}
                disabled={isLoading}
              >
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" variant="default" disabled={isLoading}>
                {isLoading ? t("buttons.creating") : t("buttons.save_changes") || "Guardar cambios"}
              </Button>
            </div>
          }
        />
        <InstructorForm
          mode="edit"
          formData={instructor}
          onChange={handleChange}
          onFieldBlur={handleFieldBlur}
          errors={errors}
          categories={categoriesOptions}
        />
      </form>
    </div>
  );
}