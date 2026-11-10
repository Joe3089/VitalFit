import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ReservationItem = {
	id: string;
	title: string;
	time: string;
	instructor?: string;
	imageUrl?: string | number;
};

const STORAGE_KEY = 'reservations_v1';

type ReservationsContextType = {
	items: Record<string, ReservationItem>;
	isReserved: (id: string) => boolean;
	reserve: (item: ReservationItem) => Promise<void>;
	cancel: (id: string) => Promise<void>;
	clearReservations: () => Promise<void>; 
	loading: boolean;
};

const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

export function ReservationsProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<Record<string, ReservationItem>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const raw = await AsyncStorage.getItem(STORAGE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw) as Record<string, ReservationItem>;
					setItems(parsed);
				}
			} catch {
				// noop: keep empty state if parse fails
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const persist = useCallback(async (next: Record<string, ReservationItem>) => {
		setItems(next);
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		} catch {
			// noop
		}
	}, []);

	const isReserved = useCallback((id: string) => Boolean(items[id]), [items]);

	const reserve = useCallback(
		async (item: ReservationItem) => {
			const next = { ...items, [item.id]: item };
			await persist(next);
		},
		[items, persist],
	);

	const cancel = useCallback(
		async (id: string) => {
			if (!items[id]) return;
			const rest = { ...items };
			delete rest[id];
			await persist(rest);
		},
		[items, persist],
	);

	const clearReservations = useCallback(async () => {
		setItems({});
		try {
			await AsyncStorage.removeItem(STORAGE_KEY);
		} catch {
			// noop
		}
	}, []);

	const value = useMemo<ReservationsContextType>(
		() => ({ items, isReserved, reserve, cancel, clearReservations, loading }),
		[items, isReserved, reserve, cancel, clearReservations, loading],
	);

	return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}

export function useReservations() {
	const ctx = useContext(ReservationsContext);
	if (!ctx) throw new Error('useReservations must be used within ReservationsProvider');
	return ctx;
}