import { MonthCalendar } from '@/components/auth/dashboard/monthcalendar';
import { ClassCard } from '@/components/instructor/ClassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi, { BranchClassInfo, ClassScheduleItem } from '@/services/vitalfitSdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';

type ViewMode = 'day' | 'month';

export default function InstructorClassesScreen() {
	const { t } = useTranslation();
	// const router = useRouter(); // Removed unused router
	const { token } = useAuth();
	const { user } = useUser();
	const today = new Date().toISOString().split('T')[0];

	const [viewMode, setViewMode] = useState<ViewMode>('day');
	const [selectedDate, setSelectedDate] = useState<string>(today);
	const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

	const [classesToday, setClassesToday] = useState<ClassScheduleItem[]>([]);
	const [classesMonth, setClassesMonth] = useState<BranchClassInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [displayLimit, setDisplayLimit] = useState(10);

	// Fetch Classes for Today (Day View)
	useEffect(() => {
		const fetchTodayClasses = async () => {
			if (viewMode === 'day' && token) {
				setLoading(true);
				try {
					const response = await vitalFitApi.report.instructorClassesToday(token);
					if (response?.data) {
						setClassesToday(response.data);
					}
				} catch (error) {
					console.error('Error fetching today classes:', error);
				} finally {
					setLoading(false);
				}
			}
		};

		fetchTodayClasses();
	}, [viewMode, token]);

	// Fetch Classes for Month (Month View)
	// Fetch Classes for Month (Month View)
	useEffect(() => {
		const fetchMonthClasses = async () => {
			if (viewMode === 'month' && token && user?.userId) {
				setLoading(true);
				try {
					const month = currentMonthDate.getMonth() + 1; // 1-12
					const year = currentMonthDate.getFullYear();
					const response = await vitalFitApi.schedule.GetClassesByInstructor(
						token,
						user.userId,
						month,
						year,
					);

					if (response?.data) {
						let classesData = response.data;

						// Enrich with Service Names
						const serviceIds = Array.from(
							new Set(classesData.map((c) => c.service_id).filter(Boolean)),
						);

						if (serviceIds.length > 0) {
							// Fetch service details for each unique ID
							const serviceMap: Record<string, string> = {};
							await Promise.all(
								serviceIds.map(async (id) => {
									try {
										const serviceRes =
											await vitalFitApi.products.getServiceByID(id, token);
										if (serviceRes?.data?.name) {
											serviceMap[id] = serviceRes.data.name;
										}
									} catch (err) {
										console.log(`Error fetching service ${id}:`, err);
									}
								}),
							);

							// Map names back to classes
							classesData = classesData.map((cls) => ({
								...cls,
								class_name:
									serviceMap[cls.service_id] || t('instructor.classes.class'),
								service_name: serviceMap[cls.service_id], // Fallback/redundancy
							}));
						}

						setClassesMonth(classesData);
					}
				} catch (error) {
					console.error('Error fetching month classes:', error);
				} finally {
					setLoading(false);
				}
			}
		};

		fetchMonthClasses();
	}, [viewMode, token, user?.userId, currentMonthDate, t]); // Added t dependency

	// ... (Unchanged logic) ...

	// Mark dates in calendar
	const markedDates = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const marks: Record<string, any> = {}; // Keeping any here as react-native-calendars types can be tricky, suppressing if needed but usually inferred is better. The error was for keyExtractor and item so this might be fine or needs suppression.
		// Actually error 143:31 is usually `marks: Record<string, any>`. Using `any` here is fine if allowed, but strict lint complains.
		// Better type: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string; }>
		classesMonth.forEach((cls) => {
			const date = cls.starts_at.split('T')[0];
			marks[date] = { marked: true, dotColor: '#f97316' };
		});

		marks[selectedDate] = {
			...(marks[selectedDate] || {}),
			selected: true,
			selectedColor: '#f97316',
			marked: marks[selectedDate]?.marked,
			dotColor: '#f97316',
		};
		return marks;
	}, [classesMonth, selectedDate]);

	// ...

	// Filter Month Classes by Selected Date
	const filteredMonthClasses = useMemo(() => {
		if (viewMode === 'day') return [];
		return classesMonth.filter((cls) => {
			// Extract date part from starts_at (YYYY-MM-DD)
			const datePart = cls.starts_at.split('T')[0];
			return datePart === selectedDate;
		});
	}, [classesMonth, selectedDate, viewMode]);

	// Data Source for FlatList
	const listData = useMemo(() => {
		return viewMode === 'day' ? classesToday : filteredMonthClasses;
	}, [viewMode, classesToday, filteredMonthClasses]);

	// Paginated Data (Client-side infinite scroll)
	const paginatedData = useMemo(() => {
		return listData.slice(0, displayLimit);
	}, [listData, displayLimit]);

	const loadMore = () => {
		if (paginatedData.length < listData.length) {
			setDisplayLimit((prev) => prev + 10);
		}
	};

	const handleDaySelect = (day: DateData) => {
		setSelectedDate(day.dateString);
		// Update current month if needed to trigger fetch (though usually Calendar stays in view)
		// But fetching is driven by `currentMonthDate`. MonthCalendar passing onMonthChange drives `currentMonthDate` update.
	};

	const handleMonthChange = (date: DateData) => {
		setCurrentMonthDate(new Date(date.year, date.month - 1, 1));
	};

	// Render Item
	const renderItem = ({ item }: { item: ClassScheduleItem | BranchClassInfo }) => {
		const isTodayItem = 'class_name' in item;
		const dateStr = isTodayItem
			? selectedDate
			: (item as BranchClassInfo).starts_at.split('T')[0];

		return (
			<ClassCard
				item={item}
				dateStr={dateStr}
				onPress={() => {
					// No action "por ahora no hara nada al pulsarse"
				}}
			/>
		);
	};

	return (
		<ThemedView className='flex-1 bg-white pt-10'>
			<View className='mb-4 px-4'>
				{/* Logo */}
				<View className='mb-4 items-center'>
					<Image
						source={require('@/assets/images/Frame.png')}
						style={{ width: 150, height: 50, resizeMode: 'contain' }}
					/>
				</View>

				{/* Title Strip */}
				<View className='mb-3 w-full items-center justify-center rounded-2xl bg-[#F3F4F6] py-2'>
					<ThemedText
						lightColor='#111827'
						style={{ fontFamily: 'System', fontSize: 16, fontWeight: '600' }}>
						{t('instructor.classes.title')}
					</ThemedText>
				</View>

				{/* Header */}
				<View className='mb-2'>
					<ThemedText
						lightColor='#111827'
						style={{ fontFamily: 'BebasNeue-Regular', fontSize: 24 }}>
						{t('instructor.classes.calendar')}
					</ThemedText>
				</View>

				{/* Tabs */}
				<View className='mb-4 select-none flex-row rounded-2xl bg-[#F3F4F6] p-1'>
					<TouchableOpacity
						className={`flex-1 items-center rounded-xl py-2 ${
							viewMode === 'day' ? 'bg-white' : 'bg-transparent'
						}`}
						activeOpacity={0.7}
						onPress={() => setViewMode('day')}>
						<Text
							className={`font-semibold ${
								viewMode === 'day' ? 'text-[#111827]' : 'text-[#6b7280]'
							}`}>
							{t('instructor.classes.day') || 'Día'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						className={`flex-1 items-center rounded-xl py-2 ${
							viewMode === 'month' ? 'bg-white' : 'bg-transparent'
						}`}
						activeOpacity={0.7}
						onPress={() => setViewMode('month')}>
						<Text
							className={`font-semibold ${
								viewMode === 'month' ? 'text-[#111827]' : 'text-[#6b7280]'
							}`}>
							{t('instructor.classes.month') || 'Mes'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				data={paginatedData}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				keyExtractor={(item) => (item as any).class_id || Math.random().toString()}
				renderItem={renderItem}
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
				ListHeaderComponent={
					viewMode === 'month' ? (
						<View className='mb-6'>
							<MonthCalendar
								onDateSelect={handleDaySelect}
								onMonthChange={handleMonthChange}
								markedDates={markedDates}
								initialDate={selectedDate}
							/>
							<View className='mb-2 mt-4'>
								<ThemedText
									lightColor='#111827'
									style={{ fontFamily: 'BebasNeue-Regular', fontSize: 22 }}>
									{t('instructor.classes.classesOfDay')}
								</ThemedText>
							</View>
						</View>
					) : (
						<View className='mb-2'>
							<ThemedText
								lightColor='#111827'
								style={{ fontFamily: 'BebasNeue-Regular', fontSize: 22 }}>
								{t('instructor.classes.classesOfDay')}
							</ThemedText>
						</View>
					)
				}
				ListEmptyComponent={
					loading ? (
						<ActivityIndicator size='small' color='#f97316' className='mt-10' />
					) : (
						<Text className='mt-4 text-center text-[14px] text-[#6b7280]'>
							{t('instructor.classes.noClasses')}
						</Text>
					)
				}
			/>
		</ThemedView>
	);
}
