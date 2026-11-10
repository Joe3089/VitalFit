import { ThemedText } from '@/components/themed-text';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { CheckCircleIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BranchPaymentMethod {
  method_id: string;
  branch_id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export default function MembershipMethodsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [methods, setMethods] = useState<BranchPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if(!token) return;

            const res = await vitalFitApi.paymentMethod.getBranchPaymentMethods(params.branchId as string, token);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (res.data || res || []) as any[];
            const activeMethods = (data as BranchPaymentMethod[]).filter(m => m.is_active);
            setMethods(activeMethods);

            if (activeMethods.length > 0) {
              setSelectedMethodId(activeMethods[0].method_id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    load();
  }, [params.branchId]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-8 pb-4">
        <View className="mb-6">
          <ThemedText
            lightColor="#f97316"
            darkColor="#f97316"
            className="font-heading text-4xl mb-4 text-center"
            style={{ fontFamily: 'BebasNeue-Regular' }}>
            {t('methods.title')}
          </ThemedText>

          <View className="flex-row justify-between items-center mb-4">
            <View className="items-center flex-1">
              <View className="w-8 h-8 rounded-full items-center justify-center mb-1 border bg-white border-neutral-400">
                <ThemedText className="font-body text-[10px] font-semibold text-gray-800">1</ThemedText>
              </View>
              <ThemedText className="font-body text-[11px] text-center text-gray-800">{t('checkout.steps.options')}</ThemedText>
            </View>

            <View className="items-center flex-1">
              <View className="w-8 h-8 rounded-full items-center justify-center mb-1 border bg-white border-neutral-400">
                <ThemedText className="font-body text-[10px] font-semibold text-gray-800">2</ThemedText>
              </View>
              <ThemedText className="font-body text-[11px] text-center text-gray-800">{t('checkout.steps.extras')}</ThemedText>
            </View>

            <View className="items-center flex-1">
              <View className="w-8 h-8 rounded-full items-center justify-center mb-1 border bg-white border-neutral-400">
                <ThemedText className="font-body text-[10px] font-semibold text-gray-800">3</ThemedText>
              </View>
              <ThemedText className="font-body text-[11px] text-center text-gray-800">{t('checkout.steps.confirmation')}</ThemedText>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <ThemedText className="font-heading text-xl font-bold mb-1">
            {t('methods.selectPaymentMethod')}
          </ThemedText>
          <ThemedText className="font-body text-sm text-gray-500">
            {t('methods.subtitle')}
          </ThemedText>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : methods.length === 0 ? (
          <View className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 mb-6">
            <ThemedText className="font-body text-neutral-600 text-center">
              {t('methods.noMethodsAvailable')}
            </ThemedText>
          </View>
        ) : (
          <View>
            {methods.map((method) => {
              const isSelected = selectedMethodId === method.method_id;
              return (
                <TouchableOpacity
                  key={method.method_id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMethodId(method.method_id)}
                  className={`bg-neutral-50 p-5 rounded-2xl border mb-4 ${
                    isSelected ? 'border-orange-500' : 'border-neutral-200'
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-4">
                      <ThemedText className="font-body text-neutral-900 font-bold text-lg mb-1">
                        {method.name}
                      </ThemedText>
                      <ThemedText className="font-body text-neutral-600 text-xs uppercase tracking-wider">
                        {method.type}
                      </ThemedText>
                    </View>

                    {isSelected && (
                      <CheckCircleIcon size={24} color="#f97316" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}