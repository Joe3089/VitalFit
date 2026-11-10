import { MonthCalendar } from '@/components/auth/dashboard/monthcalendar';
import { WeekCalendar } from '@/components/auth/dashboard/weekcalendar';

import BranchSelectionModal from '@/components/BranchSelectionModal';
import ClassCard from '@/components/ClassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useReservations } from '@/contexts/reservations';
import vitalFitApi from '@/services';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
    BranchClassInfo,
    BranchScheduleResponse,
    ClientBookingResponse,
    isAPIError,
} from '@vitalfit/sdk';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    ActivityIndicator,
    Image,
    NativeScrollEvent,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 8;

type BranchItem = {
    branch_id: string;
    name: string;
};

type ClassItem = {
    classId: string;
    serviceId: string;
    instructorId: string;
    startsAt: string;
    endsAt: string;
    time: string;
    title: string;
    instructor: string;
    branch: string;
    imageUrl: string | number;
    capacity: number;
    occupied: number;
    rawDate: string;
};

type BookingItem = {
    bookingId: string;
    classId: string;
    serviceId: string;
    instructorId: string;
    time: string;
    title: string;
    instructor: string;
    branch: string;
    imageUrl: string | number;
    capacity: number;
    occupied: number;
    rawDate: string;
    startsAt: string;
    createdAt?: string;
};

