import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedView } from '@/components/themed-view';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircleIcon, ChevronLeftIcon } from 'react-native-heroicons/solid';

interface MembershipType {
  membership_type_id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  is_active: boolean;
}

interface ClientMembershipResponse {
  data: {
    client_membership_id: string;
    membership_type: MembershipType;
    start_date: string;
    end_date: string;
    status: string;
  };
}

export default function MyMembershipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentMembership, setCurrentMembership] = useState<ClientMembershipResponse['data'] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availablePlans, setAvailablePlans] = useState<any[]>([]); 

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem('token');
          if (!token) {
             return;
          }

          // Fetch current membership using SDK generic get
          try {
              const response = await vitalFitApi.client.get({
                  url: '/client-memberships/me',
                  jwt: token
              });
              
              // Cast response to any to safely access data based on verified structure
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const json = response as any;
              if (json && json.data) {
                  setCurrentMembership(json.data);
              } else if (json && json.client_membership_id) {
                   // Fallback if response is the data itself
                   setCurrentMembership(json);
              }
          } catch (err) {
              console.error('Error fetching user membership:', err);
          }

          // Fetch all available plans
          try {
              const plansResponse = await vitalFitApi.membership.publicGetMemberships(
                  token,
                  { page: 1, limit: 10, sort: 'asc' },
                  'USD'
              );
              if (plansResponse && plansResponse.data) {
                  setAvailablePlans(plansResponse.data);
              }
          } catch (err) {
              console.error('Error fetching membership plans:', err);
          }

        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  if (loading) {
      return (
          <ThemedView className="flex-1 bg-white items-center justify-center">
              <ActivityIndicator size="large" color="#f97316" />
          </ThemedView>
      );
  }

  const currentPlanId = currentMembership?.membership_type?.membership_type_id;

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

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('myMembership.title')}</Text>
        </View>

        <View className="mb-4">
          <Text
            className="font-heading text-[14px] font-semibold text-[#111827] mb-8">
            {t('myMembership.currentPlan')}
          </Text>

          {currentMembership ? (
              <View
                className="rounded-2xl px-4 py-4 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#F97316' }}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="font-body text-xs text-[#6B7280] mb-1">{t('myMembership.currentSubscription')}</Text>
                    <Text className="font-heading text-lg font-semibold" style={{ color: '#F97316' }}>
                      {currentMembership.membership_type?.name || t('membershipDetails.unknownName')}
                    </Text>
                  </View>

                  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7' }}>
                    <Text className="font-body text-[10px] font-semibold" style={{ color: '#F97316' }}>
                      {t(`common.status.${currentMembership.status.toLowerCase()}`, { defaultValue: currentMembership.status })}
                    </Text>
                  </View>
                </View>

                <Text className="font-body text-xs mb-4" style={{ color: '#4B5563' }}>
                  {currentMembership.membership_type?.description || ''}
                </Text>

                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                      {t('myMembership.expirationDate')}
                    </Text>
                    <Text className="font-body text-xs" style={{ color: '#111827' }}>
                      {new Date(currentMembership.end_date).toLocaleDateString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="px-3 py-2 rounded-full"
                    style={{ borderColor: '#D1D5DB', borderWidth: 1 }}
                    onPress={() => router.push('/profile/membership-details')}>
                    <Text className="font-body text-[11px]" style={{ color: '#111827' }}>
                      {t('myMembership.viewDetails')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
          ) : (
              <View className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <Text className="text-gray-500 text-center">{t('myMembership.noActivePlan')}</Text>
              </View>
          )}
        </View>

        <View className="mb-3">
          <Text
            className="font-heading text-[14px] font-semibold text-[#111827] mb-8">
            {t('myMembership.allPlans')}
          </Text>

          {availablePlans.length > 0 ? (
              availablePlans.map(plan => {
                const isCurrent = plan.membership_type_id === currentPlanId && currentMembership?.status === 'Active';

                return (
                  <View
                    key={plan.membership_type_id}
                    className="mb-3 rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: isCurrent ? '#F97316' : '#E5E7EB',
                    }}>
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-1 pr-2">
                        <Text className="font-body text-xs mb-1" style={{ color: '#6B7280' }}>
                          {plan.description}
                        </Text>
                        <Text className="font-heading text-base font-semibold" style={{ color: '#F97316' }}>
                          {plan.name}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="font-heading text-lg font-semibold" style={{ color: '#111827' }}>
                          ${plan.price}
                          <Text className="font-body text-xs" style={{ color: '#6B7280' }}>
                           /{plan.duration_days}d
                          </Text>
                        </Text>

                        {isCurrent ? (
                          <View className="mt-1 flex-row items-center px-2 py-1 rounded-full"
                            style={{ backgroundColor: '#FFF7ED', borderColor: '#FDBA74', borderWidth: 1 }}>
                            <CheckCircleIcon size={14} color="#F97316" />
                            <Text className="font-body ml-1 text-[10px]" style={{ color: '#F97316' }}>
                              {t('myMembership.currentPlan')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {!isCurrent && (
                      <PrimaryButton
                        title={t('myMembership.update')}
                        onPress={() => {
                            const params = new URLSearchParams({
                                id: plan.membership_type_id,
                                title: plan.name,
                                price: plan.price.toString(),
                                period: plan.duration_days ? `${plan.duration_days} ${t('membershipDetails.days')}` : ''
                            }).toString();
                            router.push(`/membership-checkout?${params}` as never);
                        }}
                      />
                    )}
                  </View>
                );
              })
          ) : (
            <Text className="text-gray-400 text-center py-4">{t('myMembership.noOtherPlans')}</Text>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
