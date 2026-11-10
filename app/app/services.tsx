import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi from '@/services';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BranchItem {
  branch_id: string;
  name: string;
}

// Updated interface based on new JSON structure
interface BranchServiceItem {
  service_id: string;
  name: string;
  description: string;
  lowest_price_no_member: number;
  lowest_price_member: number;
  duration_minutes: number;
  category_id?: string;
  base_currency?: string;
  is_featured?: boolean;
}

function ServiceCardComponent({
  item,
  isSelected,
  onToggle,
  userHasMembership,
}: {
  item: BranchServiceItem;
  isSelected: boolean;
  onToggle: (s: BranchServiceItem) => void;
  userHasMembership: boolean;
}) {
  const { t } = useTranslation();
  const price = userHasMembership ? item.lowest_price_member : item.lowest_price_no_member;
  
  // Disable if user is member active and member price is 0
  const isFreeForMember = userHasMembership && item.lowest_price_member === 0;
  const isDisabled = isFreeForMember;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => !isDisabled && onToggle(item)}
      disabled={isDisabled}
      className={`mb-4 rounded-[24px] border px-5 py-3 ${
        isDisabled 
          ? 'bg-neutral-100 border-neutral-200 opacity-50' 
          : isSelected 
            ? 'bg-orange-50 border-orange-500' 
            : 'bg-white border-gray-200'
      }`}>
      <View className='flex-row items-center justify-between'>
        <View className='flex-1 mr-4'>
          <View className='flex-row items-center mb-1'>
            <ThemedText
              lightColor='#f97316'
              darkColor='#f97316'
              className='text-base'
              style={{ fontFamily: 'BebasNeue-Regular' }}>
              {item.name}
            </ThemedText>
          </View>
          
          <ThemedText
            lightColor='#6b7280'
            darkColor='#9ca3af'
            className='text-xs mb-2'
            style={{ fontFamily: 'Montserrat_400Regular' }}
            numberOfLines={2}>
            {item.description || t('services.serviceFallback')}
          </ThemedText>
          
          {item.duration_minutes > 0 && (
             <ThemedText
             lightColor='#9ca3af'
             darkColor='#9ca3af'
             className='text-[10px]'
             style={{ fontFamily: 'Montserrat_400Regular' }}>
             {t('services.duration', { minutes: item.duration_minutes })}
           </ThemedText>
          )}
        </View>

        <View className='items-end justify-center'>
          <View className='flex-row items-center mb-1'>
            <View className='mr-2'>
               <ThemedText
                  lightColor='#111827'
                  darkColor='#111827' // Changed to dark text on light bg for visibility
                  className='text-sm text-right'
                  style={{ fontFamily: 'Montserrat_700Bold' }}>
                  ${price}
                </ThemedText>
                 <ThemedText
                  lightColor='#6b7280'
                  darkColor='#9ca3af'
                  className='text-[10px] text-right'
                  style={{ fontFamily: 'Montserrat_500Medium' }}>
                  {userHasMembership ? t('services.memberPrice') : t('services.generalPrice')}
                </ThemedText>
            </View>

            <View
              className={`rounded-full p-1 items-center justify-center w-8 h-8 ${
                isSelected ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
               <Ionicons 
                 name={isSelected ? "checkmark" : "cart-outline"} 
                 size={18} 
                 color={isSelected ? "white" : "#6b7280"} 
               />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ServiceCard = React.memo(ServiceCardComponent);

export default function ServicesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const { branchId: initialBranchId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranchId ? String(initialBranchId) : ''
  );
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [services, setServices] = useState<BranchServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  // Check if user has active membership (case insensitive check)
  const userHasMembership = useMemo(() => {
    return user?.membership?.status?.toLowerCase() === 'active';
  }, [user?.membership?.status]);

  // Branch Loading
  useEffect(() => {
    const initBranches = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await vitalFitApi.public.getBranchMap(token || '');
            const data = (response as { data?: BranchItem[] }).data || [];

            setBranches(data);
            // Only set default branch if no branch is selected (respects initialBranchId)
            if (data.length > 0 && !selectedBranchId) {
                setSelectedBranchId(data[0].branch_id);
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    void initBranches();
  }, [selectedBranchId]);

  // Services Loading
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedBranchId) return;
      
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        
        const response = await vitalFitApi.client.get({
            url: `/public/branches/${selectedBranchId}/services`,
            jwt: token || undefined,
             params: {
              page: 1,
              limit: 50, 
              currency: 'USD',
              sort: 'desc'
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = (response as any).data as BranchServiceItem[];
        const mapped: BranchServiceItem[] = Array.isArray(rawData) ? rawData : [];

        setServices(mapped);
        setSelectedServiceIds(new Set()); // Reset selection on branch change
      } catch (error) {
        console.error('Error cargando servicios por sucursal:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedBranchId]);

  const toggleService = useCallback((service: BranchServiceItem) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(service.service_id)) {
        next.delete(service.service_id);
      } else {
        next.add(service.service_id);
      }
      return next;
    });
  }, []);

  const handleContinue = () => {
    const selectedItems = services.filter(s => selectedServiceIds.has(s.service_id));
    
    // Calculate total price based on membership status
    const total = selectedItems.reduce((sum, item) => {
      const price = userHasMembership ? item.lowest_price_member : item.lowest_price_no_member;
      return sum + price;
    }, 0);

    // Map items for checkout
    const servicesForCheckout = selectedItems.map(s => ({
       service_id: s.service_id,
       name: s.name,
       price: userHasMembership ? s.lowest_price_member : s.lowest_price_no_member, 
       type: 'service'
    }));

    router.push({
      pathname: '/membership-checkout',
      params: {
        servicesJson: JSON.stringify(servicesForCheckout),
        title: t('services.title'),
        price: total.toString(),
        period: t('services.oneTimePayment'),
        type: 'service_bundle',
      },
    });
  };

  const renderCard = useCallback(
    ({ item }: { item: BranchServiceItem }) => (
      <ServiceCard 
        item={item} 
        isSelected={selectedServiceIds.has(item.service_id)}
        onToggle={toggleService}
        userHasMembership={userHasMembership}
      />
    ),
    [toggleService, selectedServiceIds, userHasMembership]
  );
  
  const selectedBranchName = branches.find(b => b.branch_id === selectedBranchId)?.name || t('common.selectBranch');


  const renderHeader = () => (
    <View>
      <View className='h-72 w-full justify-end'>
        <View className='px-6 pb-6 items-center'>
          <ThemedText
            lightColor="#f97316"
            darkColor="#f97316"
            className='font-heading mb-1 text-center tracking-[0.25em]'
            style={{
              fontFamily: 'BebasNeue-Regular',
              fontSize: 28,
              textShadowColor: '#000',
              textShadowRadius: 5,
              textShadowOffset: { width: 1, height: 1 },
              paddingVertical: 4,
              paddingHorizontal: 6,
              overflow: 'visible',
            }}>
            {t('services.headerTitle')}
          </ThemedText>

          <ThemedText
            lightColor="#f97316"
            darkColor="#e5e7eb"
            className='font-body mb-4 px-2 text-center text-sm'
            style={{
              fontFamily: 'Montserrat_400Regular',
              fontSize: 18,
              textShadowColor: '#000',
              textShadowRadius: 5,
              textShadowOffset: { width: 1, height: 1 },
              paddingVertical: 4,
              paddingHorizontal: 6,
              overflow: 'visible',
            }}>
            {t('services.subtitle')}
          </ThemedText>
        </View>
      </View>

      {/* Branch Selector (Modal Style) */}
      <View className="px-6 mb-6">
        {loadingBranches ? (
          <ActivityIndicator size="small" color="#f97316" />
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setBranchModalVisible(true)}
              className="flex-row items-center justify-between border border-gray-300 rounded-xl p-4 bg-white"
            >
              <View className="flex-row items-center">
                  <MapPinIcon size={20} color="#f97316" />
                  <ThemedText className="font-body ml-3 font-bold text-lg text-gray-800">
                      {selectedBranchName}
                  </ThemedText>
              </View>
              <ThemedText className="font-body text-gray-400">▼</ThemedText>
            </TouchableOpacity>

            <Modal
              transparent={true}
              visible={branchModalVisible}
              animationType="fade"
              onRequestClose={() => setBranchModalVisible(false)}
            >
              <TouchableOpacity 
                  className="flex-1 bg-black/50 justify-center items-center px-6"
                  activeOpacity={1}
                  onPress={() => setBranchModalVisible(false)}
              >
                  <View className="bg-white w-full rounded-2xl overflow-hidden p-4 max-h-[500px]">
                      <ThemedText className="font-heading font-bold text-lg mb-4 text-center">Seleccionar Sucursal</ThemedText>
                      <ScrollView>
                        {branches.map((branch) => {
                          const isSelected = selectedBranchId === branch.branch_id;
                          return (
                            <TouchableOpacity
                              key={branch.branch_id}
                              onPress={() => {
                                setSelectedBranchId(branch.branch_id);
                                setBranchModalVisible(false);
                              }}
                              className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${
                                  isSelected ? 'bg-orange-50' : ''
                              }`}
                            >
                              <ThemedText className="font-body font-bold text-neutral-800">{branch.name}</ThemedText>
                              {isSelected && (
                                  <ThemedText className="font-body text-orange-500 font-bold">✓</ThemedText>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                        {branches.length === 0 && (
                          <View className='px-4 py-3'>
                              <ThemedText className='font-body text-sm text-neutral-400'>
                                  No hay sucursales disponibles.
                              </ThemedText>
                          </View>
                        )}
                      </ScrollView>
                  </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className='flex-1 bg-neutral-50'>
      {loading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#f97316' />
        </View>
      ) : (
        <React.Fragment>
            <FlatList
            data={services}
            renderItem={renderCard}
            keyExtractor={(item) => item.service_id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
                <View className='items-center justify-center py-10'>
                    <ThemedText className='text-neutral-500'>No hay servicios disponibles en esta sucursal.</ThemedText>
                </View>
            }
            />
            {selectedServiceIds.size > 0 && (
                <View className="absolute bottom-6 left-6 right-6 p-4 bg-white rounded-2xl shadow-xl border border-neutral-100">
                    <PrimaryButton
                        title={`Continuar (${selectedServiceIds.size})`}
                        onPress={handleContinue}
                    />
                </View>
            )}
        </React.Fragment>
      )}
    </SafeAreaView>
  );
}
