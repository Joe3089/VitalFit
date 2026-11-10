import { QRScannerModal } from '@/components/recepcionist/QRScannerModal';
import { CheckInResultModal } from '@/components/recepcionista/CheckInResultModal';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChevronRightIcon,
  LanguageIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UserCircleIcon
} from 'react-native-heroicons/outline';

export default function RecepcionistProfileComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: userLoading, clearUser } = useUser();
  const { logout } = useAuth();
  const { selectedBranchId } = useBranch();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInUserName, setCheckInUserName] = useState('');
  const [checkInMessage, setCheckInMessage] = useState('');

  if (userLoading && !user) {
    return (
      <ThemedView className='flex-1 justify-center items-center bg-white'>
        <ActivityIndicator size='large' color='#F27F2A' />
      </ThemedView>
    );
  }

  const displayName = user
    ? user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName
    : t('dashboard.recepcionistDefault');



  const handleValidateMembership = async (qrJwtLong: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      if (!selectedBranchId) {
        Alert.alert(`${t('common.attention')}`, t('checkIn.error.selectBranch'));
        return;
      }
      const branchId = selectedBranchId;

      console.log("Enviando Check-In...", { qrJwtLong: qrJwtLong.substring(0, 20) + '...', branchId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (vitalFitApi as any).access.checkIn(
        token,
        {
          qr_jwt: qrJwtLong,
          branch_id: branchId
        }
      );

      const data = response.data || response;

      console.log('[Check-In] Respuesta completa:', JSON.stringify(data, null, 2));

      let userName = t('dashboard.defaultUser');

      if (data?.user?.first_name) {
        userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
      } else if (data?.first_name) {
        userName = `${data.first_name} ${data.last_name || ''}`.trim();
      } else if (data?.name) {
        userName = data.name;
      }

      setCheckInSuccess(true);
      setCheckInUserName(userName);
      setResultModalVisible(true);
      setScannerVisible(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error en Check-In:", error);

      let errorMessage = t('checkIn.error.default');

      if (isAPIError(error)) {
        if (error.status === 402) {
          errorMessage = t('checkIn.error.paymentPending');
        } else if (error.status === 403) {
          errorMessage = t('checkIn.error.accessDenied');
        } else if (error.status === 401) {
          errorMessage = t('checkIn.error.qrExpired');
        } else {
          errorMessage = error.message || t('checkIn.error.default');
        }
      } else {
        errorMessage = error.message || t('common.error.connection');
      }

      setCheckInSuccess(false);
      setCheckInMessage(errorMessage);
      setResultModalVisible(true);
    }
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    clearUser();
    await logout();
  };

  return (
    <ThemedView className='flex-1 bg-white pt-10'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        <View className='mb-4 items-start'>
          <UserAvatar
            name={displayName}
            imageUrl={user?.profilePicture}
            size={96}
            style={{ marginBottom: 12 }}
          />
          <Text className='text-[20px] font-semibold text-[#111827]'>{displayName}</Text>
          <Text className='text-[13px] text-[#6b7280] mt-1'>{user?.roleName || t('dashboard.recepcionistDefault')}</Text>
          <Text className='text-[13px] text-[#f97316] mt-0.5'>{t('profile.staffViralFit')}</Text>
        </View>
        <View className='mb-4'>
          <Text className='text-[13px] text-[#4b5563] leading-5'>
            {t('profile.aboutMeDescription')}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className='w-full rounded-2xl border border-[#f97316] py-3 px-4 mb-4 flex-row items-center justify-center bg-white'
          onPress={() => setScannerVisible(true)}>
          <QrCodeIcon width={18} height={18} color='#f97316' />
          <Text className='ml-2 text-[13px] font-medium text-[#f97316]'>{t('dashboard.validateCheckIn.scanQr')}</Text>
        </TouchableOpacity>

        <View className='mb-2'>
          <Text className='text-[14px] font-semibold text-[#111827] mb-2'>{t('profile.settings')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
          onPress={() => {
            router.push('/(recepcionist)/personal-info');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <UserCircleIcon width={18} height={18} color='#f97316' />
            </View>
            <Text className='text-[13px] text-[#f97316]'>{t('profile.personalInfo')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#f97316' />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
          onPress={() => {
            router.push('/(recepcionist)/security');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <ShieldCheckIcon width={18} height={18} color='#f97316' />
            </View>
            <Text className='text-[13px] text-[#f97316]'>{t('profile.security')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#f97316' />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
          onPress={() => {
            router.push('/(recepcionist)/language');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <LanguageIcon width={18} height={18} color='#f97316' />
            </View>
            <Text className='text-[13px] text-[#f97316]'>{t('profile.language')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#f97316' />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
          onPress={() => {
            router.push('/(recepcionist)/notifications');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <BellIcon width={18} height={18} color='#f97316' />
            </View>
            <Text className='text-[13px] text-[#f97316]'>{t('dashboard.notifications.title')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#f97316' />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-6'
          onPress={() => {
            setLogoutModalVisible(true);
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <ArrowRightOnRectangleIcon width={18} height={18} color='#b91c1c' />
            </View>
            <Text className='text-[13px] text-[#b91c1c] font-semibold'>{t('profile.logout')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#b91c1c' />
        </TouchableOpacity>
      </ScrollView>

      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleValidateMembership}
      />

      <CheckInResultModal
        visible={resultModalVisible}
        onClose={() => setResultModalVisible(false)}
        success={checkInSuccess}
        userName={checkInUserName}
        message={checkInMessage}
      />

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
              }}>
              {t('profile.logoutConfirmTitle')}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#4b5563',
                marginBottom: 16,
              }}>
              {t('profile.logoutConfirmMessage')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLogoutModalVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }}>
                <Text style={{ fontSize: 13, color: '#4b5563' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleConfirmLogout}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: '#f97316',
                }}>
                <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>
                  {t('profile.logout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
