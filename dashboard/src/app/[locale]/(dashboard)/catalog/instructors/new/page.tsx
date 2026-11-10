"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/sdk-config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner"; 
import { useTranslations } from "next-intl"; 
import {
  InstructorDataList,
  UserGender,
  ServiceCategoryInfo,
} from "@vitalfit/sdk";
import {
  validateInstructor,
  validateInstructorField,
  InstructorFormData,
} from "@/lib/validation/instructorSchema";
import InstructorForm from "@/components/modules/instructor/InstructorForm";
import { useRouter } from "@/i18n/navigation";

interface CreateInstructorProps {
  onBack: () => void;
}

export default function CreateInstructor({ onBack }: CreateInstructorProps) {
  const router = useRouter();
  const { token } = useAuth();
  const t = useTranslations("catalog.instructor.form");

  const [formData, setFormData] = useState<InstructorDataList>({
    instructor_id: "",
    user_id: "",
    first_name: "",
    last_name: "",
    email: "",
    identity_document: "",
    phone: "",
    birth_date: "",
    gender: "",
    biography: "",
    profile_picture_url: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof InstructorFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<Array<{ category_id: string; name: string }>>([]);

  const handleChange = (field: keyof InstructorDataList, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        console.warn("No se pudieron cargar las categorías:", err);
      }
    };
    loadCategories();
    return () => { mounted = false; };
  }, [token]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!token) {
      toast.error(t("errors.auth_required") || "No estás autenticado");
      return;
    }

    const validationResult = validateInstructor(formData, t);
    
    if (!validationResult.success) {
      const newErrors: Partial<Record<keyof InstructorFormData, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof InstructorFormData;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      toast.error(t("errors.check_fields") || "Revisa los campos del formulario");
      return;
    }

    setErrors({});
    setIsLoading(true);

    const mapGenderToEnum = (gender: string): UserGender => {
      switch (gender) {
        case "male": return UserGender.male;
        case "female": return UserGender.female;
        default: return UserGender.preferNotToSay;
      }
    };

    const payload = {
      ...formData,
      gender: mapGenderToEnum(formData.gender),
      biography: formData.biography || "",
      profile_picture_url: formData.profile_picture_url || "",
    };

    try {
      await api.instructor.createInstructor(payload, token);

      try {
        const searchKey = formData.email || formData.identity_document;
        const list = await api.instructor.getInstructors({ limit: 5, page: 1, search: searchKey }, token);
        const created = (list.data || []).find(i => i.email === formData.email);
        
        if (created && (formData as any).specialties) {
          const spec = (formData as any).specialties;
          const ids = Array.isArray(spec) ? spec.map(s => s.category_id || s) : [spec];
          await api.instructor.addSpecialty(created.instructor_id, ids, token);
        }
      } catch (err) {
        console.warn("Error vinculando especialidad:", err);
      }

      toast.success(t("create.success") || "¡Instructor creado exitosamente!");
      
      setTimeout(() => {
        router.push("/catalog/instructors");
      }, 1500);

    } catch (err: any) {
      console.error(err);
      if (err?.messages?.[0] === "conflict") {
        toast.error(t("errors.conflict") || "El instructor ya existe");
      } else {
        toast.error(err?.error || t("errors.server_error") || "Error al crear instructor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white rounded-xl shadow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title={t("create.title") || "Crear Instructor"}
          subtitle={t("create.subtitle") || "Complete la información"}
        />

        <InstructorForm
          formData={formData}
          onChange={handleChange}
          onFieldBlur={handleFieldBlur}
          errors={errors}
          mode="edit"
          categories={categoriesOptions}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
            {t("buttons.cancel") || "Cancelar"}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading ? t("buttons.creating") || "Creando..." : t("buttons.create") || "Crear"}
          </Button>
        </div>
      </form>
    </div>
  );
}