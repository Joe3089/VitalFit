import { ClientQRModal } from '@/components/client/ClientQRModal';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import vitalFitApi from '@/services';
import { useClerk } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from 'react-native-heroicons/outline';

export default function ClientProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useClerk();
  const { logout } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No se encontró token en AsyncStorage');
          return;
        }

        const userData = await vitalFitApi.user.WhoAmI(token);
        setFirstName(userData?.user?.first_name || t('clientProfile.defaultName'));
        setLastName(userData?.user?.last_name || '');

        // Check if user signed in via OAuth
        const oauthFlag = await AsyncStorage.getItem('is_oauth_user');
        setIsOAuthUser(oauthFlag === 'true');
      } catch (error: unknown) {
        let errorMessage = t('clientProfile.error.fetchUser');
        if (isAPIError(error)) {
          errorMessage = error.messages.join(', ');
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Error en la solicitud whoami (Perfil cliente):', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [t]);

  if (loading) {
    return (
      <ThemedView className='flex-1 justify-center items-center bg-white'>
        <ActivityIndicator size='large' color='#F27F2A' />
      </ThemedView>
    );
  }

  const displayName = lastName ? `${firstName ?? t('dashboard.defaultUser')} ${lastName}` : firstName ?? t('dashboard.defaultUser');

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await AsyncStorage.multiRemove(['temp_email', 'temp_password', 'temp_gender', 'is_oauth_user']);
    try {
      await signOut();
    } catch (error) {
      console.log('No había sesión de Clerk activa:', error);
    }
    await logout();
  };

  return (
    <ThemedView className='flex-1 bg-white pt-10'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        <View className='mb-4 items-start'>
          <View className='w-24 h-24 rounded-full overflow-hidden mb-3 bg-[#FED7AA] items-center justify-center'>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text className='font-body text-[20px] font-semibold text-[#111827]'>{displayName}</Text>
          <Text className='font-body text-[13px] text-[#6b7280] mt-1'>{t('clientProfile.member')}</Text>
          <Text className='font-body text-[13px] text-[#f97316] mt-0.5'>{t('clientProfile.activeMembership')}</Text>
        </View>
        <View className='mb-4'>
          <Text className='font-body text-[14px] font-semibold text-[#111827] mb-1'>{t('profile.aboutMe')}</Text>
          <Text className='font-body text-[13px] text-[#4b5563] leading-5'>
            {t('clientProfile.description')}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          className='w-full rounded-2xl border border-[#d1d5db] py-3 px-4 mb-4 flex-row items-center justify-center bg-white'
          onPress={() => setQrModalVisible(true)}>
          <QrCodeIcon width={18} height={18} color='#111827' />
          <Text className='font-body ml-2 text-[13px] font-medium text-[#111827]'>{t('clientProfile.myQr')}</Text>
        </TouchableOpacity>
        <View className='mb-2'>
          <Text className='font-body text-[14px] font-semibold text-[#111827] mb-2'>{t('profile.settings')}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3'
          onPress={() => {
            router.replace('/profile/my-profile');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <UserCircleIcon width={18} height={18} color='#111827' />
            </View>
            <Text className='font-body text-[13px] text-[#111827]'>{t('profile.personalInfo')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#9ca3af' />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3'
          onPress={() => {
            router.replace('/membership-entry');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <GlobeAltIcon width={18} height={18} color='#111827' />
            </View>
            <Text className='font-body text-[13px] text-[#111827]'>{t('clientProfile.membership')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#9ca3af' />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3'
          onPress={() => {
            router.replace('/profile/notifications');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <BellIcon width={18} height={18} color='#111827' />
            </View>
            <Text className='font-body text-[13px] text-[#111827]'>{t('dashboard.notifications.title')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#9ca3af' />
        </TouchableOpacity>
        {!isOAuthUser && (
          <TouchableOpacity
            activeOpacity={0.8}
            className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3'
            onPress={() => {
              router.replace('/profile/profile-settings');
            }}>
            <View className='flex-row items-center'>
              <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
                <ShieldCheckIcon width={18} height={18} color='#111827' />
              </View>
              <Text className='font-body text-[13px] text-[#111827]'>{t('profile.settings')}</Text>
            </View>
            <ChevronRightIcon width={16} height={16} color='#9ca3af' />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-3'
          onPress={() => {
            console.log('Ayuda y soporte');
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <QuestionMarkCircleIcon width={18} height={18} color='#111827' />
            </View>
            <Text className='font-body text-[13px] text-[#111827]'>{t('profile.helpSupport')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#9ca3af' />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#e5e7eb] px-4 py-3 mb-6'
          onPress={() => {
            setLogoutModalVisible(true);
          }}>
          <View className='flex-row items-center'>
            <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <ArrowRightOnRectangleIcon width={18} height={18} color='#b91c1c' />
            </View>
            <Text className='font-body text-[13px] text-[#b91c1c] font-semibold'>{t('profile.logout')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color='#b91c1c' />
        </TouchableOpacity>
      </ScrollView>
      <ClientQRModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} />
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
              className='font-body'
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
              }}>
              {t('profile.logoutConfirmTitle')}
            </Text>
            <Text
              className='font-body'
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
                <Text className='font-body' style={{ fontSize: 13, color: '#4b5563' }}>{t('common.cancel')}</Text>
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
                <Text className='font-body' style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>
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