export default function HorariosScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'classes' | 'reservas'>('classes');
    const { isReserved } = useReservations();
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedBranchName, setSelectedBranchName] = useState<string>('');
    const [branchModalVisible, setBranchModalVisible] = useState(false);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [visibleClassesCount, setVisibleClassesCount] = useState(PAGE_SIZE);
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [bookingsError, setBookingsError] = useState<string | null>(null);
    const [visibleBookingsCount, setVisibleBookingsCount] = useState(PAGE_SIZE);
    const [refreshKey, setRefreshKey] = useState(0);

    // Caches to avoid redundant API calls and 429 errors
    const servicesCache = useRef<Record<string, { name: string; image: string }>>({});
    const instructorsCache = useRef<Record<string, string>>({});
    const bookingInfoByClassId = useRef<Record<string, { bookingId: string; createdAt: string }>>({});

    // Helper to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Start with today's date selected by default
    const [selectedClassesDate, setSelectedClassesDate] = useState<string>(
        formatLocalDate(new Date())
    );
    const [selectedBookingsDate, setSelectedBookingsDate] = useState<string>(
        formatLocalDate(new Date())
    );

    const isCloseToBottom = ({
        layoutMeasurement,
        contentOffset,
        contentSize,
    }: NativeScrollEvent) => {
        const paddingToBottom = 100;
        return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    };

    const handleScroll = ({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
        if (activeTab === 'classes') {
            if (isCloseToBottom(nativeEvent)) {
                setVisibleClassesCount((prev) => Math.min(prev + PAGE_SIZE, classes.length));
            }
        } else if (activeTab === 'reservas') {
            if (isCloseToBottom(nativeEvent)) {
                setVisibleBookingsCount((prev) => Math.min(prev + PAGE_SIZE, bookings.length));
            }
        }
    };

    useEffect(() => {
        const initBranches = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await vitalFitApi.public.getBranchMap(token || '');
                const data = (response as { data?: BranchItem[] }).data || [];

                if (data.length > 0 && !selectedBranchId) {
                    setSelectedBranchId(data[0].branch_id);
                    setSelectedBranchName(data[0].name);
                }
            } catch (error) {
                console.error('Error cargando sucursales en Schedule:', error);
            } finally {
                setLoadingClasses(false);
            }
        };

        void initBranches();
    }, [selectedBranchId]);

    useFocusEffect(
        useCallback(() => {
            setRefreshKey((prev) => prev + 1);
        }, []),
    );

    useEffect(() => {
        const loadClasses = async () => {
            if (!selectedBranchId) {
                setClasses([]);
                return;
            }

            setLoadingClasses(true);
            setErrorMessage(null);
            try {
                const token = await AsyncStorage.getItem('token');

                // Use the date parameter to filter classes by the selected date
                // Extract month and year from the selected date to pass all parameters
                const dateObj = new Date(selectedClassesDate);
                const month = dateObj.getMonth() + 1; // 1-12
                const year = dateObj.getFullYear();

                const response = await vitalFitApi.schedule.ListBranchesClass(
                    selectedBranchId,
                    token || '',
                    month,
                    year,
                    selectedClassesDate,
                );

                const raw =
                    (response as { data?: BranchClassInfo[] } | BranchClassInfo[] | undefined) ??
                    [];
                const itemsFromApi = Array.isArray((raw as { data?: BranchClassInfo[] }).data)
                    ? (raw as { data?: BranchClassInfo[] }).data
                    : (raw as BranchClassInfo[]);
                const items: BranchClassInfo[] = Array.isArray(itemsFromApi) ? itemsFromApi : [];

                // 3. Prepare Caches & Identification of Missing Data
                const uniqueServiceIds = Array.from(
                    new Set(items.map((i) => i.service_id).filter((id): id is string => !!id)),
                );
                const uniqueInstructorIds = Array.from(
                    new Set(items.map((i) => i.instructor_id).filter((id): id is string => !!id)),
                );

                const missingServiceIds = uniqueServiceIds.filter(
                    (id) => !servicesCache.current[id],
                );
                const missingInstructorIds = uniqueInstructorIds.filter(
                    (id) => !instructorsCache.current[id],
                );

                // Helper to batch requests
                const batchFetch = async <T,>(
                    ids: string[],
                    fetcher: (id: string, token: string) => Promise<T>,
                    onSuccess: (id: string, data: T) => void,
                ) => {
                    const BATCH_SIZE = 5;
                    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                        const chunk = ids.slice(i, i + BATCH_SIZE);
                        await Promise.all(
                            chunk.map(async (id) => {
                                try {
                                    const res = await fetcher(id, token || '');
                                    onSuccess(id, res);
                                } catch (error) {
                                    if (isAPIError(error) && error.status !== 404) {
                                        console.warn(`Error fetching ${id}:`, error.status);
                                    }
                                }
                            }),
                        );
                    }
                };

                // 4. Fetch Missing Data (Parallelized & Cached)
                if (missingServiceIds.length > 0) {
                    await batchFetch(
                        missingServiceIds,
                        (id, t) => vitalFitApi.products.getServiceByID(id, t),
                        (id, res) => {
                            const s = res.data;
                            const name = (s && s.name) || 'Clase';
                            const images = Array.isArray(s?.images) ? s.images : [];
                            let image = '';
                            if (images.length > 0) {
                                const primary = images.find((img) => img.is_primary) ?? images[0];
                                image = primary?.image_url || '';
                            }
                            servicesCache.current[id] = { name, image };
                        },
                    );
                }

                if (missingInstructorIds.length > 0) {
                    await batchFetch(
                        missingInstructorIds,
                        (id, t) => vitalFitApi.instructor.getInstructorById(id, t),
                        (id, res) => {
                            const inst = res.data;
                            const fullName = [inst?.first_name, inst?.last_name]
                                .filter(Boolean)
                                .join(' ');
                            if (fullName) {
                                instructorsCache.current[id] = fullName;
                            }
                        },
                    );
                }

                const mapped: ClassItem[] = items.map((item) => {
                    const startsAt = item.starts_at || '';
                    const endsAt = item.ends_at || '';

                    const extractTime = (value: string) => {
                        if (!value) return '';
                        try {
                            const date = new Date(value);
                            return date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            });
                        } catch {
                            return '';
                        }
                    };

                    const startTime = extractTime(String(startsAt));
                    const endTime = extractTime(String(endsAt));
                    const time = endTime ? `${startTime} - ${endTime}` : startTime;
                    const instructorId = item.instructor_id;
                    const sid = item.service_id || '';
                    const instructorName = instructorId
                        ? instructorsCache.current[instructorId]
                        : undefined;
                    const serviceData = servicesCache.current[sid];
                    // Extract rawDate in local timezone
                    const rawDate = startsAt ? formatLocalDate(new Date(startsAt)) : '';
                    return {
                        classId: item.class_id || '',
                        serviceId: sid,
                        instructorId: instructorId || '',
                        startsAt: String(startsAt || ''),
                        endsAt: String(endsAt || ''),
                        time,
                        title: serviceData?.name || 'Clase',
                        instructor: instructorName ? `${t('common.with')} ${instructorName}` : t('common.instructor'),
                        branch: '',
                        imageUrl: serviceData?.image || require('@/assets/images/rutina.png'),
                        capacity: item.max_capacity || 0,
                        occupied: 0, // Initial value
                        rawDate,
                    };
                });

                setClasses(mapped);
                setVisibleClassesCount(PAGE_SIZE);
            } catch (error) {
                console.error('Error cargando clases en Schedule:', error);
                setErrorMessage(t('schedule.errorLoadingClasses'));
            } finally {
                setLoadingClasses(false);
            }
        };

        void loadClasses();
    }, [selectedBranchId, selectedClassesDate, refreshKey, t]);

    useEffect(() => {
        const loadBookings = async () => {
            setBookingsError(null);
            setLoadingBookings(true);
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    setBookings([]);
                    return;
                }

                const whoAmI = (await vitalFitApi.user.WhoAmI(token)) as unknown as {
                    user?: { id?: string; user_id?: string };
                };
                const userId = whoAmI?.user?.id || whoAmI?.user?.user_id;
                if (!userId) {
                    setBookings([]);
                    return;
                }

                const bookingsResp = await vitalFitApi.booking.getClientBooking(
                    String(userId),
                    token,
                );

                const rawBookings =
                    (bookingsResp as
                        | { data?: ClientBookingResponse[] }
                        | ClientBookingResponse[]
                        | undefined) ?? [];
                const bookingsItems =
                    (Array.isArray((rawBookings as { data?: ClientBookingResponse[] }).data)
                        ? (rawBookings as { data?: ClientBookingResponse[] }).data
                        : (rawBookings as ClientBookingResponse[])) ?? [];

                bookingInfoByClassId.current = {};
                bookingsItems.forEach((bk) => {
                    const cId = bk.class_id;
                    const bId = bk.booking_id;

                    if (cId && bId) {
                        bookingInfoByClassId.current[String(cId)] = { bookingId: String(bId), createdAt: '' };
                    }
                });

                // Get all branches
                const branchesResp = await vitalFitApi.public.getBranchMap(token);
                const allBranches = (branchesResp as { data?: { branch_id: string }[] }).data || [];

                // Use selected bookings date for filtering
                const dateObj = new Date(selectedBookingsDate);
                const month = dateObj.getMonth() + 1; // 1-12
                const year = dateObj.getFullYear();

                // Fetch bookings from all branches with date filtering
                const allBranchBookings: BranchScheduleResponse[] = [];

                // 1. Define the actual function signature based on your network trace
                type GetClientBranchBookingFn = (
                    branchId: string,
                    userId: string,
                    token: string,
                    month: number,
                    year: number,
                    date: string
                ) => Promise<{ data?: BranchScheduleResponse[] } | BranchScheduleResponse[] | undefined>;

                // 2. Updated implementation
                for (const branch of allBranches) {
                    try {
                        // Use the custom signature instead of 'any'
                        const response = await (vitalFitApi.booking.getClientBranchBooking as GetClientBranchBookingFn)(
                            String(branch.branch_id),
                            String(userId),
                            token,
                            month,
                            year,
                            selectedBookingsDate,
                        );

                        // Standardize the response without multiple 'as' casts
                        const itemsFromApi = Array.isArray(response)
                            ? response
                            : response?.data ?? [];

                        // Filter and add items
                        const userBranchBookings = itemsFromApi.filter(item =>
                            bookingInfoByClassId.current[String(item.class_id)]
                        );

                        allBranchBookings.push(...userBranchBookings);
                    } catch {
                        // Silently continue - some branches might not have bookings
                    }
                }

                const items = allBranchBookings;

                const serviceImageMap: Record<string, string> = {};
                const serviceNameMap: Record<string, string> = {};
                const uniqueServiceIds: string[] = Array.from(
                    new Set(
                        items
                            .map((item) => item.service_id)
                            .filter((value): value is string => Boolean(value)),
                    ),
                );

                for (const sid of uniqueServiceIds) {
                    try {
                        const serviceResp = await vitalFitApi.products.getServiceByID(
                            String(sid),
                            token || '',
                        );
                        const s = serviceResp.data;

                        const serviceName = (s && s.name) || 'Clase';
                        serviceNameMap[String(sid)] = serviceName;
                        const images = Array.isArray(s?.images) ? s.images : [];

                        if (Array.isArray(images) && images.length > 0) {
                            const primary = images.find((img) => img.is_primary) ?? images[0];
                            if (primary?.image_url) {
                                serviceImageMap[String(sid)] = primary.image_url;
                            }
                        }
                    } catch {
                        console.warn(
                            'Error cargando servicio para reservas (ignorable si no existe):',
                            sid,
                        );
                    }
                }

                const instructorMap: Record<string, string> = {};
                const uniqueInstructorIds: string[] = Array.from(
                    new Set(
                        items
                            .map((item) => item.instructor_id)
                            .filter((value): value is string => Boolean(value)),
                    ),
                );

                for (const iid of uniqueInstructorIds) {
                    try {
                        const instResp = await vitalFitApi.instructor.getInstructorById(
                            String(iid),
                            token,
                        );
                        const inst = instResp.data;

                        const fullName = [inst?.first_name, inst?.last_name]
                            .filter((part: string | undefined) => !!part)
                            .join(' ');
                        if (fullName) {
                            instructorMap[String(iid)] = fullName;
                        }
                    } catch (error) {
                        console.error('Error cargando instructor para reservas:', error);
                    }
                }

                // Backend now filters by date, so we only need to map the results
                const mappedBookings: BookingItem[] = items.map((item) => {
                    const startsAt = item.starts_at || '';
                    const endsAt = item.ends_at || '';

                    const extractTime = (value: string) => {
                        if (!value) return '';
                        try {
                            const date = new Date(value);
                            return date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            });
                        } catch {
                            return '';
                        }
                    };

                    const startTime = extractTime(String(startsAt));
                    const endTime = extractTime(String(endsAt));
                    const time = endTime ? `${startTime} - ${endTime}` : startTime;

                    const sid = item.service_id || '';
                    const instructorId = item.instructor_id || '';

                    const classId = item.class_id || '';
                    const bookingInfo = bookingInfoByClassId.current[String(classId)];
                    const bookingId = bookingInfo?.bookingId || '';
                    const createdAt = bookingInfo?.createdAt || '';

                    const title = serviceNameMap[String(sid)] || 'Clase';
                    const instructorNameFromMap = instructorId
                        ? instructorMap[String(instructorId)]
                        : undefined;

                    // Extract rawDate in local timezone
                    const rawDate = startsAt ? formatLocalDate(new Date(startsAt)) : '';
                    return {
                        bookingId,
                        classId,
                        serviceId: sid,
                        instructorId,
                        time,
                        title,
                        instructor: instructorNameFromMap
                            ? `${t('common.with')} ${instructorNameFromMap}`
                            : t('common.instructor'),
                        branch: '',
                        imageUrl:
                            serviceImageMap[String(sid)] || require('@/assets/images/rutina.png'),
                        capacity: item.max_capacity || 0,
                        occupied: 0,
                        rawDate,
                        startsAt: String(startsAt),
                        createdAt,
                    };
                });

                // Sort by startsAt ascending (soonest classes first)
                mappedBookings.sort((a, b) => {
                    if (!a.startsAt) return 1;
                    if (!b.startsAt) return -1;
                    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
                });

                setBookings(mappedBookings);
                setVisibleBookingsCount(PAGE_SIZE);
            } catch (error) {
                console.error('Error cargando reservas del cliente:', error);
                setBookingsError(t('schedule.errorLoadingBookings'));
            } finally {
                setLoadingBookings(false);
            }
        };

        if (activeTab === 'reservas') {
            void loadBookings();
        }
    }, [activeTab, selectedBookingsDate, refreshKey, t]);

    const filteredClasses = useMemo(
        () => {
            const now = new Date();
            return classes.filter((item) => {
                // Filter by selected date
                if (selectedClassesDate && item.rawDate !== selectedClassesDate) {
                    return false;
                }

                // Filter out classes that have already started
                if (item.startsAt) {
                    const classStartTime = new Date(item.startsAt);
                    if (classStartTime <= now) {
                        return false;
                    }
                }

                return true;
            });
        },
        [classes, selectedClassesDate],
    );

    const filteredBookings = useMemo(
        () =>
            bookings.filter((item) => !selectedBookingsDate || item.rawDate === selectedBookingsDate),
        [bookings, selectedBookingsDate],
    );

    const visibleClasses = filteredClasses.slice(0, visibleClassesCount);
    const visibleBookings = filteredBookings.slice(0, visibleBookingsCount);

    return (
        <ThemedView lightColor='#FFFFFF' darkColor='#050816' style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 24,
                        paddingBottom: 80,
                    }}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}>
                    <View className='items-center mb-6'>
                        <Image
                            source={require('@/assets/images/Frame.png')}
                            style={{ width: 150, height: 50, resizeMode: 'contain' }}
                        />
                    </View>

                    {activeTab === 'classes' && (
                        <>
                            <View className='mb-2'>
                                <ThemedText
                                    lightColor='#111827'
                                    darkColor='#ffffff'
                                    className='font-heading'
                                    style={{
                                        fontFamily: 'BebasNeue-Regular',
                                        fontSize: 28,
                                        marginBottom: 8,
                                    }}>
                                    {t('schedule.calendar')}
                                </ThemedText>
                            </View>

                            <View className='mb-6'>
                                <WeekCalendar
                                    initialDate={selectedClassesDate}
                                    onDateSelect={(day) => {
                                        if (day?.dateString) {
                                            setSelectedClassesDate(day.dateString);
                                            setVisibleClassesCount(PAGE_SIZE);
                                        }
                                    }}
                                />
                            </View>
                        </>
                    )}

                    {activeTab === 'reservas' && (
                        <>
                            <View className='mb-2'>
                                <ThemedText
                                    lightColor='#111827'
                                    darkColor='#ffffff'
                                    className='font-heading'
                                    style={{
                                        fontFamily: 'BebasNeue-Regular',
                                        fontSize: 28,
                                        marginBottom: 8,
                                    }}>
                                    {t('schedule.calendar')}
                                </ThemedText>
                            </View>

                            <View className='mb-6'>
                                <MonthCalendar
                                    initialDate={selectedBookingsDate}
                                    onDateSelect={(day) => {
                                        if (day?.dateString) {
                                            setSelectedBookingsDate(day.dateString);
                                            setVisibleBookingsCount(PAGE_SIZE);
                                        }
                                    }}
                                />
                            </View>
                        </>
                    )}

                    <View className='flex-row mb-6 border rounded-2xl border-neutral-600 bg-neutral-900/90 p-1'>
                        <Pressable
                            onPress={() => setActiveTab('classes')}
                            style={({ pressed }) => [
                                { transform: [{ scale: pressed ? 1.05 : 1 }] },
                            ]}
                            className={`flex-1 items-center py-2.5 rounded-xl ${activeTab === 'classes' ? 'bg-neutral-700' : 'bg-transparent'
                                }`}>
                            <ThemedText
                                lightColor={activeTab === 'classes' ? '#ffffff' : '#9ca3af'}
                                darkColor={activeTab === 'classes' ? '#ffffff' : '#6b7280'}
                                className='font-heading text-base font-semibold'>
                                {t('schedule.tabs.classes')}
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('reservas')}
                            style={({ pressed }) => [
                                { transform: [{ scale: pressed ? 1.05 : 1 }] },
                            ]}
                            className={`flex-1 items-center py-2.5 rounded-xl ${activeTab === 'reservas' ? 'bg-neutral-700' : 'bg-transparent'
                                }`}>
                            <ThemedText
                                lightColor={activeTab === 'reservas' ? '#ffffff' : '#9ca3af'}
                                darkColor={activeTab === 'reservas' ? '#ffffff' : '#6b7280'}
                                className='font-heading text-base font-semibold text-center'>
                                {t('schedule.tabs.reservations')}
                            </ThemedText>
                        </Pressable>
                    </View>

                    {activeTab === 'classes' && (
                        <View className='mb-6'>
                            <ThemedText
                                lightColor='#111827'
                                darkColor='#ffffff'
                                className='font-heading'
                                style={{
                                    fontFamily: 'BebasNeue-Regular',
                                    fontSize: 28,
                                    marginBottom: 8,
                                }}>
                                {t('schedule.upcomingClasses')}
                            </ThemedText>

                            <View style={{ width: '100%', maxWidth: 400 }}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => setBranchModalVisible(true)}
                                    className='flex-row items-center justify-between bg-neutral-100 rounded-xl px-4 py-2.5 border border-neutral-200'>
                                    <ThemedText
                                        className='font-body text-sm font-semibold text-neutral-800'
                                        numberOfLines={1}>
                                        {selectedBranchName || t('common.selectBranch')}
                                    </ThemedText>
                                    <Ionicons
                                        name='chevron-down'
                                        size={16}
                                        color='#4b5563'
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {activeTab === 'classes' && (
                        <View>
                            {loadingClasses && (
                                <View className='items-center py-4'>
                                    <ActivityIndicator size='small' color='#f97316' />
                                </View>
                            )}
                            {!loadingClasses && errorMessage && (
                                <ThemedText className='font-body text-center text-sm text-red-500 mb-4'>
                                    {errorMessage}
                                </ThemedText>
                            )}
                            {!loadingClasses &&
                                !errorMessage &&
                                classes.length === 0 &&
                                selectedBranchId && (
                                    <ThemedText className='font-body text-center text-sm text-neutral-500 mb-4'>
                                        {t('schedule.noClassesBranch')}
                                    </ThemedText>
                                )}
                            {!loadingClasses &&
                                !errorMessage &&
                                !selectedBranchId && (
                                    <ThemedText className='font-body text-center text-sm text-neutral-500 mb-4'>
                                        {t('common.selectBranch')}
                                    </ThemedText>
                                )}
                            {!loadingClasses &&
                                !errorMessage &&
                                classes.length > 0 &&
                                visibleClasses.length === 0 && (
                                    <ThemedText className='font-body text-center text-sm text-neutral-500 mb-4'>
                                        {selectedClassesDate
                                            ? t('schedule.noClassesForDate')
                                            : t('schedule.noClassesBranch')}
                                    </ThemedText>
                                )}
                            {visibleClasses.map((classItem, index) => (
                                <ClassCard
                                    key={classItem.classId || index.toString()}
                                    time={classItem.time}
                                    title={classItem.title}
                                    instructor={classItem.instructor}
                                    branch={classItem.branch}
                                    imageUrl={classItem.imageUrl}
                                    variant='overlay'
                                    category=""
                                    date={classItem.rawDate}
                                    reserved={isReserved(
                                        `${classItem.classId}|${classItem.serviceId}`,
                                    )}
                                    onPress={(classData) => {
                                        router.push({
                                            pathname: '/class-details',
                                            params: {
                                                ...classData,
                                                capacity: String(classItem.capacity),
                                                occupied: String(classItem.occupied),
                                                classId: classItem.classId,
                                                serviceId: classItem.serviceId,
                                                instructorId: classItem.instructorId,
                                                startsAt: classItem.startsAt,
                                                branchId: selectedBranchId,
                                            },
                                        });
                                    }}
                                />
                            ))}
                        </View>
                    )}

                    {activeTab === 'reservas' && (
                        <View className='pb-8'>
                            <ThemedText
                                lightColor='#111827'
                                darkColor='#ffffff'
                                className='font-heading'
                                style={{
                                    fontFamily: 'BebasNeue-Regular',
                                    fontSize: 28,
                                    marginBottom: 16,
                                }}>
                                {t('schedule.myBookings')}
                            </ThemedText>

                            {loadingBookings && (
                                <View className='items-center py-12'>
                                    <ActivityIndicator size='large' color='#f97316' />
                                </View>
                            )}

                            {!loadingBookings && bookingsError && (
                                <View className='items-center py-12'>
                                    <Ionicons name='alert-circle-outline' size={48} color='#ef4444' />
                                    <ThemedText className='font-body text-center text-sm text-red-500 mt-4'>
                                        {bookingsError}
                                    </ThemedText>
                                </View>
                            )}

                            {!loadingBookings && !bookingsError && visibleBookings.length === 0 && (
                                <View className='items-center py-12'>
                                    <Ionicons name='calendar-outline' size={48} color='#9ca3af' />
                                    <ThemedText className='font-body text-center text-neutral-500 mt-4'>
                                        {bookings.length === 0
                                            ? t('schedule.noBookings')
                                            : t('schedule.noClassesForDate')}
                                    </ThemedText>
                                </View>
                            )}

                            {!loadingBookings &&
                                !bookingsError &&
                                visibleBookings.map((booking) => (
                                    <ClassCard
                                        key={booking.bookingId}
                                        time={booking.time}
                                        title={booking.title}
                                        instructor={booking.instructor}
                                        branch={booking.branch}
                                        imageUrl={booking.imageUrl}
                                        variant='overlay'
                                        category=""
                                        date={booking.rawDate}
                                        reserved
                                        onPress={(classData) => {
                                            router.push({
                                                pathname: '/class-details',
                                                params: {
                                                    ...classData,
                                                    capacity: String(booking.capacity),
                                                    occupied: String(booking.occupied),
                                                    classId: booking.classId,
                                                    serviceId: booking.serviceId,
                                                    instructorId: booking.instructorId,
                                                    bookingId: booking.bookingId,
                                                    startsAt: booking.startsAt,
                                                    branchId: selectedBranchId,
                                                },
                                            });
                                        }}
                                    />
                                ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            <BranchSelectionModal
                visible={branchModalVisible}
                selectedBranchId={selectedBranchId}
                onSelect={(branchId, branchName) => {
                    setSelectedBranchId(branchId);
                    setSelectedBranchName(branchName);
                }}
                onClose={() => setBranchModalVisible(false)}
            />
        </ThemedView>
    );
}
