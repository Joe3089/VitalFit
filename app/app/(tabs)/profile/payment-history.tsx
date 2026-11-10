import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import {
  AdjustmentsHorizontalIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from 'react-native-heroicons/outline';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from 'react-native-heroicons/solid';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type BranchItem = {
  branch_id: string;
  name: string;
};

interface PaymentMethodData {
  type?: string;
  name?: string;
  brand?: string;
  last4?: string;
  [key: string]: unknown;
}

interface InvoiceListItem {
  branch_id: string;
  invoice_id: string;
  issue_date: string;
  status: string;
  total_amount: number | string;
}

interface InvoiceItem {
  invoice_item_id: string;
  quantity: number;
  unit_price: string | number;
  total_line: string | number;
  subtotal: string | number;
  membership_type_id?: string;
  package_id?: string;
  service_id?: string;
}

interface PaymentInfo {
  payment_id: string;
  payment_date: string;
  amount_paid: string | number;
  payment_method_id?: string;
  transaction_id: string;
  status: string;
  receipt_url?: string;
  resolved_method_name?: string;
}

interface InvoiceDetail {
  invoice_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  sub_total: string | number;
  tax: string | number;
  total_amount: string | number;
  status: string;
  branch_id?: string;
  invoice_items: InvoiceItem[];
  payments: PaymentInfo[];
}

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(t('paymentHistory.filters.all'));

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [invoiceDetailsCache, setInvoiceDetailsCache] = useState<Record<string, InvoiceDetail>>({});

  const [branchesMap, setBranchesMap] = useState<Record<string, string>>({});

  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filters = [
    t('paymentHistory.filters.all'),
    t('paymentHistory.filters.paid'),
    t('paymentHistory.filters.pending'),
    t('paymentHistory.filters.processing'),
    t('paymentHistory.filters.refunded')
  ];

  const fetchBranches = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await vitalFitApi.public.getBranchMap(token || '');
      const data = (response as { data?: BranchItem[] }).data || [];

      const map: Record<string, string> = {};
      if (Array.isArray(data)) {
        data.forEach((b) => {
          if (b.branch_id && b.name) {
            map[b.branch_id] = b.name;
          }
        });
      }
      setBranchesMap(map);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchInvoices = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user?.userId) return;

      const response = await vitalFitApi.billing.getClientInvoices(
        token,
        { page, limit: 5, sort: 'desc', search: searchQuery || undefined },
        user.userId
      );

      const data = response?.data || [];
      if (Array.isArray(data)) {
        if (append) {
          setInvoices(prev => {
            const existingIds = new Set(prev.map(inv => inv.invoice_id));
            const newInvoices = data.filter(inv => !existingIds.has(inv.invoice_id));
            return [...prev, ...newInvoices];
          });
        } else {
          setInvoices(data);
        }

        // Si recibimos menos de 5 items (el límite), no hay más páginas
        setHasMore(data.length === 5);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingList(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.userId, searchQuery]);

  const fetchInvoiceDetail = async (invoiceId: string) => {
    if (invoiceDetailsCache[invoiceId]) return;

    setLoadingDetailId(invoiceId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const rawResponse = await vitalFitApi.billing.getInvoiceByID(invoiceId, token);
      const rawDetail: InvoiceDetail = rawResponse?.data || rawResponse;

      if (!rawDetail || !rawDetail.invoice_id) throw new Error("Datos incompletos");

      if (rawDetail.payments && rawDetail.payments.length > 0) {
        const enrichedPayments = await Promise.all(
          rawDetail.payments.map(async (payment) => {
            if (!payment.payment_method_id) {
              return { ...payment, resolved_method_name: 'No especificado' };
            }

            try {
              const methodResp = await vitalFitApi.paymentMethod.getPaymentMethodByID(
                payment.payment_method_id,
                token
              );
              
              const methodData = (methodResp?.data || methodResp) as PaymentMethodData;

              let readableName = 'No especificado';

              if (methodData) {
                const type = methodData.type ? String(methodData.type).toLowerCase() : '';
                const name = methodData.name ? String(methodData.name).toLowerCase() : '';

                if (type.includes('mobile') || type.includes('movil') || name.includes('movil') || name.includes('mobile')) {
                   readableName = 'Pago Móvil';
                } else if (type.includes('transfer') || name.includes('transfer')) {
                   readableName = 'Transferencia';
                } else if (type.includes('pos') || type.includes('point') || name.includes('punto') || type.includes('card')) {
                   readableName = 'Punto de Venta';
                } else if (methodData.brand && methodData.last4) {
                   readableName = 'Punto de Venta';
                } else if (name) {
                   readableName = name;
                }
              }

              return { ...payment, resolved_method_name: readableName };
            } catch {
              return { ...payment, resolved_method_name: 'No especificado' };
            }
          })
        );
        rawDetail.payments = enrichedPayments;
      }

      setInvoiceDetailsCache(prev => ({ ...prev, [invoiceId]: rawDetail }));

    } catch (error: unknown) {
      let message = 'No se pudo cargar el detalle.';
      if (isAPIError(error)) {
        message = error.messages?.[0] || error.message || message;
      }
      showToast('error', 'Error', message);
    } finally {
      setLoadingDetailId(null);
    }
  };

  useEffect(() => {
    fetchBranches();
    setCurrentPage(1);
    setHasMore(true);
    fetchInvoices(1, false);
  }, [fetchBranches, fetchInvoices]);

  const onRefresh = () => {
    setRefreshing(true);
    setInvoiceDetailsCache({});
    setCurrentPage(1);
    setHasMore(true);
    fetchBranches();
    fetchInvoices(1, false);
  };

  const loadMoreInvoices = () => {
    if (loadingMore || !hasMore || loadingList) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchInvoices(nextPage, true);
  };

  const toggleExpand = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      await fetchInvoiceDetail(id);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return { date: '', time: '' };
    try {
      const d = new Date(dateString);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear().toString().slice(-2);
      return {
        date: `${day}/${month}/${year}`,
        time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    } catch {
      return { date: dateString, time: '' };
    }
  };

  const getStatusConfig = (status: string) => {
    const normalized = status?.toLowerCase() || '';
    if (normalized === 'paid' || normalized === 'pagado') {
      return { label: t('paymentHistory.status.paid'), color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleIcon size={16} color="#ffffff" /> };
    }
    if (normalized === 'unpaid' || normalized === 'failed' || normalized === 'cancelled' || normalized === 'fallido' || normalized === 'voided') {
      return { label: t('paymentHistory.status.pending'), color: '#ef4444', bg: '#fef2f2', icon: <XCircleIcon size={16} color="#ffffff" /> };
    }
    if (normalized === 'refunded' || normalized === 'reembolsado') {
      return { label: t('paymentHistory.status.refunded'), color: '#6b7280', bg: '#f3f4f6', icon: <ArrowPathIcon size={16} color="#ffffff" /> };
    }
    if (normalized === 'pending' || normalized === 'pendiente') {
      return { label: t('paymentHistory.status.processing'), color: '#f97316', bg: '#fff7ed', icon: <ClockIcon size={16} color="#ffffff" /> };
    }
    return { label: status, color: '#6b7280', bg: '#f3f4f6', icon: <CheckCircleIcon size={16} color="#ffffff" /> };
  };

  const filteredInvoices = invoices.filter(inv => {
    if (activeFilter === t('paymentHistory.filters.all')) return true;

    const status = inv.status?.toLowerCase() || '';

    if (activeFilter === t('paymentHistory.filters.paid')) {
      return status === 'paid' || status === 'pagado';
    }
    if (activeFilter === t('paymentHistory.filters.pending')) {
      return status === 'unpaid' || status === 'failed' || status === 'cancelled' || status === 'fallido' || status === 'voided';
    }
    if (activeFilter === t('paymentHistory.filters.processing')) {
      return status === 'pending' || status === 'pendiente';
    }
    if (activeFilter === t('paymentHistory.filters.refunded')) {
      return status === 'refunded' || status === 'reembolsado';
    }
    return true;
  });

  const renderHeader = () => (
    <>
      <View className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center relative'>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
          <ChevronLeftIcon width={20} height={20} color='#f97316' />
        </TouchableOpacity>
        <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('paymentHistory.title')}</Text>
      </View>

      <View style={{
        backgroundColor: '#ffffff', borderRadius: 28, paddingVertical: 12, paddingHorizontal: 16,
        marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb',
      }}>
        <MagnifyingGlassIcon size={20} color='#f97316' />
        <TextInput
          placeholder={t('paymentHistory.searchPlaceholder')}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' }}
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20,
          alignSelf: 'flex-start', marginBottom: 16, flexDirection: 'row', alignItems: 'center',
          borderWidth: 1, borderColor: '#e5e7eb',
        }}
        activeOpacity={0.8}
      >
        <AdjustmentsHorizontalIcon size={16} color='#111827' style={{ marginRight: 6 }} />
        <Text className='font-body' style={{ color: '#111827', fontSize: 14, fontWeight: '500' }}>{t('paymentHistory.filter')}</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 10 }}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={{
              paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
              backgroundColor: activeFilter === filter ? '#f97316' : '#ffffff',
              borderWidth: 1, borderColor: activeFilter === filter ? '#f97316' : '#e5e7eb',
            }}
          >
            <Text className='font-body' style={{ color: activeFilter === filter ? '#ffffff' : '#111827', fontSize: 14, fontWeight: activeFilter === filter ? '600' : '500' }}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#f97316" />
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loadingList && !refreshing) {
      return <View className="py-10"><ActivityIndicator size="large" color="#f97316" /></View>;
    }
    return (
      <View className="items-center py-10 opacity-60">
        <ExclamationCircleIcon size={48} color="#d1d5db" />
        <Text className="font-body text-gray-500 mt-2 font-medium">{t('paymentHistory.emptyState')}</Text>
      </View>
    );
  };

  const renderInvoiceItem = ({ item: inv }: { item: InvoiceListItem }) => {
    const isExpanded = expandedId === inv.invoice_id;
    const detail = invoiceDetailsCache[inv.invoice_id];
    const config = getStatusConfig(inv.status);
    const dateInfo = formatDate(inv.issue_date);

    const branchName = branchesMap[inv.branch_id] || '';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleExpand(inv.invoice_id)}
        style={{
          backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 }, elevation: 1,
          marginBottom: 8,
        }}
      >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: config.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {config.icon}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text className='font-heading' style={{ color: '#111827', fontSize: 15, fontWeight: '700', marginBottom: 2 }} numberOfLines={1}>
                            {t('paymentHistory.invoice')} {inv.invoice_id.slice(0, 8)}
                          </Text>

                          {branchName ? (
                             <Text className='font-body' style={{ color: '#4b5563', fontSize: 12, marginBottom: 4 }} numberOfLines={1}>
                               {branchName}
                             </Text>
                          ) : null}

                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <ClockIcon size={12} color="#6b7280" style={{ marginRight: 4 }} />
                            <Text className='font-body' style={{ color: '#6b7280', fontSize: 12 }}>
                              {dateInfo.date} <Text style={{ fontSize: 10 }}>{dateInfo.time}</Text>
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                            {formatCurrency(inv.total_amount)}
                          </Text>
                          <View style={{ backgroundColor: config.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                            <Text className='font-body' style={{ color: config.color, fontSize: 11, fontWeight: '600' }}>{config.label}</Text>
                          </View>
                        </View>
                      </View>

                      {isExpanded && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                          {loadingDetailId === inv.invoice_id ? (
                            <ActivityIndicator size="small" color="#f97316" />
                          ) : detail ? (
                            <View style={{ gap: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
                                <BuildingOfficeIcon size={14} color="#6b7280" style={{ marginRight: 4 }} />
                                <Text className='font-body' style={{ fontSize: 12, color: '#4b5563' }}>
                                  {t('paymentHistory.details.issuedAt')}: <Text style={{ fontWeight: '600' }}>
                                     {branchesMap[detail.branch_id || ''] || ''}
                                  </Text>
                                </Text>
                              </View>

                              <Text className='font-heading' style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{t('paymentHistory.details.itemsDetail')}:</Text>
                              {detail.invoice_items?.map((item, idx) => {
                                let itemName = t('paymentHistory.details.items.billing');
                                let itemId = item.invoice_item_id;

                                if (item.membership_type_id) {
                                  itemName = t('paymentHistory.details.items.subscription');
                                  itemId = item.membership_type_id;
                                } else if (item.package_id) {
                                  itemName = t('paymentHistory.details.items.package');
                                  itemId = item.package_id;
                                } else if (item.service_id) {
                                  itemName = t('paymentHistory.details.items.service');
                                  itemId = item.service_id;
                                }

                                return (
                                  <View key={item.invoice_item_id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                      <Text className='font-heading' style={{ fontSize: 13, fontWeight: '600', color: '#1f2937' }}>
                                        {itemName}
                                      </Text>
                                      <Text className='font-body' style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', marginTop: 1 }}>
                                        ID: {itemId?.substring(0, 8)}
                                      </Text>
                                      <Text className='font-body' style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                                        {t('paymentHistory.details.quantity')}: {item.quantity}
                                      </Text>
                                    </View>
                                    <Text className='font-heading' style={{ fontSize: 13, fontWeight: '600', color: '#111827' }}>
                                      {formatCurrency(item.total_line)}
                                    </Text>
                                  </View>
                                );
                              })}

                              {detail.payments && detail.payments.length > 0 && (
                                <>
                                  <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 }} />
                                  <Text className='font-heading' style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{t('paymentHistory.details.reportedPayments')}:</Text>
                                  {detail.payments.map((p, idx) => {
                                    const pDate = formatDate(p.payment_date);
                                    return (
                                      <View key={p.payment_id || idx} style={{ gap: 2 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                          <CreditCardIcon size={14} color="#9ca3af" style={{ marginRight: 6 }} />
                                          <Text className='font-body' style={{ fontSize: 12, color: '#111827', fontWeight: '500' }}>
                                            {p.resolved_method_name}
                                          </Text>
                                        </View>
                                        <Text className='font-body' style={{ fontSize: 11, color: '#6b7280', paddingLeft: 20 }}>
                                          {pDate.date} - {p.status}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </>
                              )}

                              <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 }} />
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text className='font-body' style={{ fontSize: 12, color: '#6b7280' }}>{t('paymentHistory.details.total')}:</Text>
                                <Text className='font-heading' style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{formatCurrency(detail.total_amount)}</Text>
                              </View>
                            </View>
                          ) : (
                            <Text className='font-body' style={{ fontSize: 12, color: '#ef4444' }}>{t('paymentHistory.details.loadError')}</Text>
                          )}
                        </View>
                      )}

        {!isExpanded && <View style={{ alignItems: 'center', marginTop: 4 }}><ChevronDownIcon size={16} color="#e5e7eb" /></View>}
        {isExpanded && <View style={{ alignItems: 'center', marginTop: 8 }}><ChevronUpIcon size={16} color="#e5e7eb" /></View>}
      </View>
    </View>
  </TouchableOpacity>
    );
  };

  return (
    <ThemedView className='flex-1 bg-white pt-10'>
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.invoice_id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
        onEndReached={loadMoreInvoices}
        onEndReachedThreshold={0.5}
      />
    </ThemedView>
  );
}