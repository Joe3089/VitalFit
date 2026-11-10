import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from '@/services/notificationService';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebugNotificationsScreen() {
	const router = useRouter();
	const { token } = useAuth();
	const [fcmToken, setFcmToken] = useState<string | null>(null);
	const [permissionStatus, setPermissionStatus] = useState<string>('checking...');
	const [lastNotification, setLastNotification] = useState<{
		type: string;
		time: string;
		data: Notifications.NotificationContent;
	} | null>(null);

	useEffect(() => {
		checkPermissions();
		setupListeners();
	}, []);

	const checkPermissions = async () => {
		const { status } = await Notifications.getPermissionsAsync();
		setPermissionStatus(status);
	};

	const setupListeners = () => {
		// Listen for notifications received while app is foregrounded
		const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
			console.log('🔔 Notification received in foreground:', notification);
			setLastNotification({
				type: 'foreground',
				time: new Date().toLocaleTimeString(),
				data: notification.request.content
			});
		});

		// Listen for notification taps
		const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
			console.log('👆 Notification tapped:', response);
			setLastNotification({
				type: 'tapped',
				time: new Date().toLocaleTimeString(),
				data: response.notification.request.content
			});
		});

		return () => {
			receivedSubscription.remove();
			responseSubscription.remove();
		};
	};

	const getFCMToken = async () => {
		try {
			const token = await registerForPushNotificationsAsync();
			if (token) {
				setFcmToken(token);
				Alert.alert(
					'FCM Token',
					token,
					[
						{ text: 'Copy', onPress: () => console.log('Token:', token) }
					]
				);
			} else {
				Alert.alert('Error', 'Could not get FCM token');
			}
		} catch (error) {
			Alert.alert('Error', String(error));
		}
	};

	const requestPermissions = async () => {
		const { status } = await Notifications.requestPermissionsAsync();
		setPermissionStatus(status);
		Alert.alert('Permission Status', status);
	};

	const sendTestLocalNotification = async () => {
		try {
			await scheduleLocalNotification(
				'Test Local Notification',
				'This is a test notification sent from the app',
				{ test: true }
			);
			Alert.alert('Success', 'Local notification sent!');
		} catch (error) {
			Alert.alert('Error', String(error));
		}
	};

	const checkNotificationSettings = async () => {
		const settings = await Notifications.getPermissionsAsync();
		Alert.alert(
			'Notification Settings',
			JSON.stringify(settings, null, 2)
		);
	};

	const copyFCMToken = () => {
		if (fcmToken) {
			console.log('═══════════════════════════════════════════════════════');
			console.log('📱 FCM TOKEN (copy from console):');
			console.log(fcmToken);
			console.log('═══════════════════════════════════════════════════════');
			Alert.alert('Token Logged', 'Check the console for the FCM token');
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
			<ThemedView style={{ flex: 1 }}>
				<View style={{ padding: 16 }}>
					<TouchableOpacity onPress={() => router.back()}>
						<ThemedText style={{ fontSize: 16, marginBottom: 20 }}>← Back</ThemedText>
					</TouchableOpacity>

					<ThemedText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
						Push Notification Debugger
					</ThemedText>

					<ScrollView style={{ flex: 1 }}>
						{/* Status Section */}
						<View style={{ marginBottom: 20, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
							<Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Status</Text>
							<Text>Permission: {permissionStatus}</Text>
							<Text>Authenticated: {token ? 'Yes' : 'No'}</Text>
							<Text>FCM Token: {fcmToken ? '✓ Retrieved' : '✗ Not retrieved'}</Text>
						</View>

						{/* Last Notification */}
						{lastNotification && (
							<View style={{ marginBottom: 20, padding: 16, backgroundColor: '#e8f5e9', borderRadius: 8 }}>
								<Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
									Last Notification ({lastNotification.type})
								</Text>
								<Text>Time: {lastNotification.time}</Text>
								<Text>Title: {lastNotification.data.title}</Text>
								<Text>Body: {lastNotification.data.body}</Text>
								<Text style={{ fontSize: 12, marginTop: 8 }}>
									Data: {JSON.stringify(lastNotification.data.data)}
								</Text>
							</View>
						)}

						{/* Actions */}
						<View style={{ gap: 12 }}>
							<PrimaryButton
								title="1. Request Permissions"
								onPress={requestPermissions}
							/>

							<PrimaryButton
								title="2. Get FCM Token"
								onPress={getFCMToken}
							/>

							{fcmToken && (
								<PrimaryButton
									title="Copy FCM Token to Console"
									onPress={copyFCMToken}
								/>
							)}

							<PrimaryButton
								title="3. Send Test Local Notification"
								onPress={sendTestLocalNotification}
							/>

							<PrimaryButton
								title="Check Notification Settings"
								onPress={checkNotificationSettings}
							/>

							<View style={{ marginTop: 20, padding: 16, backgroundColor: '#fff3cd', borderRadius: 8 }}>
								<Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
									Testing Push Notifications:
								</Text>
								<Text style={{ fontSize: 12, marginBottom: 4 }}>
									1. Click &quot;Get FCM Token&quot; and copy it
								</Text>
								<Text style={{ fontSize: 12, marginBottom: 4 }}>
									2. Ask backend to send a test push to that token
								</Text>
								<Text style={{ fontSize: 12, marginBottom: 4 }}>
									3. Close/background this app
								</Text>
								<Text style={{ fontSize: 12, marginBottom: 4 }}>
									4. Backend sends push notification
								</Text>
								<Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 8 }}>
									⚠️ Push notifications only appear when app is in background!
								</Text>
							</View>

							{fcmToken && (
								<View style={{ marginTop: 12, padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8 }}>
									<Text style={{ fontSize: 12, fontFamily: 'monospace' }} selectable>
										{fcmToken}
									</Text>
								</View>
							)}
						</View>
					</ScrollView>
				</View>
			</ThemedView>
		</SafeAreaView>
	);
}
