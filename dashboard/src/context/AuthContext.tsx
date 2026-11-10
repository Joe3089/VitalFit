"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/sdk-config";
import { BranchStaff, User as SdkUser } from "@vitalfit/sdk";
import { UserRole, ROLE_LABELS } from "@/lib/roles";
import { authService } from "@/lib/auth-service";

import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionWarningModal } from "@/components/modules/auth/SessionWarningModal";

const WARNING_TIME =
  (Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINS) || 14) * 60 * 1000;
const GRACE_PERIOD =
  (Number(process.env.NEXT_PUBLIC_GRACE_PERIOD_SEC) || 60) * 1000;

export interface SessionUser extends Omit<SdkUser, "role"> {
  role: UserRole;
  role_label: string;
  branch_id?: string;
  assignedBranches: BranchStaff[];
  managedBranches: BranchStaff[];
  instructorBranches: BranchStaff[];
  activeBranch?: BranchStaff;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, refresh: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
  setTokens: (token: string, refresh: string) => void;
  switchBranch: (branch: BranchStaff) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasAccess: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const clearSession = useCallback(() => {
    authService.clearSession();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    api.client.removeTokens();
    authService.clearSession();
    localStorage.removeItem("active_branch_id");;
    api.client.removeTokens();
  }, []);

 const logout = useCallback(() => {
  clearSession();
  
  window.location.href = "/login";
}, [clearSession]);

  const { showWarning, remainingTime, resetTimer } = useSessionTimeout({
    onLogout: logout,
    isEnabled: !!accessToken && !loading,
    warningTimeMs: WARNING_TIME,
    logoutTimeMs: GRACE_PERIOD,
  });

  const setTokens = useCallback((token: string, refresh: string) => {
    authService.setTokens(token, refresh);
    setAccessToken(token);
    setRefreshToken(refresh);
    api.client.setTokens(token, refresh);
  }, []);

  const getUserProfile = useCallback(
    async (token: string): Promise<SessionUser | null> => {
      try {
        const [profileResponse, branchesRes, managedRes, instructorRes] =
          await Promise.all([
            api.user.WhoAmI(token),
            api.staff.getStaffBranches(token),
            api.staff.getManagedBranches(token),
            api.staff.getInstructorBranches(token),
          ]);

        const sdkUser: SdkUser | null = profileResponse.user;
        if (!sdkUser) {
          return null;
        }

        const rawRoleName = (sdkUser.role as any)?.name?.toLowerCase();
        const role = rawRoleName as UserRole;

        if (!Object.values(UserRole).includes(role)) {
          return null;
        }

        const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
        const filterValid = (branches: BranchStaff[] | undefined) =>
          (branches ?? []).filter((b) => b.id && b.id !== EMPTY_GUID);
        const assignedBranches = filterValid(branchesRes.data);
        const managedBranches = filterValid(managedRes.data);
        const instructorBranches = filterValid(instructorRes.data);
        const allBranches = [
          ...assignedBranches,
          ...managedBranches,
          ...instructorBranches,
        ];

        const savedBranchId = localStorage.getItem("active_branch_id");
        let activeBranch = allBranches.find((b) => b.id === savedBranchId);

        if (!activeBranch || activeBranch.id === EMPTY_GUID) {
        activeBranch = allBranches.length > 0 ? allBranches[0] : undefined;
      }

        if (activeBranch) {
        localStorage.setItem("active_branch_id", activeBranch.id);
      } else {
        localStorage.removeItem("active_branch_id"); 
      }

        return {
          ...sdkUser,
          role,
          role_label: ROLE_LABELS[role] ?? rawRoleName,
          assignedBranches,
          managedBranches,
          instructorBranches,
          activeBranch,
          branch_id: activeBranch?.id,
        };
      } catch (err) {
        console.error("Error construyendo SessionUser:", err);
        return null;
      }
    },
    [],
  );

  const login = useCallback(
    async (token: string, refresh: string) => {
      setLoading(true);
      try {
        const sessionUser = await getUserProfile(token);
        if (!sessionUser) {
          throw new Error("Usuario sin permisos");
        }

        setTokens(token, refresh);
        setUser(sessionUser);
      } finally {
        setLoading(false);
      }
    },
    [getUserProfile, setTokens],
  );

  const reloadUser = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    try {
      const sessionUser = await getUserProfile(accessToken);
      if (!sessionUser) {
        logout();
        return;
      }
      setUser(sessionUser);
    } catch {
      logout();
    }
  }, [accessToken, getUserProfile, logout]);

  const switchBranch = useCallback((branch: BranchStaff) => {
    setUser((prev) =>
      prev ? { ...prev, activeBranch: branch, branch_id: branch.id } : prev,
    );
    localStorage.setItem("active_branch_id", branch.id);
  }, []);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!user?.role) {
        return false;
      }
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(user.role);
    },
    [user],
  );

  useEffect(() => {
    api.client.setCallbacks(
      (access, refresh) => {
        authService.setTokens(access, refresh);
        setAccessToken(access);
        setRefreshToken(refresh);
      },
      () => logout(),
    );
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const storedAccess = authService.getAccessToken();
      const storedRefresh = authService.getRefreshToken();

      if (!storedAccess || !storedRefresh) {
        clearSession();
        setLoading(false);
        return;
      }

      api.client.setTokens(storedAccess, storedRefresh);
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);

      const sessionUser = await getUserProfile(storedAccess);
      if (!sessionUser) {
        clearSession();
      } else {
        setUser(sessionUser);
      }
      setLoading(false);
    };

    initAuth();
  }, [getUserProfile, clearSession]);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const hasAccess = isSuperAdmin || !!user?.activeBranch;

  return (
    <AuthContext.Provider
      value={{
        token: accessToken,
        refreshToken,
        user,
        loading,
        isAuthenticated: !!accessToken && !!user,
        login,
        logout,
        reloadUser,
        switchBranch,
        hasRole,
        setTokens,
        hasAccess,
      }}
    >
      {children}
      {showWarning && (
        <SessionWarningModal
          remainingTime={remainingTime}
          onStayLoggedIn={resetTimer}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
