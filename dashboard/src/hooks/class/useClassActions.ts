"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";
import { api } from "@/lib/sdk-config";
import { BranchClassInfo, UpdateClassPayload } from "@vitalfit/sdk";

export interface ClassFormData extends Partial<BranchClassInfo> {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  recurrence?: string;
}

export function useClassActions(token: string | null, classId?: string | null) {
  const { mutate } = useSWRConfig();
  const [isUpdating, setIsUpdating] = useState(false);

  const CACHE_KEY = classId && token ? [`/schedule/${classId}`, token] : null;

  const { data: selectedClass, isLoading, error } = useSWR(
    CACHE_KEY,
    async () => {
      const response = await api.schedule.GetClassByID(classId!, token!);
      const item = response.data;
      if (!item) {
        return null;
      }

      return {
        ...item,
        recurrence: "none",
        start_date: item.starts_at.split("T")[0],
        start_time: item.starts_at.split("T")[1].substring(0, 5),
        end_date: item.ends_at.split("T")[0],
        end_time: item.ends_at.split("T")[1].substring(0, 5),
      } as ClassFormData;
    },
    { 
      revalidateOnFocus: false, 
      dedupingInterval: 1000 
    }
  );

  const updateClass = async (data: ClassFormData, localOffset: string) => {
    if (!token || !classId) {
      return false;
    }

    if (!data.instructor_id || !data.service_id) {
      toast.error("Faltan campos obligatorios: Instructor o Servicio");
      return false;
    }

    setIsUpdating(true);
    try {
      const payload: UpdateClassPayload = {
        starts_at: `${data.start_date}T${data.start_time}:00${localOffset}`,
        ends_at: `${data.end_date}T${data.end_time}:00${localOffset}`,
        instructor_id: data.instructor_id,
        service_id: data.service_id,
        max_capacity: Number(data.max_capacity) || 0,
        is_visible: !!data.is_visible,
        notes: data.notes?.trim() || "",
      };

      await api.schedule.UpdateClass(classId, payload, token);
      await mutate(CACHE_KEY); 
      await mutate(
        (key: any) => Array.isArray(key) && key.includes("schedule"),
        undefined,
        { revalidate: true }
      );

      toast.success("Clase actualizada correctamente");
      return true;
    } catch (err: any) {
      console.error("Error al actualizar:", err);
      toast.error("Error al actualizar la clase");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteClass = async () => {
    if (!token || !classId){
       return false;
    }

    setIsUpdating(true);
    try {
      await api.schedule.DeleteClass(classId, token);

      mutate(CACHE_KEY, null, false);

      await mutate(
        (key: any) => Array.isArray(key) && key.includes("schedule"),
        undefined,
        { revalidate: true }
      );

      toast.success("Clase eliminada");
      return true;
    } catch (err: any) {
      toast.error("No se pudo eliminar la clase");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    selectedClass,
    isLoading,
    isUpdating,
    error,
    updateClass,
    deleteClass,
  };
}