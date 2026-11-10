import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedView } from '@/components/themed-view';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';

const LANGUAGES = [
  { code: 'es', name: 'Español', countryCode: 'es' },
  { code: 'en', name: 'English', countryCode: 'gb' },
  { code: 'it', name: 'Italiano', countryCode: 'it' },
  { code: 'de', name: 'Deutsch', countryCode: 'de' },
  { code: 'pt', name: 'Português', countryCode: 'pt' },
  { code: 'fr', name: 'Français', countryCode: 'fr' },
];

export default function RecepcionistLanguageScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  // Normalizamos el idioma actual para evitar errores con códigos compuestos como 'en-US'
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language.split('-')[0]);

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

  const handleSaveLanguage = () => {
    i18n.changeLanguage(selectedLanguage);
    router.replace('/(recepcionist)/profile');
  };

  return (
    <ThemedView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 96 }}
      >
        <View
          className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center"
          style={{ position: 'relative' }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(recepcionist)/profile')}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}
          >
            <ChevronLeftIcon width={20} height={20} color="#f97316" />
          </TouchableOpacity>

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
            {t('language.title')}
          </Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text className='font-heading' style={{ color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
            {t('language.changeLanguage')}
          </Text>
          <Text className='font-body' style={{ color: '#4B5563', fontSize: 13, lineHeight: 18 }}>
            {t('language.selectOption')}
          </Text>
        </View>

        <View>
          {LANGUAGES.map(lang => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                activeOpacity={0.8}
                className="w-full flex-row items-center justify-between rounded-2xl px-4 py-3 mb-3"
                style={{
                  backgroundColor: isSelected ? '#111827' : '#FFFFFF',
                  borderColor: isSelected ? '#111827' : '#E5E7EB',
                  borderWidth: 1,
                }}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ marginRight: 10 }}>
                    <CountryFlag isoCode={lang.countryCode} size={16} />
                  </View>
                  <Text
                    className='font-body'
                    style={{
                      color: isSelected ? '#F9FAFB' : '#111827',
                      fontSize: 14,
                    }}
                  >
                    {lang.name}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: isSelected ? '#F97316' : '#D1D5DB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: '#F97316',
                      }}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: 16 }}>
          <PrimaryButton title={t('save')} onPress={handleSaveLanguage} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}