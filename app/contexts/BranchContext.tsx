import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Branch {
  branch_id: string; 
  name: string;
  address?: string;
}

interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  selectedBranchId: string | null;
  isLoading: boolean;
  error: string | null;
  selectBranch: (branchId: string) => Promise<void>;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch debe ser usado dentro de un BranchProvider');
  }
  return context;
};

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBranches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return; 
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await vitalFitApi.public.getBranchMap(token);

      const branchList: Branch[] = Array.isArray(response) ? response : (response.data || []);

      setBranches(branchList);
      const savedBranchId = await AsyncStorage.getItem('selected_branch_id');

      if (savedBranchId && branchList.some(b => b.branch_id === savedBranchId)) {
        setSelectedBranchId(savedBranchId);
      } else if (branchList.length > 0) {
        const firstBranchId = branchList[0].branch_id;
        setSelectedBranchId(firstBranchId);
        await AsyncStorage.setItem('selected_branch_id', firstBranchId);
      }

    } catch (err: unknown) {
      console.error('Error cargando sucursales:', err);
      if (isAPIError(err)) {
        setError(err.message || 'Error al obtener sucursales');
      } else {
        setError('Error de conexión o inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const selectBranch = async (branchId: string) => {
    const branchExists = branches.find(b => b.branch_id === branchId);
    if (branchExists) {
      setSelectedBranchId(branchId);
      await AsyncStorage.setItem('selected_branch_id', branchId);
    }
  };

  const selectedBranch = branches.find(b => b.branch_id === selectedBranchId) || null;

  const value = {
    branches,
    selectedBranch,
    selectedBranchId,
    isLoading,
    error,
    selectBranch,
    refreshBranches: loadBranches
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};
