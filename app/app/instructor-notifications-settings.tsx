import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { BellIcon, ChevronLeftIcon } from 'react-native-heroicons/solid';
import { useTranslation } from 'react-i18next';

export default function InstructorNotificationsSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [classReminders, setClassReminders] = useState(true);
  const [routineUpdates, setRoutineUpdates] = useState(true);

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

          <Text className='font-body' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('notificationsSettings.title')}</Text>
        </View>

        <View
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <BellIcon width={20} height={20} color='#111827' />
            <Text className='font-heading' style={{ marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#111827' }}>
              {t('notificationsSettings.notifications')}
            </Text>
          </View>
          <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
            {t('notificationsSettings.description')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text className='font-body' style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                {t('notificationsSettings.classReminders.title')}
              </Text>
              <Text className='font-body' style={{ fontSize: 12, color: '#6b7280' }}>
                {t('notificationsSettings.classReminders.description')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
              thumbColor={classReminders ? '#F97316' : '#FFFFFF'}
              onValueChange={setClassReminders}
              value={classReminders}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text className='font-body' style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                {t('notificationsSettings.routineUpdates.title')}
              </Text>
              <Text className='font-body' style={{ fontSize: 12, color: '#6b7280' }}>
                {t('notificationsSettings.routineUpdates.description')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
              thumbColor={routineUpdates ? '#F97316' : '#FFFFFF'}
              onValueChange={setRoutineUpdates}
              value={routineUpdates}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
