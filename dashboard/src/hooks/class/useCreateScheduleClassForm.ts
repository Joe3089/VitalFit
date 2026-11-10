"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/sdk-config";
import { useSearchParams } from "next/navigation";
import { PaginatedBranch } from "@vitalfit/sdk";
import {  getScheduleClassSchema, ScheduleClassFormData } from "@/lib/validation/scheduleClassSchema";
import { useTranslations } from "next-intl";

export function useCreateScheduleClassForm(token: string | null, userBranchIds?: string[]) {
  const searchParams = useSearchParams();
  const t = useTranslations("calendar.form"); 

  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isResourcesLoading, setIsResourcesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<PaginatedBranch[]>([]);
  const [services, setServices] = useState<any[]>([]); 
  const [instructors, setInstructors] = useState<any[]>([]);

  const [formData, setFormData] = useState<ScheduleClassFormData>({
    service_id: "",
    branch_id: "", 
    instructor_id: "",
    max_capacity: 10,
    is_visible: true,
    notes: "",
    recurrence: "none",
    start_date: "",
    start_time: "08:00",
    end_date: "", 
    end_time: "09:00",
    recurrence_until: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleClassFormData, string>>>({});

  useEffect(() => {
    const loadBranches = async () => {
      if (!token){
         return;
      }
      try {
        setIsLoadingBranches(true);
        const bRes = await api.branch.getBranches({ page: 1, limit: 100 }, token);
        
        if (bRes.data) {
          const filtered = userBranchIds && userBranchIds.length > 0
            ? bRes.data.filter((b: any) => userBranchIds.includes(b.branch_id))
            : bRes.data;
            
          setBranches(filtered);

          if (filtered.length === 1) {
            setFormData(prev => ({ ...prev, branch_id: filtered[0].branch_id }));
          }
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    loadBranches();
  }, [token, userBranchIds]);

  useEffect(() => {
    const loadBranchData = async () => {
      if (!token || !formData.branch_id) {
        setServices([]);
        setInstructors([]);
        return;
      }

      try {
        setIsResourcesLoading(true);
        const [sRes, iRes] = await Promise.all([
          api.products.getBranchServices(formData.branch_id, token),
          api.instructor.getBranchInstructors(formData.branch_id, {}, token),
        ]);

        setServices(sRes.data || []);
        setInstructors(iRes.data || []);
      } catch (err) {
        console.error("Error cargando recursos de la sucursal:", err);
      } finally {
        setIsResourcesLoading(false);
      }
    };

    loadBranchData();
  }, [formData.branch_id, token]);

  useEffect(() => {
    const date = searchParams.get("date");
    const branch = searchParams.get("branch");
    
    setFormData(p => {
      const update: Partial<ScheduleClassFormData> = {};
      if (date) {
        update.start_date = date;
        update.end_date = date;
      }
      if (branch) {
        const hasPermission = !userBranchIds || userBranchIds.length === 0 || userBranchIds.includes(branch);
        if (hasPermission){
           update.branch_id = branch;
        }
      }
      return Object.keys(update).length > 0 ? { ...p, ...update } : p;
    });
  }, [userBranchIds]);

  const handleChange = useCallback((field: keyof ScheduleClassFormData, value: any) => {
    setFormData(prev => {
      if (prev[field] === value) {
        return prev;
      }

      const newData = { ...prev, [field]: value };

      if (field === "start_date") {
        newData.end_date = value;
      }

      if (field === "branch_id") {
        newData.service_id = "";
        newData.instructor_id = "";
      }

      if (field === "start_time" && typeof value === "string" && value.includes(":")) {
        const [h, m] = value.split(":").map(Number);
        const endH = (h + 1).toString().padStart(2, "0");
        newData.end_time = `${endH}:${m.toString().padStart(2, "0")}`;
      }

      return newData;
    });

    setErrors(prev => {
      if (!prev[field]) {
        return prev;
      }
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const validate = useCallback(() => {
    const dataToValidate = {
      ...formData,
      end_date: formData.end_date || formData.start_date
    };

    const schema = getScheduleClassSchema(t); 
    const result = schema.safeParse(dataToValidate);
    
    if (!result.success) {
      const newErrors: any = {};
      result.error.issues.forEach(i => { 
        newErrors[i.path[0]] = i.message; 
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  }, [formData, t]);

  return {
    formData,
    setFormData,
    errors,
    handleChange,
    validate,
    isLoading: isLoadingBranches || isResourcesLoading,
    isSubmitting,
    setIsSubmitting,
    resources: { branches, services, instructors }
  };
}