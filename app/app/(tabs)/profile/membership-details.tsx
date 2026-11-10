import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';

interface MembershipDetail {
  client_membership_id: string;
  membership_type_id: string;
  start_date: string;
  end_date: string;
  status: string;
  membership_type: {
    name: string;
    description: string;
    price: number;
    duration_days: number;
  };
}

interface CancellationReason {
  reason_id: string;
  description: string;
  is_active: boolean;
}

export default function MembershipDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { fetchUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [membershipDetail, setMembershipDetail] = useState<MembershipDetail | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string; }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });
  
  // Cancellation State
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellationReasons, setCancellationReasons] = useState<CancellationReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [loadingReasons, setLoadingReasons] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
          const response = await vitalFitApi.client.get({
              url: '/client-memberships/me',
              jwt: token
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const json = response as any;
          if (json && json.data) {
              setMembershipDetail(json.data);
          } else if (json && json.client_membership_id) {
               setMembershipDetail(json);
          }
        } catch (error) {
          console.error('Error fetching membership details:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const fetchCancellationReasons = async () => {
    try {
      setLoadingReasons(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await vitalFitApi.client.get({
        url: '/memberships/cancellation-reasons',
        jwt: token
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = response as any;
      if (json && json.data) {
        setCancellationReasons(json.data);
      }
    } catch (error) {
      console.error('Error fetching cancellation reasons:', error);
      setToast({
          visible: true,
          type: 'error',
          title: t('membershipCancellation.errors.processError'), // Reusing process error or similar generic
          message: t('membershipCancellation.errors.fetchReasons'),
      });
    } finally {
      setLoadingReasons(false);
    }
  };

  const handleCancelMembership = () => {
      setCancelModalVisible(true);
      fetchCancellationReasons();
  };

  const confirmCancellation = async () => {
    if (!selectedReasonId || !membershipDetail) return;

    try {
      setProcessingCancellation(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const body = {
        cancel_notes: cancelNotes,
        cancel_reason_id: selectedReasonId,
        status: "Cancelled" 
      };

       
      await vitalFitApi.client.put({
          url: `/client-memberships/${membershipDetail.client_membership_id}`,
          jwt: token,
          data: body 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any); // Type assertion needed if SDK types are strict

      // Close modal first
      setCancelModalVisible(false);
      
      // Update global state
      await fetchUser(); 
      
      // Show success toast
      setToast({
          visible: true,
          type: 'success',
          title: t('membershipCancellation.success'), // Or a generic success title
          message: t('membershipCancellation.success'),
      });

      // Navigate back after a short delay to let user see the toast
      setTimeout(() => {
          router.back(); 
      }, 2000);

    } catch (error) {
      console.error('Error cancelling membership:', error);
      setToast({
          visible: true,
          type: 'error',
          title: t('membershipCancellation.errors.processError'),
          message: t('membershipCancellation.errors.processError'),
      });
    } finally {
      setProcessingCancellation(false);
    }
  };

  if (loading) {
    return (
      <ThemedView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </ThemedView>
    );
  }

  if (!membershipDetail) {
    return (
        <ThemedView className="flex-1 bg-white">
            <View className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center relative mt-10 mx-4">
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.back()}
                    style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
                    <ChevronLeftIcon width={20} height={20} color="#f97316" />
                </TouchableOpacity>
                <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('membershipDetails.title')}</Text>
            </View>
            <View className="flex-1 items-center justify-center font-body">
                <Text style={{ color: '#111827' }}>{t('membershipDetails.notFound')}</Text>
            </View>
        </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 96 }}>
        <View
          className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center"
          style={{ position: 'relative' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
            <ChevronLeftIcon width={20} height={20} color="#f97316" />
          </TouchableOpacity>

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('membershipDetails.title')}</Text>
        </View>

        <View className="mb-4">
          <Text className="font-heading text-[14px] font-semibold text-[#111827] mb-2">{t('membershipDetails.currentPlan')}</Text>

          <View
            className="rounded-2xl px-4 py-4 border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#F97316' }}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1 mr-2">
                <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                  {membershipDetail.membership_type?.name || t('membershipDetails.unknownName')}
                </Text>
                <Text className="font-heading text-sm font-semibold" style={{ color: '#F97316' }}>
                  {membershipDetail.membership_type?.description || ''}
                </Text>
              </View>

              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
                <Text className="font-body text-[10px] font-semibold" style={{ color: '#F97316' }}>
                  {t(`common.status.${membershipDetail.status.toLowerCase()}`, { defaultValue: membershipDetail.status })}
                </Text>
              </View>
            </View>

             <View className="mb-4 flex-row justify-between">
               <View>
                  <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                    {t('membershipDetails.price')}
                  </Text>
                  <Text className="font-body text-sm font-semibold" style={{ color: '#111827' }}>
                    ${membershipDetail.membership_type?.price}
                  </Text>
               </View>
               <View>
                  <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                    {t('membershipDetails.duration')}
                  </Text>
                  <Text className="font-body text-sm font-semibold" style={{ color: '#111827' }}>
                    {membershipDetail.membership_type?.duration_days} {t('membershipDetails.days')}
                  </Text>
               </View>
            </View>

            <View className="mb-4">
              <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                {t('membershipDetails.startDate')}
              </Text>
              <Text className="font-body text-xs" style={{ color: '#111827' }}>
                {formatDate(membershipDetail.start_date)}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                {t('membershipDetails.expirationDate')}
              </Text>
              <Text className="font-body text-xs" style={{ color: '#111827' }}>
                {formatDate(membershipDetail.end_date)}
              </Text>
            </View>
            
          </View>

          {membershipDetail.status === 'Active' && (
            <TouchableOpacity
              onPress={handleCancelMembership}
              className="w-full py-4 mt-4 rounded-xl items-center border border-red-500"
            >
                <Text className="text-red-500 font-semibold font-body">
                    {t('membershipDetails.cancelButton')}
                </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modal de Cancelación */}
        <Modal
          visible={isCancelModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-6 h-[80%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="font-heading text-xl font-bold text-gray-900">
                  {t('membershipCancellation.modalTitle')}
                </Text>
                <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                  <Text className="text-gray-500 font-body">{t('membershipCancellation.close')}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="font-body text-gray-600 mb-4">
                  {t('membershipCancellation.selectReason')}
                </Text>

                {loadingReasons ? (
                  <ActivityIndicator size="small" color="#f97316" className="my-4" />
                ) : (
                  cancellationReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.reason_id}
                      className={`flex-row items-center p-4 mb-3 rounded-xl border ${
                        selectedReasonId === reason.reason_id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                      onPress={() => setSelectedReasonId(reason.reason_id)}
                    >
                      <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${
                         selectedReasonId === reason.reason_id ? 'border-orange-500' : 'border-gray-300'
                      }`}>
                        {selectedReasonId === reason.reason_id && (
                          <View className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        )}
                      </View>
                      <Text className={`font-body ${selectedReasonId === reason.reason_id ? 'text-orange-900 font-semibold' : 'text-gray-700'}`}>
                        {reason.description}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}

                <Text className="font-body text-gray-600 mt-4 mb-2">{t('membershipCancellation.commentsLabel')}</Text>
                <TextInput
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-body min-h-[100px]"
                  style={{ textAlignVertical: 'top' }}
                  multiline
                  placeholder={t('membershipCancellation.commentsPlaceholder')}
                  value={cancelNotes}
                  onChangeText={setCancelNotes}
                />

                <View className="mt-6">
                  {processingCancellation ? (
                    <ActivityIndicator size="large" color="#f97316" />
                  ) : (
                    <PrimaryButton
                      title={t('membershipCancellation.confirmButton')}
                      onPress={confirmCancellation}
                      disabled={!selectedReasonId}
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <ToastNotification
            visible={toast.visible}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      </ScrollView>
    </ThemedView>
  );
}
