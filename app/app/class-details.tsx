import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useReservations } from '@/contexts/reservations';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import { ClientBookingResponse, isAPIError } from '@vitalfit/sdk';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ClockIcon as OutlineClockIcon,
  UsersIcon,
  XMarkIcon
} from 'react-native-heroicons/outline';
import {
  CheckCircleIcon,
  CheckIcon,
  ExclamationCircleIcon,
  StarIcon,
  UserIcon,
} from 'react-native-heroicons/solid';

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
});

export default function ClassDetailsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { token: authToken } = useAuth();
  const {
    time,
    title,
    instructor,
    imageUrl,
    capacity,
    occupied,
    mode,
    classId,
    serviceId,
    instructorId,
    bookingId,
    startsAt,
    branchId,
  } = useLocalSearchParams();

  // Debug: Log all class parameters
  console.log('[DEBUG] Class Details Params:', {
    classId,
    serviceId,
    instructorId,
    bookingId,
    branchId,
    title,
    time,
    startsAt,
  });

  const { isReserved, reserve, cancel } = useReservations();
  const { user } = useUser();
  const [serverBookingId, setServerBookingId] = useState<string | null>(null);
  const [currentOccupancyCount, setCurrentOccupancyCount] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        if (!user?.userId || !classId) return;
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const bookingsResp = await vitalFitApi.booking.getClientBooking(
          String(user.userId),
          token,
        );
        const bookings = (
          Array.isArray(
            (bookingsResp as unknown as { data: ClientBookingResponse[] }).data,
          )
            ? (bookingsResp as unknown as { data: ClientBookingResponse[] }).data
            : bookingsResp
        ) as ClientBookingResponse[];

        const found = bookings.find((b) => String(b.class_id) === String(classId));
        if (found?.booking_id) {
          setServerBookingId(String(found.booking_id));
        }

        // Fetch Occupancy using correct SDK method
        try {
          const occupancyResp = await vitalFitApi.booking.getClassBookingCount(
            String(classId),
            token,
          );

          // Try to find the count in the response - treating as any to be safe until typed
          // Try to find the count in the response - treating as any to be safe until typed
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resp = occupancyResp as any;
          // Possible structures: { count: 5 }, { bookings_count: 5 }, { data: { count: 5 } }
          const count =
            resp?.count ??
            resp?.bookings_count ??
            resp?.data?.count ??
            resp?.data?.bookings_count;

          if (typeof count === 'number') {
            setCurrentOccupancyCount(count);
          }
        } catch (e) {
          console.warn('Could not fetch occupancy count:', e);
        }
      } catch (err) {
        console.warn('Error checking booking status:', err);
      }
    };
    void checkBookingStatus();
  }, [user?.userId, classId]);

  const hasMembership = user?.membership?.status === 'Active';

  const classDateFormatted = useMemo(() => {
    try {
      const dateToFormat = startsAt ? new Date(String(startsAt)) : new Date();

      if (startsAt && String(startsAt).match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateToFormat.setMinutes(
          dateToFormat.getMinutes() + dateToFormat.getTimezoneOffset(),
        );
      }

      return dateToFormat.toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [startsAt, i18n.language]);

  const [serviceDescription, setServiceDescription] = useState<string | null>(null);
  const isPast = useMemo(() => {
    if (!startsAt) return false;
    const now = new Date();
    const start = new Date(String(startsAt));
    return start < now;
  }, [startsAt]);
  const [serviceImageUrl, setServiceImageUrl] = useState<string | null>(null);
  const [instructorImageUrl, setInstructorImageUrl] = useState<string | null>(null);

  type ApiServiceImage = { image_url?: string; is_primary?: boolean };
  type ApiInstructorDetail = {
    avatar_url?: string;
    image_url?: string;
    profile_image_url?: string;
  };

  // Store service data for purchase flow
  const [serviceData, setServiceData] = useState<{
    name: string;
    price: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        if (serviceId) {
          try {
            const serviceResp = await vitalFitApi.products.getServiceByID(
              String(serviceId),
              token,
            );
            const s = 'data' in serviceResp ? serviceResp.data : serviceResp;
            if (s) {
              if (typeof s.description === 'string') {
                setServiceDescription(s.description);
              }
              const images: ApiServiceImage[] = Array.isArray(s.images)
                ? s.images
                : [];
              if (images.length > 0) {
                const primary = images.find((img: ApiServiceImage) => img.is_primary) ?? images[0];
                if (primary?.image_url) {
                  setServiceImageUrl(primary.image_url);
                }
              }
              
              // FIX: Included 'title' here. We also use 't' for the fallback 'Servicio'
              const serviceName = s.name || String(title) || t('common.service', 'Servicio');
              
              // ServiceFullDetail doesn't include pricing, so default to 0
              const servicePrice = 0;
              setServiceData({
                name: serviceName,
                price: servicePrice,
              });
            }
          } catch (error) {
            console.error('Error cargando servicio para detalle de clase:', error);
          }
        }

        if (instructorId) {
          try {
            const instResp = await vitalFitApi.client.get({
              url: `/instructor/${String(instructorId)}`,
              jwt: token,
            });
            const inst =
              (instResp as { data?: ApiInstructorDetail }).data ??
              (instResp as ApiInstructorDetail | undefined);
            const avatar =
              inst?.avatar_url || inst?.image_url || inst?.profile_image_url;
            if (typeof avatar === 'string' && avatar.startsWith('http')) {
              setInstructorImageUrl(avatar);
            }
          } catch (error) {
            console.error('Error cargando instructor para detalle de clase:', error);
          }
        }
      } catch {
        // Se ignora el error de carga inicial
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, instructorId, title]);

  const heroSource = useMemo(() => {
    if (serviceImageUrl && /^https?:\/\//i.test(serviceImageUrl)) {
      return { uri: serviceImageUrl };
    }

    if (typeof imageUrl === 'number') {
      return imageUrl;
    }

    const url = imageUrl as string | undefined;
    if (url && /^https?:\/\//i.test(url)) {
      return { uri: url };
    }

    if (!serviceId) {
      return require('@/assets/images/yoga-w.jpg');
    }

    return null;
  }, [imageUrl, serviceImageUrl, serviceId]);

  const description = useMemo(() => {
    if (serviceDescription) return serviceDescription;
    if (serviceId) return '';
    const titleLower = String(title || '').toLowerCase();
    const map: Record<string, string> = {
      zumba: 'Clase de baile fitness con ritmos latinos para mejorar resistencia y coordinación. Ideal para todos los niveles y enfocada en divertirse mientras quemas calorías.',
      spinning:
        'Entrenamiento en bicicleta estacionaria de alta intensidad que mejora la capacidad cardiovascular y fortalece piernas y glúteos con intervalos y cambios de ritmo.',
      'yoga flow':
        'Secuencia fluida de posturas que trabaja fuerza, flexibilidad y respiración consciente. Perfecta para reducir el estrés y mejorar la movilidad general.',
      crossfit:
        'Entrenamiento funcional de alta intensidad que combina levantamiento olímpico, gimnasia y trabajo metabólico. Mejora fuerza, potencia y resistencia con WODs variados.',
    };
    return (
      map[titleLower] ||
      'Entrenamiento diseñado para mejorar tu condición física con foco en técnica y progreso seguro. Incluye trabajo de fuerza, movilidad y resistencia.'
    );
  }, [serviceDescription, serviceId, title]);

  const capNum = Number(capacity ?? 25);
  const occNumInitial = Number(occupied ?? 18);
  const [forceFull] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const isFullInitial = occNumInitial >= capNum;
  const effectiveFull = isFullInitial || forceFull;

  const id = useMemo(() => `${String(title || '')}|${String(time || '')}`, [title, time]);
  const reservedFromContext = isReserved(id);
  const hasBookingId = Boolean(bookingId);
  const reserved = reservedFromContext || hasBookingId || Boolean(serverBookingId);

  const { showToast } = useToast();
  const isCrossfitCompleted = String(title || '').toLowerCase() === 'crossfit' && effectiveFull;

  const timeRange = useMemo(() => {
    const raw = String(time || '').trim();
    if (!raw) return '07:00 - 08:00 AM';
    if (raw.includes('-')) return raw;
    const m = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!m) return raw;
    const [, hh, mm, ap] = m;
    let hour = parseInt(hh, 10) % 12;
    if (ap.toUpperCase() === 'PM') hour += 12;
    const start = new Date(2000, 0, 1, hour, parseInt(mm, 10));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => {
      let h = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h.toString().padStart(2, '0')}:${minutes} ${suffix}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
  }, [time]);

  const isInstructorMode = String(mode || '').toLowerCase() === 'instructor';

  /* Instructor logic restored */
  const [instructorFirstName, setInstructorFirstName] = useState<string | null>(null);
  const [instructorLastName, setInstructorLastName] = useState<string | null>(null);

  useEffect(() => {
    if (!isInstructorMode) return;

    const fetchInstructor = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const userData = await vitalFitApi.user.WhoAmI(token);
        setInstructorFirstName(userData?.user?.first_name || null);
        setInstructorLastName(userData?.user?.last_name || null);
      } catch {
        console.error('Error fetching instructor data');
      }
    };

    fetchInstructor();
  }, [isInstructorMode]);


  type BookingParticipant = {
    booking_id: string;
    created_at: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    status: string;
    user_id: string;
  };

  const [participants, setParticipants] = useState<BookingParticipant[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (!isInstructorMode || !classId) return;

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // Fetch bookings for this class
        const response = await vitalFitApi.booking.getBookingClass(String(classId), token, {
          page: 1,
          limit: 50,
        });

        // Handle PaginatedTotal<BookingParticipant[]> response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (response as any).data || (response as any).items || [];
        if (Array.isArray(data)) {
          setParticipants(data);
        }
      } catch (error) {
        console.error('Error fetching class participants:', error);
        showToast('error', t('common.error.title'), t('common.error.generic'));
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, [isInstructorMode, classId, showToast, t]);

  /* State restored */
  const [activeTab, setActiveTab] = useState<'clientes' | 'pasar-lista'>('clientes');
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'late' | 'absent'>>({});
  const [search, setSearch] = useState('');
  const [classNotes, setClassNotes] = useState('');

  const filteredClients = useMemo(() => {
    return participants
      .filter((p) => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        return fullName.includes(search.toLowerCase().trim());
      })
      .map((p) => ({
        id: p.booking_id, // Map booking_id to id for UI
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || t('common.unknown'),
        level: 'General', // Default value as API doesn't return level yet
        program: 'Sin programa', // Default value
      }));
  }, [participants, search, t]);

  if (isInstructorMode) {
    return (
      <ThemedView lightColor='#FFFFFF' darkColor='#050816' className='flex-1 p-4 pt-12'>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-4 flex-row items-center justify-center'>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              className='absolute left-4'>
              <ChevronLeftIcon width={20} height={20} color='#f97316' />
            </TouchableOpacity>
            <ThemedText
              lightColor='#111827'
              className='text-base font-semibold'
              style={{ fontFamily: 'System', fontSize: 16, fontWeight: '600' }}>
              {t('classDetails.title')}
            </ThemedText>
          </View>
          {heroSource && !imageError ? (
            <Image
              source={heroSource}
              style={styles.heroImage}
              contentFit='cover'
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]}>
              <Image
                source={require('@/assets/images/isotipo.png')}
                style={{ width: 160, height: 160 }}
                contentFit='contain'
              />
            </View>
          )}

          <ThemedText
            lightColor='#111827'
            darkColor='#ffffff'
            className='text-3xl font-extrabold mt-4 mb-1'
            style={{ fontFamily: 'BebasNeue-Regular' }}>
            {String(title || 'Nombre de la clase').toUpperCase()}
          </ThemedText>

          <View className='mb-1'>
            <ThemedText
              lightColor='#6b7280'
              darkColor='#d4d4d4'
              className='text-sm'
              style={{ fontFamily: 'Montserrat_400Regular' }}>
              {classDateFormatted}
            </ThemedText>
          </View>

          <View className='mb-1'>
            <ThemedText
              lightColor='#4b5563'
              darkColor='#e5e5e5'
              className='text-sm'
              style={{ fontFamily: 'Montserrat_500Medium' }}>
              18 / 25 cupos ocupados
            </ThemedText>
          </View>

          <View className='mb-3'>
            <ThemedText lightColor='#f97316' darkColor='#f97316' className='font-bold'>
              07:00 - 08:00 AM
            </ThemedText>
          </View>

          <View className='flex-row items-center mb-3'>
            <StarIcon size={16} color='#F59E0B' />
            <ThemedText
              lightColor='#4b5563'
              darkColor='#e5e5e5'
              className='ml-2 text-sm'
              style={{ fontFamily: 'Montserrat_400Regular' }}>
              4.9 (231 reviews)
            </ThemedText>
          </View>

          <View className='flex-row items-center mb-4'>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/31.jpg' }}
              style={{ width: 28, height: 28, borderRadius: 9999 }}
              contentFit='cover'
            />
            <ThemedText
              lightColor='#4b5563'
              darkColor='#e5e5e5'
              className='ml-2'
              style={{ fontFamily: 'Montserrat_500Medium' }}>
              {instructorFirstName || instructorLastName
                ? `${instructorFirstName ?? ''} ${instructorLastName ?? ''}`.trim()
                : String(instructor || t('classDetails.defaultInstructor'))}
            </ThemedText>
          </View>

          <View className='mb-2'>
            <ThemedText
              lightColor='#f97316'
              darkColor='#f97316'
              className='font-semibold'
              style={{ fontFamily: 'Montserrat_600SemiBold' }}>
              Nivel: intermedio
            </ThemedText>
          </View>

          <View className='mb-4'>
            <ThemedText
              lightColor='#111827'
              darkColor='#ffffff'
              className='mb-1'
              style={{ fontFamily: 'Montserrat_600SemiBold' }}>
              {t('classDetails.descriptionTitle')}
            </ThemedText>
            <ThemedText
              lightColor='#4b5563'
              darkColor='#ffffff'
              className='text-sm leading-relaxed'
              style={{ fontFamily: 'Montserrat_400Regular' }}>
              Este entrenamiento de fuerza se enfoca en el desarrollo muscular y la
              resistencia. Incluye ejercicios con pesas, bandas de resistencia y peso
              corporal. Ideal para todos los niveles.
            </ThemedText>
          </View>

          <View className='flex-row bg-[#F3F4F6] rounded-2xl p-1 mb-3'>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'clientes' ? 'bg-white' : 'bg-transparent'
                }`}
              activeOpacity={0.7}
              onPress={() => setActiveTab('clientes')}>
              <Text
                className={`font-semibold font-body ${activeTab === 'clientes' ? 'text-[#111827]' : 'text-[#6b7280]'
                  }`}>
                {t('classDetails.tabs.clients')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'pasar-lista' ? 'bg-white' : 'bg-transparent'
                }`}
              activeOpacity={0.7}
              onPress={() => setActiveTab('pasar-lista')}>
              <Text
                className={`font-semibold font-body ${activeTab === 'pasar-lista'
                  ? 'text-[#111827]'
                  : 'text-[#6b7280]'
                  }`}>
                {t('classDetails.tabs.attendance')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className='mb-3'>
            <View className='border border-[#e5e7eb] rounded-2xl px-3 py-2 bg-white flex-row items-center'>
              <MagnifyingGlassIcon width={18} height={18} color='#f97316' />
              <TextInput
                placeholder={t('classDetails.searchPlaceholder')}
                placeholderTextColor='#9ca3af'
                value={search}
                onChangeText={setSearch}
                style={{ fontSize: 14, color: '#111827', marginLeft: 8, flex: 1 }}
              />
            </View>
          </View>

          <View className='mb-6'>
            {activeTab === 'clientes' ? (
              <View className='rounded-2xl bg-white px-4 py-3 border border-[#e5e7eb] shadow-sm'>
                <View className='flex-row items-center mb-3'>
                  <UsersIcon size={18} color='#f97316' />
                  <Text className='ml-2 text-[14px] font-medium text-[#111827] font-body'>
                    {t('classDetails.clientsListTitle')}
                  </Text>
                </View>

                {filteredClients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    className='flex-row items-center justify-between bg-[#F8F9FB] rounded-2xl px-4 py-4 mb-3'
                    activeOpacity={0.8}>
                    <View className='flex-row items-center flex-1'>
                      <View className='w-10 h-10 rounded-xl bg-[#FED7AA] justify-center items-center mr-3'>
                        <UserIcon size={22} color='#f97316' />
                      </View>
                      <View className='flex-1'>
                        <Text className='text-[14px] font-bold text-[#1F2024] font-body'>
                          {client.name}
                        </Text>
                        <Text className='text-[12px] text-[#71727A] font-body'>
                          {client.level}
                        </Text>
                      </View>
                    </View>
                    <ChevronRightIcon size={12} color='#71727A' />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className='rounded-2xl bg-white px-4 py-4 border border-[#e5e7eb] shadow-sm'>
                <View className='flex-row items-center mb-4'>
                  <UsersIcon size={18} color='#f97316' />
                  <Text className='ml-2 text-[14px] font-medium text-[#111827] font-body'>
                    {t('classDetails.clientsEnrolled')}
                  </Text>
                </View>

                {filteredClients.map((client) => {
                  const status = attendance[client.id];
                  return (
                    <View
                      key={client.id}
                      className='bg-[#F8F9FB] rounded-2xl px-4 py-4 mb-4'>
                      <View className='flex-row items-center mb-2'>
                        <View className='w-12 h-12 rounded-full bg-[#FED7AA] justify-center items-center mr-3'>
                          <UserIcon size={26} color='#f97316' />
                        </View>
                        <View className='flex-1'>
                          <Text className='text-[16px] font-bold text-[#1F2024] font-body'>
                            {client.name}
                          </Text>
                          <Text className='text-[12px] text-[#71727A] mb-1 font-body'>
                            {client.level}
                          </Text>
                        </View>
                      </View>

                      <View className='mb-4'>
                        <ThemedText
                          lightColor='#111827'
                          darkColor='#e5e5e5'
                          className='text-[15px] font-semibold'
                          style={{
                            fontFamily: 'Montserrat_600SemiBold',
                          }}>
                          {client.program}
                        </ThemedText>
                      </View>

                      <View className='flex-row gap-2'>
                        <TouchableOpacity
                          className={`flex-1 flex-row justify-center items-center rounded-xl py-3 ${status === 'present'
                            ? 'bg-[#f97316]'
                            : 'bg-white border border-[#f97316]'
                            }`}
                          activeOpacity={0.8}
                          onPress={() =>
                            setAttendance((prev) => ({
                              ...prev,
                              [client.id]: 'present',
                            }))
                          }>
                          <CheckIcon
                            size={16}
                            color={
                              status === 'present'
                                ? '#ffffff'
                                : '#f97316'
                            }
                            strokeWidth={3}
                          />
                          <Text
                            className={`ml-2 text-[13px] font-body ${status === 'present'
                              ? 'text-white'
                              : 'text-[#f97316]'
                              }`}
                            style={{
                              fontFamily: 'Montserrat_600SemiBold',
                            }}>
                            {t('classDetails.attendance.present')}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className={`flex-1 flex-row justify-center items-center rounded-xl py-3 ${status === 'late'
                            ? 'bg-[#D1D5DB]'
                            : 'bg-white border border-[#D1D5DB]'
                            }`}
                          activeOpacity={0.8}
                          onPress={() =>
                            setAttendance((prev) => ({
                              ...prev,
                              [client.id]: 'late',
                            }))
                          }>
                          <OutlineClockIcon
                            size={16}
                            color={
                              status === 'late'
                                ? '#374151'
                                : '#9ca3af'
                            }
                            strokeWidth={2.5}
                          />
                          <Text
                            className={`ml-2 text-[13px] font-body ${status === 'late'
                              ? 'text-[#374151]'
                              : 'text-[#9ca3af]'
                              }`}
                            style={{
                              fontFamily: 'Montserrat_600SemiBold',
                            }}>
                            {t('classDetails.attendance.late')}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          className={`flex-1 flex-row justify-center items-center rounded-xl py-3 bg-white border ${status === 'absent'
                            ? 'border-[#374151]'
                            : 'border-[#e5e7eb]'
                            }`}
                          activeOpacity={0.8}
                          onPress={() =>
                            setAttendance((prev) => ({
                              ...prev,
                              [client.id]: 'absent',
                            }))
                          }>
                          <XMarkIcon
                            size={16}
                            color='#374151'
                            strokeWidth={2.5}
                          />
                          <Text
                            className='ml-2 text-[13px] text-[#374151] font-body'
                            style={{
                              fontFamily: 'Montserrat_600SemiBold',
                            }}>
                            {t('classDetails.attendance.absent')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                <View className='h-[1px] bg-[#f97316] w-full mb-4 mt-1' />

                <View className='mt-1'>
                  <ThemedText
                    lightColor='#111827'
                    darkColor='#ffffff'
                    className='mb-2'
                    style={{ fontFamily: 'Montserrat_600SemiBold' }}>
                    {t('classDetails.internalNotesTitle')}
                  </ThemedText>

                  <View className='mb-3'>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      placeholder={t('classDetails.notesPlaceholder')}
                      placeholderTextColor='#9ca3af'
                      value={classNotes}
                      onChangeText={setClassNotes}
                      style={{
                        borderWidth: 1,
                        borderColor: '#d1d5db',
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        minHeight: 120,
                        textAlignVertical: 'top',
                        fontSize: 13,
                        color: '#111827',
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    className='w-full py-3 rounded-2xl mb-3 items-center justify-center'
                    style={{
                      backgroundColor: '#4b5563',
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                    }}
                    onPress={() =>
                      showToast(
                        'success',
                        t('classDetails.toasts.notesSaved.title'),
                        t('classDetails.toasts.notesSaved.message'),
                      )
                    }>
                    <ThemedText
                      lightColor='#f9fafb'
                      darkColor='#f9fafb'
                      className='text-sm'
                      style={{ fontFamily: 'Montserrat_500Medium' }}>
                      {t('classDetails.saveNotes')}
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    className='w-full py-3 rounded-2xl items-center justify-center'
                    style={{ backgroundColor: '#f97316' }}
                    onPress={() =>
                      showToast(
                        'success',
                        t('classDetails.toasts.attendanceSaved.title'),
                        t('classDetails.toasts.attendanceSaved.message'),
                      )
                    }>
                    <ThemedText
                      lightColor='#ffffff'
                      darkColor='#ffffff'
                      className='text-sm font-semibold'
                      style={{ fontFamily: 'Montserrat_600SemiBold' }}>
                      {t('classDetails.saveAttendance')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView lightColor='#FFFFFF' darkColor='#050816' className='flex-1 p-4 pt-12'>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-4 flex-row items-center justify-center'>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className='absolute left-4'>
            <ChevronLeftIcon width={20} height={20} color='#f97316' />
          </TouchableOpacity>
          <ThemedText
            lightColor='#111827'
            className='text-base font-semibold'
            style={{ fontFamily: 'System', fontSize: 16, fontWeight: '600' }}>
            {t('classDetails.title')}
          </ThemedText>
        </View>
        {heroSource && !imageError ? (
          <Image
            source={heroSource}
            style={styles.heroImage}
            contentFit='cover'
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }]}>
            <Image
              source={require('@/assets/images/isotipo.png')}
              style={{ width: 160, height: 160 }}
              contentFit='contain'
            />
          </View>
        )}

        <ThemedText
          lightColor='#111827'
          darkColor='#ffffff'
          className='text-3xl font-extrabold mt-4 mb-1'
          style={{ fontFamily: 'BebasNeue-Regular' }}>
          {String(title || t('classDetails.defaultName')).toUpperCase()}
        </ThemedText>

        <View className='mb-1'>
          <ThemedText
            lightColor='#6b7280'
            darkColor='#d4d4d4'
            className='text-sm'
            style={{ fontFamily: 'Montserrat_400Regular' }}>
            {classDateFormatted}
          </ThemedText>
        </View>

        {/* Occupancy Indicator */}
        <View className='mb-4 flex-row items-center'>
          <UserIcon size={16} color='#6b7280' style={{ marginRight: 6 }} />
          <ThemedText
            className='text-sm text-gray-500 font-medium'
            style={{ fontFamily: 'Montserrat_500Medium' }}>
            {currentOccupancyCount !== null && capacity
              ? `${currentOccupancyCount} / ${capacity} ${t('classDetails.occupiedSpots')}`
              : capacity
                ? `${capacity} ${t('classDetails.totalSpots')}`
                : t('classDetails.limitedSpots')}
          </ThemedText>
        </View>

        {effectiveFull && !isCrossfitCompleted && (
          <View
            className='mb-2 flex-row items-center rounded-2xl px-4 py-2'
            style={{ backgroundColor: '#fecaca' }}>
            <View
              className='items-center justify-center mr-3 rounded-full'
              style={{ width: 26, height: 26, backgroundColor: '#f97373' }}>
              <ExclamationCircleIcon size={15} color='#ffffff' />
            </View>
            <ThemedText
              lightColor='#b91c1c'
              darkColor='#b91c1c'
              className='text-xs font-medium'>
              {t('classDetails.filledWhileBooking')}
            </ThemedText>
          </View>
        )}

        {reserved && (
          <View className='mb-3'>
            <View className='self-start bg-emerald-500 px-3 py-1 rounded-full'>
              <ThemedText
                lightColor='#ffffff'
                darkColor='#ffffff'
                className='text-xs font-semibold'>
                {t('classDetails.reserve')}d
              </ThemedText>
            </View>
          </View>
        )}

        <View className='mb-3'>
          <ThemedText lightColor='#f97316' darkColor='#f97316' className='font-bold'>
            {timeRange}
          </ThemedText>
        </View>

        <View className='flex-row items-center mb-4'>
          <Image
            source={
              instructorImageUrl && instructorImageUrl.startsWith('http')
                ? { uri: instructorImageUrl }
                : { uri: 'https://randomuser.me/api/portraits/men/32.jpg' }
            }
            style={{ width: 28, height: 28, borderRadius: 9999 }}
            contentFit='cover'
          />
          <ThemedText
            lightColor='#4b5563'
            darkColor='#e5e5e5'
            className='ml-2'
            style={{ fontFamily: 'Montserrat_500Medium' }}>
            {String(instructor || t('classDetails.defaultInstructor'))}
          </ThemedText>
        </View>

        <View className='mb-4'>
          <ThemedText
            lightColor='#111827'
            darkColor='#ffffff'
            className='mb-1'
            style={{ fontFamily: 'Montserrat_600SemiBold' }}>
            {t('classDetails.descriptionTitle')}
          </ThemedText>
          <ThemedText
            lightColor='#4b5563'
            darkColor='#ffffff'
            className='text-sm leading-relaxed'
            style={{ fontFamily: 'Montserrat_400Regular' }}>
            {description}
          </ThemedText>
        </View>

        {isCrossfitCompleted ? (
          <View className='mb-6 items-center'>
            <View className='flex-row items-center rounded-full px-4 py-2 bg-emerald-50'>
              <CheckCircleIcon size={18} color='#22c55e' />
              <ThemedText
                lightColor='#166534'
                darkColor='#e5e5e5'
                className='ml-2 text-xs font-semibold'>
                {t('common.completed')}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View className='mb-6'>
            <PrimaryButton
              title={
                isPast
                  ? t('classDetails.pastClass')
                  : effectiveFull
                    ? t('classDetails.classFull')
                    : reserved
                      ? t('common.cancel')
                      : t('classDetails.reserve')
              }
              disabled={isPast || effectiveFull || (!hasMembership && !reserved)}
              style={{
                backgroundColor:
                  isPast || effectiveFull || (!hasMembership && !reserved)
                    ? '#6b7280'
                    : reserved
                      ? '#ef4444'
                      : '#f97316',
              }}
              onPress={async () => {
                if (effectiveFull) return;

                if (reserved) {
                  setShowCancelModal(true);
                  return;
                }

                try {
                  // Use authToken from AuthContext (always fresh, automatically refreshed)
                  if (!authToken) {
                    showToast(
                      'error',
                      t('common.error.sessionExpired'),
                      t('classDetails.toasts.bookingError.generic'),
                    );
                    return;
                  }

                  if (!classId) {
                    showToast(
                      'error',
                      t('classDetails.toasts.bookingError.title'),
                      t('classDetails.toasts.bookingError.missingId'),
                    );
                    return;
                  }

                  console.log('[DEBUG] Booking class with classId:', classId);
                  console.log('[DEBUG] Class details:', {
                    title,
                    serviceId,
                    instructorId,
                    branchId,
                    startsAt,
                  });

                  const whoAmI = (await vitalFitApi.user.WhoAmI(
                    authToken,
                  )) as unknown as {
                    user?: { id?: string; user_id?: string };
                  };
                  const userId = whoAmI?.user?.id || whoAmI?.user?.user_id;

                  if (!userId) {
                    showToast(
                      'error',
                      t('classDetails.toasts.bookingError.userUnknown'),
                      t('classDetails.toasts.bookingError.userInfoError'),
                    );
                    return;
                  }

                  console.log('[DEBUG] Booking with userId:', userId, 'classId:', classId);

                  // Make the actual booking API call
                  try {
                    await vitalFitApi.booking.bookClass(
                      { user_id: String(userId) },
                      String(classId),
                      authToken,
                    );
                  } catch (bookingError: unknown) {
                    // Log the raw error to help diagnose the server issue
                    console.error('[DEBUG] Raw booking API error:', JSON.stringify(bookingError, null, 2));
                    throw bookingError; // Re-throw to be handled by outer catch
                  }

                  console.log('[DEBUG] Booking successful');

                  const img =
                    typeof heroSource === 'number'
                      ? heroSource
                      : (imageUrl as string | number | undefined);

                  await reserve({
                    id,
                    title: String(title || ''),
                    time: String(time || ''),
                    instructor: String(instructor || ''),
                    imageUrl: img,
                  });

                  showToast(
                    'success',
                    t('classDetails.toasts.bookingSuccess.title'),
                    t('classDetails.toasts.bookingSuccess.message'),
                  );

                  router.back();
                } catch (error: unknown) {
                  console.error('[DEBUG] Full booking error:', error);
                  console.error('[DEBUG] Error type:', typeof error);
                  console.error('[DEBUG] Error constructor:', error?.constructor?.name);

                  // Log additional details
                  if (isAPIError(error)) {
                    console.error('[DEBUG] API Error status:', error.status);
                    console.error('[DEBUG] API Error messages:', error.messages);
                  }

                  let message = t('classDetails.toasts.bookingError.generic');

                  // Check for 402 Payment Required error
                  if (isAPIError(error) && error.status === 402) {
                    showToast(
                      'error',
                      t('classDetails.toasts.paymentRequired.title'),
                      t('classDetails.toasts.paymentRequired.message'),
                    );

                    // Fetch service price from branch services endpoint
                    let serviceName = serviceData?.name || String(title) || 'Servicio';
                    let servicePrice = serviceData?.price ?? 0;

                    // If we don't have the price, try to fetch from branch services
                    if (servicePrice === 0 && branchId && serviceId) {
                      try {
                        const branchServicesResp = await vitalFitApi.client.get({
                          url: `/public/branches/${String(branchId)}/services`,
                          jwt: authToken || undefined,
                          params: { page: 1, limit: 50, currency: 'USD' },
                        });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const branchServices = (branchServicesResp as any)?.data || [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const matchedService = branchServices.find((s: any) =>
                          String(s.service_id) === String(serviceId)
                        );
                        if (matchedService) {
                          serviceName = matchedService.name || serviceName;
                          servicePrice =
                            matchedService.lowest_price_no_member ??
                            matchedService.lowest_price_member ??
                            matchedService.price ??
                            0;
                        }
                      } catch (fetchError) {
                        console.warn('Could not fetch service price from branch:', fetchError);
                      }
                    }

                    // Build service object for checkout
                    const serviceForCheckout = {
                      service_id: String(serviceId),
                      name: serviceName,
                      price: servicePrice,
                      type: 'service',
                    };

                    // Get today's date in ISO format for start date
                    const today = new Date().toISOString();

                    router.push({
                      pathname: '/membership-checkout',
                      params: {
                        title: serviceName,
                        price: String(servicePrice),
                        type: 'service',
                        servicesJson: JSON.stringify([serviceForCheckout]),
                        // Pass branchId to be used in confirmation step
                        fromClassDetails: 'true',
                        preselectedBranchId: branchId ? String(branchId) : '',
                        preselectedStartDate: today,
                      },
                    });
                    return;
                  }

                  // Check for 500 Internal Server Error
                  if (isAPIError(error) && error.status === 500) {
                    console.error('[DEBUG] Server 500 error - this is a backend issue');
                    console.error('[DEBUG] Possible causes: DB constraint, missing data on server, or server bug');

                    // Provide a more helpful error message to the user
                    message = t('common.error.serverError') ||
                      'Error del servidor al procesar la reserva. Por favor contacta al administrador o intenta con otra clase.';
                  } else if (isAPIError(error)) {
                    message = error.messages.join(', ');
                  } else if (error instanceof Error) {
                    message = error.message;
                  }

                  console.error('Error al reservar clase:', error);
                  showToast('error', t('classDetails.toasts.bookingError.title'), message);
                }
              }}
            />
            {!hasMembership && !reserved && (
              <View className='mt-2 items-center'>
                <ThemedText
                  lightColor='#ef4444'
                  darkColor='#ef4444'
                  className='text-xs font-medium'>
                  {t('classDetails.membershipRequired')}
                </ThemedText>
              </View>
            )}
          </View>
        )}
        <View className='items-center justify-center mb-2'>
          <ThemedText
            lightColor='#9ca3af'
            darkColor='#9ca3af'
            className='italic text-center text-xs'>
            {t('classDetails.cancellationPolicy')}
          </ThemedText>
        </View>
      </ScrollView>

      <Modal
        visible={showCancelModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowCancelModal(false)}>
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
          onPress={() => setShowCancelModal(false)}>
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              paddingVertical: 24,
              paddingHorizontal: 20,
              width: '100%',
              maxWidth: 360,
            }}>
            <ThemedText
              lightColor='#111827'
              darkColor='#ffffff'
              className='text-xl font-bold text-center mb-2'>
              {t('classDetails.cancelModal.title')}
            </ThemedText>
            <ThemedText
              lightColor='#4b5563'
              darkColor='#9ca3af'
              className='text-sm text-center mb-6'>
              {t('classDetails.cancelModal.message')}
            </ThemedText>
            <View className='gap-3'>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    const token = await AsyncStorage.getItem('token');
                    if (!token) {
                      showToast(
                        'error',
                        t('common.error.sessionExpired'),
                        t('classDetails.toasts.cancelError.generic'),
                      );
                      return;
                    }

                    // HU-MOBILE-37: never report a cancellation that did not
                    // reach the server. Resolve the booking id if it is missing.
                    let targetBookingId = bookingId || serverBookingId;
                    if (!targetBookingId && user?.userId) {
                      const resp = await vitalFitApi.booking.getClientBooking(
                        String(user.userId),
                        token,
                      );
                      const list = (
                        Array.isArray((resp as unknown as { data: ClientBookingResponse[] }).data)
                          ? (resp as unknown as { data: ClientBookingResponse[] }).data
                          : resp
                      ) as ClientBookingResponse[];
                      const match = list.find((b) => String(b.class_id) === String(classId));
                      targetBookingId = match?.booking_id ? String(match.booking_id) : null;
                    }

                    if (!targetBookingId) {
                      await cancel(id);
                      setShowCancelModal(false);
                      showToast(
                        'error',
                        t('classDetails.toasts.cancelError.title'),
                        t('classDetails.toasts.cancelError.generic'),
                      );
                      return;
                    }

                    try {
                      await vitalFitApi.booking.cancelBooking(String(targetBookingId), token);
                    } catch (cancelErr: unknown) {
                      const text = String(
                        (cancelErr as { messages?: string[] })?.messages?.join(' ') ?? cancelErr,
                      ).toLowerCase();
                      // The booking was already cancelled on the server: just sync local state.
                      if (!text.includes('already cancelled')) {
                        throw cancelErr;
                      }
                    }

                    await cancel(id);
                    setShowCancelModal(false);

                    showToast(
                      'success',
                      t('classDetails.toasts.cancelSuccess.title'),
                      t('classDetails.toasts.cancelSuccess.message'),
                    );

                    router.back();
                  } catch (error: unknown) {
                    let message = t('classDetails.toasts.cancelError.generic');
                    let isLateCancellation = false;

                    // Robust error text extraction
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const errAny = error as any;
                    const errorString = (
                      (errAny?.message || '') +
                      ' ' +
                      (Array.isArray(errAny?.messages)
                        ? errAny.messages.join(' ')
                        : '') +
                      ' ' +
                      String(error)
                    ).toLowerCase();

                    // Detect restricted time window error globally
                    if (errorString.includes('restricted time window')) {
                      message = t('classDetails.toasts.cancelError.lateCancellation');
                      isLateCancellation = true;
                    } else if (isAPIError(error)) {
                      message = error.messages.join(', ');
                    } else if (error instanceof Error) {
                      message = error.message;
                    }

                    if (isLateCancellation) {
                      console.warn(
                        'Cancelación tardía detectada (Handled):',
                        message,
                      );
                      showToast('error', t('classDetails.toasts.cancelError.timeLimitTitle'), message);
                    } else {
                      console.error('Error al cancelar reserva:', error);
                      showToast('error', t('classDetails.toasts.cancelError.title'), message);
                    }
                  }
                }}
                className='py-3 rounded-2xl items-center'
                style={{ backgroundColor: '#f97316' }}>
                <ThemedText
                  lightColor='#ffffff'
                  darkColor='#ffffff'
                  className='text-base font-bold'>
                  {t('common.accept')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCancelModal(false)}
                className='py-3 rounded-2xl items-center'
                style={{ backgroundColor: '#e5e7eb' }}>
                <ThemedText
                  lightColor='#111827'
                  darkColor='#ffffff'
                  className='text-base font-bold'>
                  {t('common.back')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}