"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/sdk-config";
import { useRouter } from "@/i18n/routing";
import { User } from "@vitalfit/sdk";
import { authService } from "@/lib/auth-service";

export interface ClientSession {
  user: User;
}

type SetUserType = (
  value: User | null | ((prev: User | null) => User | null),
) => void;

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (token: string, refresh: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const setTokens = useCallback((token: string, refresh: string) => {
    authService.setTokens(token, refresh);
    setAccessToken(token);
    setRefreshToken(refresh);
    api.client.setTokens(token, refresh);
  }, []);

  const clearSession = useCallback(() => {
    authService.clearSession();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    api.client.removeTokens();
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  const getUserProfile = useCallback(
    async (token: string): Promise<User | null> => {
      try {
        const profileResponse = await api.user.WhoAmI(token);
        const sdkUser: User | null = profileResponse.user;

        if (!sdkUser) {
          return null;
        }

        return sdkUser;
      } catch (err) {
        console.error("Error al obtener perfil del cliente:", err);
        return null;
      }
    },
    [],
  );

  const reloadUser = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    try {
      const profile = await getUserProfile(accessToken);
      if (!profile) {
        logout();
      } else {
        setUser(profile);
      }
    } catch {
      logout();
    }
  }, [accessToken, getUserProfile, logout]);

  const login = useCallback(
    async (token: string, refresh: string) => {
      setLoading(true);
      try {
        const profile = await getUserProfile(token);
        if (!profile) {
          throw new Error("Error al cargar perfil");
        }

        setTokens(token, refresh);
        setUser(profile);
      } finally {
        setLoading(false);
      }
    },
    [getUserProfile, setTokens],
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

      const profile = await getUserProfile(storedAccess);
      if (!profile) {
        clearSession();
      } else {
        setUser(profile);
      }

      setLoading(false);
    };

    initAuth();
  }, [getUserProfile, clearSession]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
