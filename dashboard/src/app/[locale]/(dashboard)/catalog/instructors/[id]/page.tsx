"use client";

import { useAuth } from "@/context/AuthContext";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/sdk-config";
import {
  InstructorData,
  ServiceCategoryInfo,
  DataResponse,
} from "@vitalfit/sdk";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import InstructorForm from "@/components/modules/instructor/InstructorForm";

export default function InstructorDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoriesOptions, setCategoriesOptions] = useState<
    Array<{ category_id: string; name: string }>
  >([]);

  useEffect(() => {
    if (!id) {
      router.replace("/catalog/instructors");
      return;
    }
    if (!token) {
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const instructorRes: DataResponse<InstructorData> =
          await api.instructor.getInstructorById(id, token);
        if (!mounted) {
          return;
        }

        const data = instructorRes.data;

        if (
          data?.specialties &&
          Array.isArray(data.specialties) &&
          data.specialties.length > 0
        ) {
          const last = data.specialties[data.specialties.length - 1];
          data.specialties = [last];
        }

        setInstructor(data);
      } catch (err: any) {
        if (!mounted) {
          return;
        }
        const status = err?.response?.status ?? err?.status ?? null;
        if (status === 404) {
          router.replace("/catalog/instructors");
        } else {
          console.error("Error cargando instructor:", err);
          setError("No se pudo cargar la información del instructor.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    (async () => {
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
          })),
        );
      } catch (err) {
        console.warn(
          "No se pudieron cargar las categorías para especialidades:",
          err,
        );
        setCategoriesOptions([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, token, router]);

  if (loading) {
    return <div className="p-6">Cargando Instructores...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!instructor) {
    return null;
  }

  return (
    <>
      <PageHeader title="DETALLES DE INSTRUCTOR">
        <Button
          variant="default"
          onClick={() => {
            router.push(`/catalog/instructors/${id}/edit`);
          }}
        >
          Modificar
        </Button>
      </PageHeader>
      <InstructorForm
        mode="view"
        formData={instructor}
        onChange={(field, value) =>
          setInstructor((prev) => (prev ? { ...prev, [field]: value } : prev))
        }
        categories={categoriesOptions}
      />
    </>
  );
}
