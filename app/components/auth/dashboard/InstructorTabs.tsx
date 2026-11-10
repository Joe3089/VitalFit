import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

type TabType = 'clientes' | 'clases' | 'mensajes';

type Props = {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
};

export function InstructorTabs({ activeTab, onChange }: Props) {
  const { t } = useTranslation();
  const getTextStyle = (tab: TabType) => {
    const base = 'font-bold text-center';
    const size = activeTab === tab ? 'text-[16px]' : 'text-[14px]';
    const color = activeTab === tab ? 'text-[#1F2024]' : 'text-[#71727A]';
    return `${base} ${size} ${color}`;
  };

  return (
    <View className='flex-row justify-between items-center bg-[#F8F9FB] rounded-2xl px-2 py-2 mt-6'>
      <TouchableOpacity
        onPress={() => onChange('clientes')}
        className={`flex-1 py-2 rounded-xl items-center justify-center ${
          activeTab === 'clientes' ? 'bg-white dark:bg-neutral-800' : ''
        }`}>
        <Text className={getTextStyle('clientes')}>{t('instructor.dashboard.tabs.clients')}</Text>
      </TouchableOpacity>

      <View className='w-[1px] h-[20px] bg-[#E5E5E5]' />

      <TouchableOpacity
        onPress={() => onChange('clases')}
        className={`flex-1 py-2 rounded-xl items-center justify-center ${
          activeTab === 'clases' ? 'bg-white dark:bg-neutral-800' : ''
        }`}>
        <Text className={getTextStyle('clases')}>{t('instructor.dashboard.tabs.classes')}</Text>
      </TouchableOpacity>

      <View className='w-[1px] h-[20px] bg-[#E5E5E5]' />

    </View>
  );
}
