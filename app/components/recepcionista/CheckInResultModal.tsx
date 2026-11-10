import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, TouchableOpacity, View } from 'react-native';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from 'react-native-heroicons/outline';

interface CheckInResultModalProps {
  visible: boolean;
  onClose: () => void;
  success: boolean;
  userName?: string;
  message?: string;
}

export function CheckInResultModal({
  visible,
  onClose,
  success,
  userName,
  message
}: CheckInResultModalProps) {
  const { t } = useTranslation();
  const displayUserName = userName || t('dashboard.defaultUser');
  const displayMessage = success
    ? message || t('common.accessGranted')
    : message || t('common.accessDenied');

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
        <View className="w-11/12 max-w-sm bg-white rounded-3xl p-6 shadow-xl">
          <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-4 right-4 p-1 bg-neutral-100 rounded-full z-10"
          >
            <XMarkIcon size={20} color="#6B7280" />
          </TouchableOpacity>
          <View className="items-center mb-4">
            <View 
              className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
                success ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {success ? (
                <CheckCircleIcon size={48} color="#10B981" />
              ) : (
                <XCircleIcon size={48} color="#EF4444" />
              )}
            </View>

            <ThemedText
              className={`text-2xl font-bold mb-2 ${
                success ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {success ? t('common.welcome') : t('common.accessDenied')}
            </ThemedText>

            <ThemedText className="text-xl font-semibold text-gray-800 mb-2">
              {displayUserName}
            </ThemedText>

            <ThemedText className="text-center text-gray-600 text-base leading-6">
              {displayMessage}
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className={`mt-4 py-3 px-6 rounded-xl ${
              success ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <ThemedText className="text-white text-center font-bold text-base">
              {t('common.accept')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
