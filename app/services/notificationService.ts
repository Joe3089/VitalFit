import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Check if we're running in Expo Go (executionEnvironment will be 'storeClient' in Expo Go)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export interface NotificationPermissionStatus {
	granted: boolean;
	canAskAgain: boolean;
	status: Notifications.PermissionStatus;
}

/**
 * Request notification permissions from the user
 */
export async function registerForPushNotificationsAsync(): Promise<
	string | null
> {
	let token: string | null = null;

	// Don't try to get push tokens in Expo Go (SDK 53+)
	if (isExpoGo) {
		return null;
	}

	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#0891B2',
		});
	}

	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;

		if (existingStatus !== 'granted') {
			const { status } = await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== 'granted') {
			return null;
		}

		try {
			// Get Expo push token (for Expo's push service)
			await Notifications.getExpoPushTokenAsync({
				projectId: '3d30457b-07b3-4a1a-9700-dc7fc3df59f2',
			});

			// Get native device push token (FCM for Android, APNs for iOS)
			const devicePushToken = await Notifications.getDevicePushTokenAsync();

			// Use the native device token for backend registration
			token = devicePushToken.data;
		} catch {
			// Error getting push token
		}
	} else {
		// Must use physical device for Push Notifications
	}

	return token;
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
	const { status, canAskAgain } = await Notifications.getPermissionsAsync();

	return {
		granted: status === 'granted',
		canAskAgain,
		status,
	};
}

/**
 * Schedule a local notification (for testing purposes)
 */
export async function scheduleLocalNotification(
	title: string,
	body: string,
	data?: Record<string, unknown>
): Promise<string> {
	return await Notifications.scheduleNotificationAsync({
		content: {
			title,
			body,
			data: data || {},
			sound: true,
		},
		trigger: null, // Show immediately
	});
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
	await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Set up notification response listeners
 */
export function addNotificationResponseListener(
	listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
	return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Set up notification received listeners (when app is in foreground)
 */
export function addNotificationReceivedListener(
	listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
	return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
	return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
	await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications from notification tray
 */
export async function dismissAllNotifications(): Promise<void> {
	await Notifications.dismissAllNotificationsAsync();
}
