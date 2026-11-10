"use client";

import { api } from "@/lib/sdk-config";
import { Staff } from "@vitalfit/sdk";
import { useCallback, useEffect, useState } from "react";

interface AssignStaffPayload {
  staff_ids: string[];
}

export default function useBranchStaff(token: string | null, branchID: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [branchStaff, setBranchStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !branchID) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.staff.getBranchstaff(branchID, token, {
        page: 1,
        limit: 50, 
        sort: "desc",
      });

      setBranchStaff(response.data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [token, branchID]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignStaff = async (payload: AssignStaffPayload) => {
    if (!token || !branchID) {
      return;
    }
    try {
      setIsLoading(true);
      await api.staff.AssignBranchStaff(branchID, payload.staff_ids, token);
      await loadData();
    } catch (err: any) {
      console.error("Error al asignar staff:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeStaff = async (staffId: string) => {
    if (!token || !branchID) {
      return;
    }
    try {
      await api.staff.RemoveBranchStaff(branchID, staffId, token);

      setBranchStaff((prev) => prev.filter((s) => s.user_id !== staffId));
    } catch (err) {
      console.error("Error al eliminar staff:", err);
      throw err;
    }
  };

  return {
    branchStaff,
    isLoading,
    error,
    assignStaff,
    removeStaff,
    refresh: loadData,
  };
}
