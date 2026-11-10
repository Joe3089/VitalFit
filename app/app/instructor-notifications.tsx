import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';
import { useTranslation } from 'react-i18next';

export default function InstructorNotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const mockNotifications = [
    {
      id: '1',
      title: t('instructorNotifications.mock.classReminder'),
      body: t('instructorNotifications.mock.classReminderBody'),
      dateLabel: 'Sep 9, 2024',
    },
    {
      id: '2',
      title: t('instructorNotifications.mock.clientProgress'),
      body: t('instructorNotifications.mock.clientProgressBody'),
      dateLabel: 'Sep 9, 2024',
    },
    {
      id: '3',
      title: t('instructorNotifications.mock.classReminder'),
      body: t('instructorNotifications.mock.hiitClassBody'),
      dateLabel: 'Sep 8, 2024',
    },
  ];

  const handleOpenSettings = () => {
    router.push('/instructor-notifications-settings');
  };

  return (
    <ThemedView className='flex-1 bg-white pt-10'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        <View
          className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center'
          style={{ position: 'relative' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
            <ChevronLeftIcon width={20} height={20} color='#f97316' />
          </TouchableOpacity>

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('notifications.title')}</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenSettings}
            style={{ position: 'absolute', right: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
            <Text className='font-body' style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>{t('notifications.configure')}</Text>
          </TouchableOpacity>
        </View>
        <Text className='font-body' style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, marginTop: 8 }}>{t('notifications.timeLabels.today')}</Text>
        {mockNotifications.slice(0, 2).map((n) => (
          <View
            key={n.id}
            style={{
              backgroundColor: '#ffffff',
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
              <Text className='font-body' style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>{t('notifications.badges.gym')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                className='font-body'
                style={{
                  color: '#111827',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 2,
                }}
                numberOfLines={1}>
                {n.title}
              </Text>
              <Text
                className='font-body'
                style={{ color: '#4b5563', fontSize: 12, marginBottom: 4 }}
                numberOfLines={2}>
                {n.body}
              </Text>
              <Text className='font-body' style={{ color: '#9ca3af', fontSize: 11 }}>{n.dateLabel}</Text>
            </View>
          </View>
        ))}

        <Text className='font-body' style={{ color: '#6b7280', fontSize: 13, marginBottom: 8, marginTop: 16 }}>{t('notifications.timeLabels.yesterday')}</Text>
        {mockNotifications.slice(2).map((n) => (
          <View
            key={n.id}
            style={{
              backgroundColor: '#ffffff',
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
              <Text className='font-body' style={{ color: '#166534', fontSize: 12, fontWeight: '700' }}>{t('notifications.badges.gym')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                className='font-body'
                style={{
                  color: '#111827',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 2,
                }}
                numberOfLines={1}>
                {n.title}
              </Text>
              <Text
                className='font-body'
                style={{ color: '#4b5563', fontSize: 12, marginBottom: 4 }}
                numberOfLines={2}>
                {n.body}
              </Text>
              <Text className='font-body' style={{ color: '#9ca3af', fontSize: 11 }}>{n.dateLabel}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}
