import { ThemedView } from '@/components/themed-view';
import { useNotifications } from '@/contexts/NotificationContext';
import { format, isToday, isYesterday } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    notifications,
    isLoading,
    refreshNotifications,
    markAsRead,
  } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [router]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack(); 
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [handleBack])
  );

  const handleOpenSettings = () => {
    router.push('/profile/notifications-settings');
  };

  const handleNotificationPress = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  // Group notifications by today/yesterday/older
  const groupedNotifications = React.useMemo(() => {
    const today: typeof notifications = [];
    const yesterday: typeof notifications = [];
    const older: typeof notifications = [];

    notifications.forEach((notif) => {
      const date = new Date(notif.createdAt);
      if (isToday(date)) {
        today.push(notif);
      } else if (isYesterday(date)) {
        yesterday.push(notif);
      } else {
        older.push(notif);
      }
    });

    return { today, yesterday, older };
  }, [notifications]);

  const NotificationItem = ({
    notification,
  }: {
    notification: (typeof notifications)[0];
  }) => {
    const isUnread = !notification.read;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(notification.id)}>
        <View
          style={{
            backgroundColor: isUnread ? '#FEF3C7' : '#ffffff',
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 12,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'flex-start',
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#BBF7D0',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}>
            <Text
              className="font-body"
              style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>
              {t('notifications.badges.gym')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              className="font-heading"
              style={{
                color: '#111827',
                fontSize: 13,
                fontWeight: isUnread ? '700' : '600',
                marginBottom: 2,
              }}
              numberOfLines={1}>
              {notification.title}
            </Text>
            <Text
              className="font-body"
              style={{ color: '#4b5563', fontSize: 12, marginBottom: 4 }}
              numberOfLines={2}>
              {notification.body}
            </Text>
            <Text className="font-body" style={{ color: '#9ca3af', fontSize: 11 }}>
              {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView className='flex-1 bg-white pt-10'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Header */}
        <View
          className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center'
          style={{ position: 'relative' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
            <ChevronLeftIcon width={20} height={20} color='#f97316' />
          </TouchableOpacity>

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
            {t('notifications.title')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenSettings}
            style={{ position: 'absolute', right: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
            <Text className='font-body' style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>
              {t('notifications.configure')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {notifications.length === 0 && !isLoading && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 40,
            }}>
            <Text
              className="font-body"
              style={{ color: '#6b7280', fontSize: 14 }}>
              {t('notifications.noNotifications') || 'No notifications'}
            </Text>
          </View>
        )}

        {/* Today's Notifications */}
        {groupedNotifications.today.length > 0 && (
          <>
            <Text className='font-body' style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, marginTop: 8 }}>
              {t('notifications.timeLabels.today')}
            </Text>
            {groupedNotifications.today.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </>
        )}

        {/* Yesterday's Notifications */}
        {groupedNotifications.yesterday.length > 0 && (
          <>
            <Text className='font-body' style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, marginTop: 16 }}>
              {t('notifications.timeLabels.yesterday')}
            </Text>
            {groupedNotifications.yesterday.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </>
        )}

        {/* Older Notifications */}
        {groupedNotifications.older.length > 0 && (
          <>
            <Text className='font-body' style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, marginTop: 16 }}>
              Older
            </Text>
            {groupedNotifications.older.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 20,
            }}>
            <ActivityIndicator size="small" color="#f97316" />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
