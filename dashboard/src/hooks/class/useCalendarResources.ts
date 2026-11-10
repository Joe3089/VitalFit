"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/sdk-config";
import { PaginatedBranch, BranchServicePrice, BranchInstructorInfo } from "@vitalfit/sdk";
import { useTranslations } from "next-intl";

interface CalendarResources {
  branches: PaginatedBranch[];
  services: BranchServicePrice[];
  instructors: BranchInstructorInfo[];
}

export function useCalendarResources(token: string | null, branchId: string | null) {
  const t = useTranslations("calendar.resources");
  
  const [resources, setResources] = useState<CalendarResources>({
    branches: [],
    services: [],
    instructors: [],
  });
  
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token){
       return;
    }

    const fetchBranches = async () => {
      try {
        const bRes = await api.branch.getBranches({ page: 1, limit: 100 }, token);
        setResources(prev => ({ ...prev, branches: bRes.data || [] }));
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [token]);

  useEffect(() => {
    if (!token || !branchId || branchId === "all") {
      setResources(prev => ({ ...prev, services: [], instructors: [] }));
      setIsLoadingResources(false);
      return;
    }

    const fetchBranchMetadata = async () => {
      setIsLoadingResources(true);
      setError(null);
      
      try {

        const [sRes, iRes] = await Promise.all([
          api.products.getBranchServices(branchId, token),
          api.instructor.getBranchInstructors(branchId, {}, token),
        ]);

        setResources(prev => ({
          ...prev,
          services: sRes.data || [],
          instructors: iRes.data || [],
        }));
      } catch (err) {
        console.error("Error fetching branch resources:", err);
        setError(t("error"));
      } finally {
        setIsLoadingResources(false);
      }
    };

    fetchBranchMetadata();
  }, [token, branchId, t]);

  return {
    ...resources,
    isLoadingResources,
    error,
  };
}