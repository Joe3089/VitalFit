import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, ShieldCheckIcon } from 'react-native-heroicons/solid';

export default function InstructorSecurityScreen() {
  const { t } = useTranslation();
  const router = useRouter();

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

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('profileSettings.title')}</Text>
        </View>

        <View className='mb-2'>
          <Text className='font-body text-[14px] font-semibold text-[#111827] mb-2'>{t('profileSettings.options')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3'
          onPress={() => {
            router.push('/instructor-change-password');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <ShieldCheckIcon width={18} height={18} color='#111827' />
            </View>
            <Text className='font-body text-[13px] text-[#111827]'>{t('profileSettings.changePassword')}</Text>
          </View>
          <ChevronLeftIcon
            width={16}
            height={16}
            color='#9ca3af'
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}
