import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import vitalFitApi from '@/services/vitalfitSdk';

type AuthContextType = {
	isAuthenticated: boolean;
	isLoading: boolean;
	token: string | null;
	refreshToken: string | null;
	role: string | null; // Added role
	login: (token: string, refreshToken?: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null); // Added role state
	const router = useRouter();

	// Logout function - clears tokens and redirects
	const logout = useCallback(async () => {
		try {
			await AsyncStorage.multiRemove(['token', 'refresh_token', 'temp_email', 'temp_password']);
			vitalFitApi.client.removeTokens();
			setToken(null);
			setRefreshToken(null);
			setRole(null); // Clear role
			setIsAuthenticated(false);
			router.replace('/(auth)/login');
		} catch (error) {
			console.error('Error during logout:', error);
		}
	}, [router]);

	// Setup SDK callbacks for automatic token refresh
	useEffect(() => {
		vitalFitApi.client.setCallbacks(
			// onTokenUpdate callback - called when tokens are refreshed
			async (access: string, refresh: string) => {
				await AsyncStorage.setItem('token', access);
				await AsyncStorage.setItem('refresh_token', refresh);
				setToken(access);
				setRefreshToken(refresh);
				setIsAuthenticated(true);
			},
			// onLogout callback - called when refresh fails
			async () => {
				await logout();
			}
		);
	}, [logout]);

	// Initialize auth state from storage
	const initializeAuth = useCallback(async () => {
		try {
			setIsLoading(true);
			const storedToken = await AsyncStorage.getItem('token');
			const storedRefreshToken = await AsyncStorage.getItem('refresh_token');

			if (storedToken && storedRefreshToken) {
				// Set tokens in SDK client for automatic refresh
				vitalFitApi.client.setTokens(storedToken, storedRefreshToken);

				// Fetch user role
				try {
					const whoamiResponse = (await vitalFitApi.user.WhoAmI(storedToken)) as unknown as {
						user?: { role?: { name?: string } };
					};
					const userRole = whoamiResponse.user?.role?.name?.toLowerCase() || null;
					setRole(userRole);
				} catch (err) {
					console.warn('Failed to fetch user role on init:', err);
					// If WhoAmI fails (e.g. invalid token), maybe we should logout or just proceed with null role?
					// For robust persistence, if token is invalid, the SDK intercepts 401 and might try refresh.
				}

				setToken(storedToken);
				setRefreshToken(storedRefreshToken);
				setIsAuthenticated(true);
			} else {
				setIsAuthenticated(false);
			}
		} catch (error) {
			console.error('Error initializing auth:', error);
			setIsAuthenticated(false);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Login function - stores tokens and updates state
	const login = useCallback(async (newToken: string, newRefreshToken?: string) => {
		try {
			if (!newRefreshToken) {
				throw new Error('Refresh token is required');
			}

			await AsyncStorage.setItem('token', newToken);
			await AsyncStorage.setItem('refresh_token', newRefreshToken);

			// Set tokens in SDK client for automatic refresh
			vitalFitApi.client.setTokens(newToken, newRefreshToken);

			// Fetch role on login
			try {
				const whoamiResponse = (await vitalFitApi.user.WhoAmI(newToken)) as unknown as {
					user?: { role?: { name?: string } };
				};
				const userRole = whoamiResponse.user?.role?.name?.toLowerCase() || null;
				setRole(userRole);
			} catch (err) {
				console.error('Failed to fetch role during login:', err);
			}

			setToken(newToken);
			setRefreshToken(newRefreshToken);
			setIsAuthenticated(true);
		} catch (error) {
			console.error('Error storing tokens:', error);
			throw error;
		}
	}, []);

	// Initialize on mount
	useEffect(() => {
		initializeAuth();
	}, [initializeAuth]);

	const value = useMemo<AuthContextType>(
		() => ({
			isAuthenticated,
			isLoading,
			token,
			refreshToken,
			role, // Expose role
			login,
			logout,
		}),
		[isAuthenticated, isLoading, token, refreshToken, role, login, logout] // Add role to dependency array
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}