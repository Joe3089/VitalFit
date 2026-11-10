import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import {
	getNotificationSettings,
	getUnreadCount,
	getUserNotifications,
	markAllNotificationsAsRead,
	markNotificationAsRead,
	updateNotificationSettings,
	type NotificationSettings,
	type PaginatedNotifications,
} from '../services/notificationApi';
import {
	addNotificationReceivedListener,
	addNotificationResponseListener,
	registerForPushNotificationsAsync,
	setBadgeCount,
} from '../services/notificationService';
import { useAuth } from './AuthContext';

// Check if we're running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// UI Notification interface (formatted for display)
export interface Notification {
	id: string;
	title: string;
	body: string;
	read: boolean;
	createdAt: string;
	data: Record<string, unknown>;
}

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	settings: NotificationSettings | null;
	isLoading: boolean;
	hasMore: boolean;
	expoPushToken: string | null;
	// Actions
	refreshNotifications: () => Promise<void>;
	loadMoreNotifications: () => Promise<void>;
	markAsRead: (notificationId: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
	requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
);

export function NotificationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { token: accessToken } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [settings, setSettings] = useState<NotificationSettings | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

	const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
	const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

	// Request notification permissions and get device token
	// Note: Device token is now sent during login, not after
	const requestPermissions = useCallback(async (): Promise<boolean> => {
		try {
			const token = await registerForPushNotificationsAsync();
			if (token) {
				setExpoPushToken(token);
				// Device token is sent during login now, no need to register separately
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error requesting notification permissions:', error);
			return false;
		}
	}, []);

	// Fetch notifications from API
	const fetchNotifications = useCallback(
		async (page: number = 1): Promise<PaginatedNotifications | null> => {
			if (!accessToken) return null;

			try {
				setIsLoading(true);
				const data = await getUserNotifications(accessToken, page, 20);
				return data;
			} catch (error) {
				console.error('Error fetching notifications:', error);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[accessToken]
	);

	// Refresh notifications (reset to page 1)
	const refreshNotifications = useCallback(async () => {
		const data = await fetchNotifications(1);
		if (data) {
			// Convert API response to our internal format
			const formattedNotifications = data.data.map((notif) => ({
				id: notif.id,
				title: notif.title,
				body: notif.message,
				read: notif.is_read,
				createdAt: notif.created_at,
				data: notif.metadata,
			}));
			setNotifications(formattedNotifications);
			setCurrentPage(1);
			setHasMore(!!data.next);
		}
	}, [fetchNotifications]);

	// Load more notifications (pagination)
	const loadMoreNotifications = useCallback(async () => {
		if (!hasMore || isLoading) return;

		const nextPage = currentPage + 1;
		const data = await fetchNotifications(nextPage);
		if (data) {
			// Convert API response to our internal format
			const formattedNotifications = data.data.map((notif) => ({
				id: notif.id,
				title: notif.title,
				body: notif.message,
				read: notif.is_read,
				createdAt: notif.created_at,
				data: notif.metadata,
			}));
			setNotifications((prev) => [...prev, ...formattedNotifications]);
			setCurrentPage(nextPage);
			setHasMore(!!data.next);
		}
	}, [currentPage, hasMore, isLoading, fetchNotifications]);

	// Fetch unread count
	const fetchUnreadCount = useCallback(async () => {
		if (!accessToken) return;

		try {
			const count = await getUnreadCount(accessToken);
			setUnreadCount(count);
			// Update badge count
			await setBadgeCount(count);
		} catch (error) {
			console.error('Error fetching unread count:', error);
		}
	}, [accessToken]);

	// Fetch notification settings
	const fetchSettings = useCallback(async () => {
		if (!accessToken) return;

		try {
			const userSettings = await getNotificationSettings(accessToken);
			setSettings(userSettings);
		} catch {
			// Settings endpoint not implemented yet - use defaults silently
			console.log('Settings endpoint not available, using defaults');
			setSettings({
				classReminders: true,
				routineUpdates: true,
				promotions: false,
				systemMessages: true,
			});
		}
	}, [accessToken]);

	// Mark notification as read
	const markAsRead = useCallback(
		async (notificationId: string) => {
			if (!accessToken) return;

			try {
				await markNotificationAsRead(accessToken, notificationId);

				// Update local state
				setNotifications((prev) =>
					prev.map((notif) =>
						notif.id === notificationId ? { ...notif, read: true } : notif
					)
				);

				// Update unread count
				await fetchUnreadCount();
			} catch (error) {
				console.error('Error marking notification as read:', error);
			}
		},
		[accessToken, fetchUnreadCount]
	);

	// Mark all notifications as read
	const markAllAsRead = useCallback(async () => {
		if (!accessToken) return;

		try {
			await markAllNotificationsAsRead(accessToken);

			// Update local state
			setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));

			// Update unread count
			setUnreadCount(0);
			await setBadgeCount(0);
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	}, [accessToken]);

	// Update notification settings
	const updateSettings = useCallback(
		async (newSettings: Partial<NotificationSettings>) => {
			if (!accessToken) return;

			try {
				const updated = await updateNotificationSettings(
					accessToken,
					newSettings
				);
				setSettings(updated);
			} catch (error) {
				console.error('Error updating notification settings:', error);
			}
		},
		[accessToken]
	);

	// Handle notification received (foreground)
	const handleNotificationReceived = useCallback(
		(notification: Notifications.Notification) => {
			console.log('Notification received:', notification);
			// Refresh notifications and unread count
			refreshNotifications();
			fetchUnreadCount();
		},
		[refreshNotifications, fetchUnreadCount]
	);

	// Handle notification tapped
	const handleNotificationResponse = useCallback(
		(response: Notifications.NotificationResponse) => {
			console.log('Notification tapped:', response);
			const notificationId =
				response.notification.request.content.data?.notificationId;

			if (notificationId && typeof notificationId === 'string') {
				markAsRead(notificationId);
			}
		},
		[markAsRead]
	);

	// Initialize notifications on mount
	useEffect(() => {
		// Skip push notification setup in Expo Go
		if (isExpoGo) {
			return;
		}

		if (accessToken) {
			// Request permissions and register device
			requestPermissions();

			// Fetch initial data
			refreshNotifications();
			fetchUnreadCount();
			fetchSettings();

			// Set up notification listeners
			notificationListener.current =
				addNotificationReceivedListener(handleNotificationReceived);
			responseListener.current = addNotificationResponseListener(
				handleNotificationResponse
			);

			// Cleanup listeners on unmount
			return () => {
				notificationListener.current?.remove();
				responseListener.current?.remove();
			};
		}
	}, [
		accessToken,
		requestPermissions,
		refreshNotifications,
		fetchUnreadCount,
		fetchSettings,
		handleNotificationReceived,
		handleNotificationResponse,
	]);

	// Poll for new notifications every 30 seconds
	useEffect(() => {
		if (!accessToken) return;

		const interval = setInterval(() => {
			fetchUnreadCount();
		}, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, [accessToken, fetchUnreadCount]);

	const value: NotificationContextType = {
		notifications,
		unreadCount,
		settings,
		isLoading,
		hasMore,
		expoPushToken,
		refreshNotifications,
		loadMoreNotifications,
		markAsRead,
		markAllAsRead,
		updateSettings,
		requestPermissions,
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications(): NotificationContextType {
	const context = useContext(NotificationContext);
	if (context === undefined) {
		throw new Error(
			'useNotifications must be used within a NotificationProvider'
		);
	}
	return context;
}
