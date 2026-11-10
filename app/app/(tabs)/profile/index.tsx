import { QRModal } from '@/components/auth/dashboard/QRModal';
import { FaceEnrollmentModal } from '@/components/client/FaceEnrollmentModal';
import { ToastNotification } from '@/components/ToastNotification';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/reservations';
import { useUser } from '@/contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ArrowRightOnRectangleIcon,
  CameraIcon,
  ChevronRightIcon,
  CreditCardIcon,
  LanguageIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserCircleIcon
} from 'react-native-heroicons/outline';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading, clearUser, fetchUser } = useUser();
  const { logout } = useAuth();
  const { clearReservations } = useReservations();
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [faceEnrollmentModalVisible, setFaceEnrollmentModalVisible] = useState(false);
  const [userToken, setUserToken] = useState<string>('');
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setUserToken(token);
      }
    };
    fetchToken();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-neutral-950">
        <ActivityIndicator size="large" color="#F27F2A" />
      </View>
    );
  }

  const displayName = user
    ? user.lastName
      ? `${user.firstName || t('client.profile.defaultUser')} ${user.lastName}`
      : user.firstName || t('client.profile.defaultUser')
    : t('client.profile.defaultUser');

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await clearReservations();
    clearUser();
    await logout();
  };

  const handleFaceEnrollmentSuccess = async () => {
    setFaceEnrollmentModalVisible(false);
    // Refresh user data to update face_auth_enabled status
    await fetchUser();
    setToast({
      visible: true,
      type: 'success',
      title: t('faceEnrollment.toast.successTitle'),
      message: t('faceEnrollment.toast.successMessage'),
    });
  };

  const handleFaceEnrollmentError = (error: string) => {
    setFaceEnrollmentModalVisible(false);
    setToast({
      visible: true,
      type: 'error',
      title: t('faceEnrollment.toast.errorTitle'),
      message: error || t('faceEnrollment.toast.errorMessage'),
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 96 }}
      >
        <View className="mb-4 items-start">
          <UserAvatar
            name={displayName}
            imageUrl={user?.profilePicture}
            size={96}
            style={{ marginBottom: 12 }}
          />
          <Text className="text-[20px] font-semibold text-[#111827]">{displayName}</Text>
          {(user?.roleName === 'Instructor' || user?.roleName === 'Staff') ? (
            <>
              <Text className="text-[13px] text-[#6b7280] mt-1">{user?.specialty || t('client.profile.personalTrainer')}</Text>
              <Text className="text-[13px] text-[#f97316] mt-0.5">{user?.roleName}</Text>
            </>
          ) : (
            <>

              <Text className="text-[13px] text-[#f97316] mt-0.5">{user?.category || t('client.profile.premium')}</Text>
            </>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-[13px] text-[#4b5563] leading-5">
            {t('client.profile.aboutMeDescription')}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          className="w-full rounded-2xl border border-[#f97316] py-3 px-4 mb-4 flex-row items-center justify-center bg-white"
          onPress={() => setQrModalVisible(true)}
        >
          <QrCodeIcon width={18} height={18} color="#f97316" />
          <Text className="ml-2 text-[13px] font-medium text-[#f97316]">{t('client.profile.checkIn')}</Text>
        </TouchableOpacity>

        {!user?.faceAuthEnabled && (
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-4"
            onPress={() => setFaceEnrollmentModalVisible(true)}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
                <CameraIcon width={18} height={18} color="#f97316" />
              </View>
              <Text className="text-[13px] text-[#f97316]">{t('faceEnrollment.setupButton')}</Text>
            </View>
            <ChevronRightIcon width={16} height={16} color="#f97316" />
          </TouchableOpacity>
        )}

        <View className="mb-2">
          <Text className="text-[14px] font-semibold text-[#111827] mb-2">{t('client.profile.settings')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3"
          onPress={() => {
            router.push('/profile/my-profile');
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <UserCircleIcon width={18} height={18} color="#f97316" />
            </View>
            <Text className="text-[13px] text-[#f97316]">{t('client.profile.personalInfo')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color="#f97316" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3"
          onPress={() => {
            router.push('/profile/profile-settings');
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <ShieldCheckIcon width={18} height={18} color="#f97316" />
            </View>
            <Text className="text-[13px] text-[#f97316]">{t('client.profile.security')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color="#f97316" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3"
          onPress={() => {
            router.push('/profile/my-membership');
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <TicketIcon width={18} height={18} color="#f97316" />
            </View>
            <Text className="text-[13px] text-[#f97316]">{t('client.profile.myMembership')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color="#f97316" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3"
          onPress={() => {
            router.push('/profile/language');
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <LanguageIcon width={18} height={18} color="#f97316" />
            </View>
            <Text className="text-[13px] text-[#f97316]">{t('client.profile.language')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color="#f97316" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3"
          onPress={() => {
            router.push('/profile/payment-history');
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <CreditCardIcon width={18} height={18} color="#f97316" />
            </View>
            <Text className="text-[13px] text-[#f97316]">{t('client.profile.paymentHistory')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color="#f97316" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-6"
          onPress={() => {
            setLogoutModalVisible(true);
          }}
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <ArrowRightOnRectangleIcon width={18} height={18} color="#b91c1c" />
            </View>
            <Text className="text-[13px] text-[#b91c1c] font-semibold">{t('client.profile.logout')}</Text>
          </View>
          <ChevronRightIcon width={16} height={16} color="#b91c1c" />
        </TouchableOpacity>
      </ScrollView>

      <QRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        token={userToken}
        userName={displayName}
      />

      <FaceEnrollmentModal
        visible={faceEnrollmentModalVisible}
        onClose={() => setFaceEnrollmentModalVisible(false)}
        onSuccess={handleFaceEnrollmentSuccess}
        onError={handleFaceEnrollmentError}
      />

      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
              }}
            >
              {t('client.profile.logoutConfirm.title')}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#4b5563',
                marginBottom: 16,
              }}
            >
              {t('client.profile.logoutConfirm.message')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLogoutModalVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }}
              >
                <Text style={{ fontSize: 13, color: '#4b5563' }}>{t('client.profile.logoutConfirm.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleConfirmLogout}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: '#f97316',
                }}
              >
                <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>
                  {t('client.profile.logout')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}