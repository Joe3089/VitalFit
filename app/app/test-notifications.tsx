import { ThemedView } from '@/components/themed-view';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Clipboard,
} from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';
import { scheduleLocalNotification } from '@/services/notificationService';

export default function TestNotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    expoPushToken,
    refreshNotifications,
    requestPermissions,
  } = useNotifications();

  const handleCopyToken = () => {
    if (expoPushToken) {
      Clipboard.setString(expoPushToken);
      Alert.alert('Success', 'Push token copied to clipboard!');
    } else {
      Alert.alert('Error', 'No push token available');
    }
  };

  const handleSendLocalNotification = async () => {
    try {
      await scheduleLocalNotification(
        'Test Notification',
        'This is a local test notification from VitalFit!',
        { source: 'test-screen' }
      );
      Alert.alert('Success', 'Local notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert('Error', 'Notification permissions denied');
    }
  };

  const handleRefresh = async () => {
    await refreshNotifications();
    Alert.alert('Success', 'Notifications refreshed!');
  };

  return (
    <ThemedView className="flex-1 bg-white pt-10">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        {/* Header */}
        <View
          className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center"
          style={{ position: 'relative' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              left: 12,
              top: 8,
              bottom: 8,
              justifyContent: 'center',
            }}>
            <ChevronLeftIcon width={20} height={20} color="#f97316" />
          </TouchableOpacity>

          <Text
            className="font-heading"
            style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
            Test Notifications
          </Text>
        </View>

        {/* Device Info */}
        <View
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
          <Text
            className="font-heading"
            style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
            Device Information
          </Text>

          <View style={{ marginBottom: 8 }}>
            <Text className="font-body" style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              Push Token:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                className="font-body"
                style={{ flex: 1, fontSize: 11, color: '#111827', fontFamily: 'monospace' }}
                numberOfLines={2}>
                {expoPushToken || 'Not available'}
              </Text>
              {expoPushToken && (
                <TouchableOpacity
                  onPress={handleCopyToken}
                  style={{
                    backgroundColor: '#f97316',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}>
                  <Text className="font-body" style={{ color: 'white', fontSize: 12 }}>
                    Copy
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text className="font-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Unread Count: <Text style={{ color: '#111827', fontWeight: '600' }}>{unreadCount}</Text>
            </Text>
          </View>

          <View>
            <Text className="font-body" style={{ fontSize: 12, color: '#6b7280' }}>
              Total Notifications: <Text style={{ color: '#111827', fontWeight: '600' }}>{notifications.length}</Text>
            </Text>
          </View>
        </View>

        {/* Test Actions */}
        <View
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
          <Text
            className="font-heading"
            style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
            Test Actions
          </Text>

          <TouchableOpacity
            onPress={handleRequestPermissions}
            style={{
              backgroundColor: '#f97316',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}>
            <Text
              className="font-body"
              style={{ color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              Request Permissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendLocalNotification}
            style={{
              backgroundColor: '#0891B2',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}>
            <Text
              className="font-body"
              style={{ color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              Send Local Notification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              backgroundColor: '#6366F1',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
            }}>
            <Text
              className="font-body"
              style={{ color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
              Refresh Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View
          style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
          <Text
            className="font-heading"
            style={{ fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 8 }}>
            Testing Instructions
          </Text>

          <Text className="font-body" style={{ fontSize: 13, color: '#92400E', marginBottom: 8 }}>
            1. Press &ldquo;Request Permissions&rdquo; to enable notifications
          </Text>

          <Text className="font-body" style={{ fontSize: 13, color: '#92400E', marginBottom: 8 }}>
            2. Copy your push token and save it somewhere
          </Text>

          <Text className="font-body" style={{ fontSize: 13, color: '#92400E', marginBottom: 8 }}>
            3. Press &ldquo;Send Local Notification&rdquo; to test local notifications
          </Text>

          <Text className="font-body" style={{ fontSize: 13, color: '#92400E', marginBottom: 8 }}>
            4. Check console logs for device token registration attempts
          </Text>

          <Text className="font-body" style={{ fontSize: 13, color: '#92400E' }}>
            5. Use Expo&apos;s push notification tool to send test notifications to your token
          </Text>
        </View>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View
            style={{
              backgroundColor: '#F3F4F6',
              borderRadius: 16,
              padding: 16,
            }}>
            <Text
              className="font-heading"
              style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
              Recent Notifications ({notifications.length})
            </Text>

            {notifications.slice(0, 3).map((notif) => (
              <View
                key={notif.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                }}>
                <Text
                  className="font-heading"
                  style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                  {notif.title}
                </Text>
                <Text
                  className="font-body"
                  style={{ fontSize: 12, color: '#6b7280' }}
                  numberOfLines={2}>
                  {notif.body}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
