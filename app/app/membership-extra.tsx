
import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { CheckCircleIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PackageItem {
  packageId?: string;
  package_id?: string;
  name: string;
  description: string;
  price: number;
}

export default function MembershipExtraScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const params = useLocalSearchParams<{
    mainItemId?: string;
    mainItemTitle?: string;
    mainItemPrice?: string;
    mainItemType?: string;
    startDate?: string;
    userId?: string;
    branchId?: string;
    servicesJson?: string;
    // Coming from class-details when user needs to purchase
    fromClassDetails?: string;
    preselectedBranchId?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedPackagesIds, setSelectedPackagesIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Helper function to get translated package name
  const getPackageName = (pkg: PackageItem): string => {
    const normalizedName = pkg.name.trim().toUpperCase();
    const translationKey = `extras.packages.${normalizedName}.name`;
    const translated = t(translationKey);

    // If translation exists and is different from the key, use it
    return translated !== translationKey ? translated : pkg.name;
  };

  // Helper function to get translated package description
  const getPackageDescription = (pkg: PackageItem): string => {
    const normalizedName = pkg.name.trim().toUpperCase();
    const translationKey = `extras.packages.${normalizedName}.description`;
    const translated = t(translationKey);

    // If translation exists and is different from the key, use it
    return translated !== translationKey ? translated : pkg.description;
  };

  const loadPackages = useCallback(async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    }

    try {
      await AsyncStorage.getItem('token');

      const response = await vitalFitApi.public.getPackages({
        page,
        limit: 8,
        currency: 'USD'
      });

      // @ts-expect-error: Manejo flexible de respuesta
      const data = response.data || response.results || response.items || [];

      if (append) {
        setPackages(prev => [...prev, ...data]);
      } else {
        setPackages(data);
      }

      // Check if there are more items to load
      setHasMore(data.length === 8);
      setCurrentPage(page);
    } catch (e) {
      console.error('Error cargando paquetes:', e);
      Alert.alert(t('common.attention'), t('extras.error.loadPackages'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  const loadMorePackages = () => {
    if (!loadingMore && hasMore) {
      loadPackages(currentPage + 1, true);
    }
  };

  useEffect(() => {
    loadPackages(1, false);
  }, [loadPackages]);

  const togglePackage = (pkgId: string) => {
    if (selectedPackagesIds.includes(pkgId)) {
      setSelectedPackagesIds(prev => prev.filter(id => id !== pkgId));
    } else {
      setSelectedPackagesIds(prev => [...prev, pkgId]);
    }
  };

  const onContinue = () => {
    const selectedObjects = packages.filter(p => {
        const id = p.packageId || p.package_id;
        return id && selectedPackagesIds.includes(id);
    });

    router.push({
      pathname: '/membership-confirm',
      params: {
        ...params,
        packagesJson: JSON.stringify(selectedObjects)
      }
    } as never);
  };

  const renderPackage = ({ item }: { item: PackageItem }) => {
    const id = item.packageId || item.package_id || '';
    const isSelected = selectedPackagesIds.includes(id);

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => togglePackage(id)}
        className={`p-4 mb-3 rounded-2xl border ${
          isSelected 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-neutral-200 bg-white'
        }`}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <ThemedText
              lightColor="#111827"
              darkColor="#111827"
              className="font-body font-bold text-lg mb-1"
              style={{ fontFamily: 'Montserrat_700Bold' }}
            >
              {getPackageName(item)}
            </ThemedText>
            <ThemedText
              lightColor="#6b7280"
              darkColor="#6b7280"
              className="font-body text-xs"
              numberOfLines={2}
              style={{ fontFamily: 'Montserrat_400Regular' }}
            >
              {getPackageDescription(item)}
            </ThemedText>
          </View>

          <View className="items-end">
             <ThemedText
               lightColor="#f97316"
               darkColor="#f97316"
               className="font-heading font-extrabold text-xl"
               style={{ fontFamily: 'Montserrat_700Bold' }}
             >
               ${item.price}
             </ThemedText>
             {isSelected ? (
                <View className="flex-row items-center mt-1">
                    <CheckCircleIcon size={16} color="#f97316" />
                    <ThemedText className="font-body text-xs text-orange-600 font-bold ml-1" style={{ fontFamily: 'Montserrat_700Bold' }}>
                        {t('extras.added')}
                    </ThemedText>
                </View>
             ) : (
                <ThemedText className="font-body text-xs text-gray-400 mt-1" style={{ fontFamily: 'Montserrat_400Regular' }}>
                    {t('extras.clickToAdd')}
                </ThemedText>
             )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8 pb-4">
        
        <View className='mb-6'>
          <ThemedText
            lightColor='#f97316'
            darkColor='#f97316'
            className='font-heading text-4xl mb-4 text-center'
            style={{ fontFamily: 'BebasNeue-Regular' }}>
            {t('extras.title')}
          </ThemedText>
          <View className='flex-row justify-between items-center mb-4'>

            <View className='items-center flex-1'>
              <View className='w-8 h-8 rounded-full items-center justify-center mb-1 border bg-white border-neutral-400'>
                <ThemedText className='font-body text-[10px] font-semibold text-gray-800' style={{ fontFamily: 'Montserrat_500Medium' }}>1</ThemedText>
              </View>
              <ThemedText className='font-body text-[11px] text-center text-gray-800' style={{ fontFamily: 'Montserrat_500Medium' }}>{t('checkout.steps.options')}</ThemedText>
            </View>

            <View className='items-center flex-1'>
              <View className='w-8 h-8 rounded-full items-center justify-center mb-1 border bg-orange-500 border-orange-500'>
                <ThemedText className='font-body text-[10px] font-semibold text-white' style={{ fontFamily: 'Montserrat_500Medium' }}>2</ThemedText>
              </View>
              <ThemedText className='font-body text-[11px] text-center text-orange-600 font-bold' style={{ fontFamily: 'Montserrat_500Medium' }}>{t('checkout.steps.extras')}</ThemedText>
            </View>

            <View className='items-center flex-1'>
              <View className='w-8 h-8 rounded-full items-center justify-center mb-1 border bg-white border-neutral-400'>
                <ThemedText className='font-body text-[10px] font-semibold text-gray-800' style={{ fontFamily: 'Montserrat_500Medium' }}>3</ThemedText>
              </View>
              <ThemedText className='font-body text-[11px] text-center text-gray-800' style={{ fontFamily: 'Montserrat_500Medium' }}>{t('checkout.steps.confirmation')}</ThemedText>
            </View>
          </View>
        </View>

        <View className="mb-4">
            <ThemedText className="font-heading text-xl font-bold mb-1" style={{ fontFamily: 'BebasNeue-Regular' }}>
                {t('extras.additionalPackages')}
            </ThemedText>
            <ThemedText className="font-body text-sm text-gray-500" style={{ fontFamily: 'Montserrat_400Regular' }}>
                {t('extras.subtitle')}
            </ThemedText>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
             <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : (
          <FlatList
            data={packages}
            renderItem={renderPackage}
            keyExtractor={(item) => item.packageId || item.package_id || Math.random().toString()}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            onEndReached={loadMorePackages}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
                <View className="py-10 items-center">
                    <ThemedText className="font-body text-gray-400 text-center" style={{ fontFamily: 'Montserrat_400Regular' }}>
                        {t('extras.noPackagesAvailable')}
                    </ThemedText>
                </View>
            }
            ListFooterComponent={
                loadingMore ? (
                    <View className="py-4 items-center">
                        <ActivityIndicator size="small" color="#f97316" />
                    </View>
                ) : null
            }
          />
        )}

        <View className="pt-4 border-t border-gray-100">
            <PrimaryButton
                title={t('extras.continueWithExtras', { count: selectedPackagesIds.length })}
                onPress={onContinue}
            />
            <TouchableOpacity onPress={onContinue} className="mt-3 items-center">
                <ThemedText className="font-body text-gray-500 text-sm underline" style={{ fontFamily: 'Montserrat_400Regular' }}>
                    {t('extras.skipExtras')}
                </ThemedText>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}