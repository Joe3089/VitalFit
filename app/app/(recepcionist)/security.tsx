import { ThemedView } from '@/components/themed-view';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, ShieldCheckIcon } from 'react-native-heroicons/solid';

export default function SecurityScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(recepcionist)/profile');
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [router])
  );

  return (
    <ThemedView className="flex-1 bg-white pt-10">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
      >
        {/* Header */}
        <View
          className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center"
          style={{ position: 'relative' }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(recepcionist)/profile')}
            style={{
              position: 'absolute',
              left: 12,
              top: 8,
              bottom: 8,
              justifyContent: 'center',
            }}
          >
            <ChevronLeftIcon size={20} color="#f97316" />
          </TouchableOpacity>

          <Text
            className="font-body"
            style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}
          >
            {t('receptionist.security.title')}
          </Text>
        </View>

        {/* Section title */}
        <View className="mb-2">
          <Text className="text-[14px] font-semibold text-[#111827] mb-2">
            {t('receptionist.security.options')}
          </Text>
        </View>

        {/* Change password */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3"
          onPress={() => {
            router.push('/(recepcionist)/change-password');
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <ShieldCheckIcon size={18} color="#111827" />
            </View>
            <Text className="text-[13px] text-[#111827]">
              {t('receptionist.security.changePassword')}
            </Text>
          </View>

          <ChevronLeftIcon
            size={16}
            color="#9ca3af"
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}