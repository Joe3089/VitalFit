import { InstructorStatsCardGroup } from '@/components/auth/dashboard/InstructorStatsCardGroup';
import { InstructorTabs } from '@/components/auth/dashboard/InstructorTabs';
import { MyClientsCardGroup } from '@/components/auth/dashboard/MyClientsCardGroup';
import { UserHeader } from '@/components/auth/dashboard/userheader';
import { ClassCard } from '@/components/instructor/ClassCard';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi from '@/services';
import { AssignedClientResponse, ClassScheduleItem, KPICard } from '@/services/vitalfitSdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, ScrollView, Text, View } from 'react-native';
import { CalendarDaysIcon } from 'react-native-heroicons/mini';
import {
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    UserIcon,
} from 'react-native-heroicons/outline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'clientes' | 'clases' | 'mensajes';

export default function DashboardInstructor() {
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const { user, loading: userLoading } = useUser();
	const [activeTab, setActiveTab] = useState<TabType>('clientes');

	// Report Data States
	const [monthlyClasses, setMonthlyClasses] = useState<KPICard | null>(null);
	const [studentCount, setStudentCount] = useState<KPICard | null>(null);
	const [attendanceRate, setAttendanceRate] = useState<number>(0);
	const [todaysClasses, setTodaysClasses] = useState<ClassScheduleItem[]>([]);
	const [nextClassTime, setNextClassTime] = useState<string | null>(null);
	const [assignedClients, setAssignedClients] = useState<AssignedClientResponse[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (!token || !user?.userId) {
					console.error('No se encontró token en AsyncStorage o ID de usuario');
					return;
				}

				// Fetch Reports using singular 'report' based on SDK inspection
				const reportApi = vitalFitApi.report;

				if (reportApi) {
					 
					const [
						monthlyCount,
						studentsTodayRes,
						classesToday,
						nextClass,
						assignedClientsRes,
						attendanceRateRes,
					] = await Promise.all([
						reportApi.instructorMonthlyClassesCount(token).catch((e: unknown) => {
							console.log('Error fetching monthly count:', e);
							return null;
						}),
						// Use new endpoint for Students Today
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(reportApi as any).instructorStudentsToday(token).catch((e: unknown) => {
							console.log('Error fetching student count:', e);
							return null;
						}),
						reportApi.instructorClassesToday(token).catch((e: unknown) => {
							console.log('Error fetching today classes:', e);
							return null;
						}),
						reportApi.instructorNextClass(token).catch((e: unknown) => {
							console.log('Error fetching next class:', e);
							return null;
						}),
						// Fetch first 10 clients for dashboard
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(vitalFitApi.instructor as any)
							.getAssignedClients(token, user.userId, {
								page: 1,
								limit: 10,
								sort: 'desc',
							})
							.catch((e: unknown) => {
								console.log('Error fetching assigned clients:', e);
								return null;
							}),
						// Use new endpoint for Attendance Rate
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(reportApi as any).instructorAttendanceRate(token).catch((e: unknown) => {
							console.log('Error fetching attendance rate:', e);
							return null;
						}),
					]);

					setMonthlyClasses(monthlyCount && monthlyCount.data ? monthlyCount.data : null);
					// Adapt number response to KPICard format for compatibility or store as number
					// The component expects KPICard, so we wrap it
					setStudentCount(
						studentsTodayRes && studentsTodayRes.data !== undefined
							? {
									value: studentsTodayRes.data,
									title: 'Alumnos hoy',
									trend_percent: 0,
									trend_label: '',
									is_positive: true,
								}
							: null,
					);

					setTodaysClasses(classesToday && classesToday.data ? classesToday.data : []);
					setNextClassTime(nextClass && nextClass.data ? nextClass.data : null);

					if (assignedClientsRes?.data) {
						setAssignedClients(assignedClientsRes.data);
					}

					// Set attendance rate from API, overriding the local calculation
					if (attendanceRateRes && attendanceRateRes.data !== undefined) {
						setAttendanceRate(attendanceRateRes.data);
					}
				} else {
					console.error('vitalFitApi.report is undefined');
				}
			} catch (error: unknown) {
				let errorMessage = t('instructor.dashboard.error.fetchUser');
				if (isAPIError(error)) {
					errorMessage = error.messages.join(', ');
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}
				console.error('Error en la solicitud (Instructor):', errorMessage);
			}
		};

		fetchData();
	}, [t, user?.userId]); // Added user.userId dependency

	useFocusEffect(
		useCallback(() => {
			const onBackPress = () => {
				BackHandler.exitApp();
				return true;
			};

			const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

			return () => subscription.remove();
		}, []),
	);

	if (userLoading) {
		return (
			<ThemedView className='flex-1 items-center justify-center bg-white'>
				<ActivityIndicator size='large' color='#F27F2A' />
			</ThemedView>
		);
	}

	const displayName = user?.lastName
		? `${user.firstName} ${user.lastName}`
		: user?.firstName || t('instructor.dashboard.defaultName');
	const avatarUrl = user?.profilePicture;

	const messages = [
		{
			id: '1',
			name: 'Carlos Pérez',
			snippet: t('instructor.dashboard.mockMessages.adjustPlan'),
			time: '30 min',
		},
		{
			id: '2',
			name: 'Carlos Pérez',
			snippet: t('instructor.dashboard.mockMessages.changeSchedule'),
			time: '1 h',
		},
		{
			id: '3',
			name: 'María López',
			snippet: t('instructor.dashboard.mockMessages.addDay'),
			time: '2 h',
		},
		{
			id: '4',
			name: 'Juan Pérez',
			snippet: t('instructor.dashboard.mockMessages.cantAttend'),
			time: '3 h',
		},
		{
			id: '5',
			name: 'Ana García',
			snippet: t('instructor.dashboard.mockMessages.reviewTechnique'),
			time: t('instructor.dashboard.mockMessages.yesterday'),
		},
	];

	// Determine upcoming class for display
	const upcomingClass = todaysClasses.length > 0 ? todaysClasses[0] : null;

	return (
		<ThemedView className='flex-1 bg-white px-2 pt-10'>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 80, 96) }}>
				<UserHeader name={displayName} avatarUrl={avatarUrl} />

				<InstructorStatsCardGroup
					monthlyClasses={monthlyClasses}
					studentCount={studentCount}
					attendanceRate={attendanceRate}
				/>

				<View className='mt-6 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm'>
					<View className='mb-3 flex-row items-center'>
						<CalendarDaysIcon width={18} height={18} color='#f97316' />
						<Text className='ml-2 text-[14px] font-medium text-[#111827]'>
							{t('instructor.dashboard.nextClass')}
						</Text>
					</View>

					{upcomingClass ? (
						<ClassCard
							item={upcomingClass}
							dateStr={new Date().toLocaleDateString()}
							showDate={true}
						/>
					) : (
						<View className='py-4'>
							<Text className='text-center text-gray-500'>
								{nextClassTime === 'Sin pendientes'
									? t('instructor.dashboard.noClassesPending')
									: t('instructor.dashboard.upcomingClass')}
							</Text>
						</View>
					)}
				</View>

				<InstructorTabs activeTab={activeTab} onChange={setActiveTab} />

				{activeTab === 'clientes' && <MyClientsCardGroup clients={assignedClients} />}
				{activeTab === 'clases' && (
					<View className='mt-6 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm'>
						<View className='mb-3 flex-row items-center'>
							<CalendarDaysIcon width={18} height={18} color='#f97316' />
							<Text className='ml-2 text-[14px] font-medium text-[#111827]'>
								{t('instructor.dashboard.todayClasses')}
							</Text>
						</View>

						{todaysClasses.length === 0 ? (
							<Text className='py-4 text-center text-gray-500'>
								{t('instructor.dashboard.noClassesToday')}
							</Text>
						) : (
							todaysClasses.map((cls, index) => (
								<ClassCard
									key={index}
									item={cls}
									dateStr={new Date().toLocaleDateString()}
									showDate={true}
									onPress={() => {
										// No navigation specified for dashboard list items yet, assuming none or same as classes view
									}}
								/>
							))
						)}
					</View>
				)}
				{activeTab === 'mensajes' && (
					<View className='mt-6 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm'>
						<View className='mb-3 flex-row items-center'>
							<ChatBubbleLeftRightIcon width={18} height={18} color='#f97316' />
							<Text className='ml-2 text-[14px] font-medium text-[#111827]'>
								{t('instructor.dashboard.clientMessages')}
							</Text>
						</View>

						{messages.map((msg) => (
							<View
								key={msg.id}
								className='mb-3 flex-row items-center justify-between rounded-2xl bg-[#F8F9FB] px-4 py-3'>
								<View className='flex-1 flex-row items-center'>
									<View className='mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#FED7AA]'>
										<UserIcon size={22} color='#f97316' />
									</View>
									<View className='flex-1'>
										<Text className='text-[14px] font-bold text-[#1F2024]'>
											{msg.name}
										</Text>
										<Text
											className='text-[12px] text-[#71727A]'
											numberOfLines={1}
											ellipsizeMode='tail'>
											{msg.snippet}
										</Text>
									</View>
								</View>
								<View className='items-end'>
									<Text className='mb-1 text-[12px] text-[#71727A]'>
										{msg.time}
									</Text>
									<ChevronRightIcon size={12} color='#71727A' />
								</View>
							</View>
						))}
					</View>
				)}
			</ScrollView>
		</ThemedView>
	);
}
