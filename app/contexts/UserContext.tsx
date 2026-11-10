import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import vitalFitApi from '@/services';

export type UserData = {
	userId: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	gender: string;
	birthDate: string;
	identityDocument: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	membership?: { status: string; end_date: string; [key: string]: any };
	profilePicture?: string;
	specialty?: string;
	roleName?: string;
	faceAuthEnabled?: boolean;
	category?: string;
};

type UserContextType = {
	user: UserData | null;
	loading: boolean;
	error: string | null;
	fetchUser: () => Promise<void>;
	updateLocalUser: (partial: Partial<UserData>) => void;
	clearUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUser = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const token = await AsyncStorage.getItem('token');
			if (!token) {
				setUser(null);
				setError('No se encontró token de autenticación');
				return;
			}

			const userData = await vitalFitApi.user.WhoAmI(token);
			const apiUser = userData?.user;

			if (!apiUser) {
				setUser(null);
				setError('No se encontraron datos de usuario');
				return;
			}

			const normalizedGender =
				apiUser.gender === 'male' ? 'M' : apiUser.gender === 'female' ? 'F' : '';

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const rawCategory = (apiUser as any).ClientProfile?.category;
			const normalizedCategory = rawCategory === 'AtRisk' ? 'Regular' : rawCategory;

			setUser({
				userId: apiUser.user_id || '',
				firstName: apiUser.first_name || '',
				lastName: apiUser.last_name || '',
				email: apiUser.email || '',
				phone: apiUser.phone || '',
				gender: normalizedGender,
				birthDate: apiUser.birth_date || '',
				identityDocument: apiUser.identity_document || '',
				profilePicture: apiUser.profile_picture_url || undefined,
				membership: apiUser.client_membership,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				specialty: (apiUser as any).instructor_profile?.specialty || (apiUser as any).specialty || '',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				roleName: (apiUser as any).role?.name || 'Instructor',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				faceAuthEnabled: (apiUser as any).face_auth_enabled || false,
				category: normalizedCategory || undefined,
			});
		} catch (err: unknown) {
			let message = 'Ocurrió un error inesperado al obtener los datos del usuario.';
			if (isAPIError(err)) {
				message = err.messages.join(', ');
			} else if (err instanceof Error) {
				message = err.message;
			}
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	const updateLocalUser = useCallback((partial: Partial<UserData>) => {
		setUser((prev) => (prev ? { ...prev, ...partial } : prev));
	}, []);

	const clearUser = useCallback(() => {
		setUser(null);
		setError(null);
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	const value = useMemo<UserContextType>(
		() => ({ user, loading, error, fetchUser, updateLocalUser, clearUser }),
		[user, loading, error, fetchUser, updateLocalUser, clearUser],
	);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error('useUser debe ser usado dentro de un UserProvider');
	}
	return context;
}
