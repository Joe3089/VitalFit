import { GymCapacityCard } from '@/components/auth/dashboard/GymCapacityCard';
import { RecepcionistStatsCardGroup } from '@/components/auth/dashboard/RecepcionistStatsCardGroup';
import { RecepcionistTodayClassCard } from '@/components/auth/dashboard/RecepcionistTodayClassCard';
import { UserHeader } from '@/components/auth/dashboard/userheader';
import { ValidateCheckInCard } from '@/components/auth/dashboard/ValidateCheckInCard';
import { FaceCheckInModal } from '@/components/recepcionist/FaceCheckInModal';
import { QRScannerModal } from '@/components/recepcionist/QRScannerModal';
import { BranchSelector } from '@/components/recepcionista/BranchSelector';
import { CheckInResultModal } from '@/components/recepcionista/CheckInResultModal';
import { ThemedView } from '@/components/themed-view';
import { useBranch } from '@/contexts/BranchContext';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassScheduleItem, isAPIError } from '@vitalfit/sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

export default function DashboardRecepcionist() {
	const { t } = useTranslation();
	const { user, loading: userLoading } = useUser();
	const [scannerVisible, setScannerVisible] = useState(false);
	const [faceCheckInVisible, setFaceCheckInVisible] = useState(false);
	const { selectedBranchId } = useBranch();
	const [resultModalVisible, setResultModalVisible] = useState(false);
	const [checkInSuccess, setCheckInSuccess] = useState(false);
	const [checkInUserName, setCheckInUserName] = useState('');
	const [checkInMessage, setCheckInMessage] = useState('');
	const [upcomingClasses, setUpcomingClasses] = useState<ClassScheduleItem[]>([]);
	const [occupancy, setOccupancy] = useState(0);
	const [maxCapacity, setMaxCapacity] = useState(100);

	// Stats state
	const [checkInsTodayCount, setCheckInsTodayCount] = useState<number | null>(null);
	const [monthlyTrend, setMonthlyTrend] = useState<number | null>(null);

	const displayName = user?.lastName
		? `${user.firstName} ${user.lastName}`
		: user?.firstName || t('dashboard.recepcionistDefault');

	const handleValidateMembership = async (qrJwtLong: string) => {
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;
			if (!selectedBranchId) {
				Alert.alert(`${t('common.attention')}`, t('checkIn.error.selectBranch'));
				return;
			}
			const branchId = selectedBranchId;

			console.log('Enviando Check-In...', {
				qrJwtLong: qrJwtLong.substring(0, 20) + '...',
				branchId,
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const response = await (vitalFitApi as any).access.checkIn(token, {
				qr_jwt: qrJwtLong,
				branch_id: branchId,
			});

			const data = response.data || response;

			console.log('[Check-In] Respuesta completa:', JSON.stringify(data, null, 2));

			let userName = t('dashboard.defaultUser');

			// If we have user_id in response, fetch full user details
			if (data?.user_id) {
				try {
					const userResponse = await vitalFitApi.user.GetUserByID(
						data.user_id,
						token || '',
					);
					const userData = userResponse.data;

					if (userData?.first_name) {
						userName = `${userData.first_name} ${userData.last_name || ''}`.trim();
					}
					console.log('[Dashboard] User details fetched:', userName);
				} catch (error) {
					console.error('[Dashboard] Error fetching user details:', error);
					// Fallback to data from response
					if (data?.user?.first_name) {
						userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
					}
				}
			} else if (data?.user?.first_name) {
				userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
			} else if (data?.first_name) {
				userName = `${data.first_name} ${data.last_name || ''}`.trim();
			} else if (data?.name) {
				userName = data.name;
			}

			setCheckInSuccess(true);
			setCheckInUserName(userName);
			// Show only the message, not the service name
			setCheckInMessage(data.message || t('checkIn.successMessage'));
			setResultModalVisible(true);
			setScannerVisible(false);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error('Error en Check-In:', error);

			let errorMessage = t('checkIn.error.default');

			if (isAPIError(error)) {
				if (error.status === 402) {
					errorMessage = t('checkIn.error.paymentPending');
				} else if (error.status === 403) {
					errorMessage = t('checkIn.error.accessDenied');
				} else if (error.status === 401) {
					errorMessage = t('checkIn.error.qrExpired');
				} else {
					errorMessage = error.message || t('checkIn.error.default');
				}
			} else {
				errorMessage = error.message || t('common.error.connection');
			}

			setCheckInSuccess(false);
			setCheckInMessage(errorMessage);
			setResultModalVisible(true);
		}
	};

	const handleFaceCheckInPress = () => {
		if (!selectedBranchId) {
			Alert.alert(`${t('common.attention')}`, t('checkIn.error.selectBranch'));
			return;
		}
		setFaceCheckInVisible(true);
	};

	const handleFaceCheckInSuccess = (userName: string, serviceName: string) => {
		setCheckInSuccess(true);
		setCheckInUserName(userName);
		setCheckInMessage(serviceName);
		setFaceCheckInVisible(false);
		setResultModalVisible(true);
	};

	const handleFaceCheckInError = (errorMessage: string) => {
		setCheckInSuccess(false);
		setCheckInMessage(errorMessage);
		setFaceCheckInVisible(false);
		setResultModalVisible(true);
	};

	const handleEmailCheckIn = async (userId: string, userName: string) => {
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;
			if (!selectedBranchId) {
				Alert.alert(`${t('common.attention')}`, t('checkIn.error.selectBranch'));
				return;
			}

			console.log('[Dashboard] Processing email check-in...', {
				userId,
				branchId: selectedBranchId,
			});

			// Use checkInManual for email-based check-ins (not QR code)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const response = await (vitalFitApi as any).access.checkInManual(token, {
				user_id: userId,
				branch_id: selectedBranchId,
			});

			const data = response.data || response;

			console.log('[Email Check-In] Response:', JSON.stringify(data, null, 2));

			setCheckInSuccess(true);
			setCheckInUserName(userName);
			setCheckInMessage(data.service_name || t('checkIn.success.default'));
			setResultModalVisible(true);

			// Refresh stats after successful check-in
			const todayRes = await vitalFitApi.report.todayCheckIns(token, selectedBranchId);
			if (todayRes && typeof todayRes.data === 'number') {
				setCheckInsTodayCount(todayRes.data);
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error('Error in email check-in:', error);

			let errorMessage = t('checkIn.error.default');

			if (isAPIError(error)) {
				if (error.status === 402) {
					errorMessage = t('checkIn.error.paymentPending');
				} else if (error.status === 403) {
					errorMessage = t('checkIn.error.accessDenied');
				} else if (error.status === 401) {
					errorMessage = t('checkIn.error.unauthorized');
				} else {
					errorMessage = error.message || t('checkIn.error.default');
				}
			} else {
				errorMessage = error.message || t('common.error.connection');
			}

			setCheckInSuccess(false);
			setCheckInMessage(errorMessage);
			setResultModalVisible(true);
		}
	};

	useEffect(() => {
		const fetchUpcomingClasses = async () => {
			if (!selectedBranchId) return;
			setUpcomingClasses([]); // Reset state
			try {
				const token = await AsyncStorage.getItem('token');
				if (!token) return;

				const res = await vitalFitApi.report.upcomingClassesToday(token, selectedBranchId);
				if (res && res.data) {
					setUpcomingClasses(res.data);
				}
			} catch (error) {
				console.error('Error fetching upcoming classes:', error);
				setUpcomingClasses([]);
			}
		};

		fetchUpcomingClasses();
	}, [selectedBranchId]);

	const fetchStats = useCallback(async () => {
		if (!selectedBranchId) return;
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;

			// 1. Fetch 'Check-ins Today' (Daily Check-ins)
			console.log(`[Dashboard] Fetching stats for branch: ${selectedBranchId}`);
			const checkInsRes = await vitalFitApi.report.todayCheckIns(token, selectedBranchId);
			console.log('[Dashboard] Check-ins response:', JSON.stringify(checkInsRes, null, 2));

			if (checkInsRes && typeof checkInsRes.data === 'number') {
				setCheckInsTodayCount(checkInsRes.data);
			}

			// 2. Fetch 'Occupancy KPI' (Monthly Occupancy)
			const occupancyKpiRes = await vitalFitApi.report.occupancyKPI(token, selectedBranchId);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const kpiData = (occupancyKpiRes as any).data || occupancyKpiRes;

			if (
				kpiData &&
				(typeof kpiData.trend_percent === 'number' ||
					typeof kpiData.trend_percent === 'string')
			) {
				const val =
					typeof kpiData.trend_percent === 'string'
						? parseFloat(kpiData.trend_percent)
						: kpiData.trend_percent;
				if (!isNaN(val)) {
					setMonthlyTrend(Math.round(val));
				}
			}
		} catch (error) {
			console.error('Error fetching stats:', error);
		}
	}, [selectedBranchId]);

	const fetchCapacity = useCallback(async () => {
		if (!selectedBranchId) return;
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;

			// 1. Get Occupancy
			const occupancyRes = await vitalFitApi.report.currentOccupancy(token, selectedBranchId);
			if (occupancyRes && typeof occupancyRes.data === 'number') {
				setOccupancy(occupancyRes.data);
			}

			// 2. Get Branch Details (Max Capacity)
			const branchRes = await vitalFitApi.branch.getBranchById(selectedBranchId, token);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const branchData = (branchRes as any).data || branchRes;

			if (branchData && typeof branchData.max_capacity === 'number') {
				setMaxCapacity(branchData.max_capacity);
			}
		} catch (error) {
			console.error('Error fetching gym capacity:', error);
		}
	}, [selectedBranchId]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchCapacity();
	}, [fetchCapacity]);

	if (userLoading && !user) {
		return (
			<ThemedView className='flex-1 items-center justify-center bg-white dark:bg-neutral-950'>
				<ActivityIndicator size='large' color='#F27F2A' />
			</ThemedView>
		);
	}

	return (
		<ThemedView className='flex-1 bg-white px-4 pt-10 dark:bg-neutral-950'>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 150 }}>
				<UserHeader name={displayName} avatarUrl={user?.profilePicture || undefined} />

				<View
					style={{
						alignItems: 'center',
						paddingHorizontal: 20,
						marginBottom: 10,
						marginTop: -15,
					}}>
					<BranchSelector />
				</View>

				<RecepcionistStatsCardGroup
					checkInsTodayCount={checkInsTodayCount}
					classesTodayCount={upcomingClasses ? upcomingClasses.length : 0}
					monthlyTrend={monthlyTrend}
				/>
				<ValidateCheckInCard
					onScanPress={() => setScannerVisible(true)}
					onFaceScanPress={handleFaceCheckInPress}
					onEmailCheckIn={handleEmailCheckIn}
					branchId={selectedBranchId || undefined}
				/>
				<GymCapacityCard currentOccupancy={occupancy} maxCapacity={maxCapacity} />
				<RecepcionistTodayClassCard classes={upcomingClasses.slice(0, 3)} />
			</ScrollView>

			<QRScannerModal
				visible={scannerVisible}
				onClose={() => setScannerVisible(false)}
				onScan={handleValidateMembership}
			/>

			<FaceCheckInModal
				visible={faceCheckInVisible}
				onClose={() => setFaceCheckInVisible(false)}
				onSuccess={handleFaceCheckInSuccess}
				onError={handleFaceCheckInError}
				branchId={selectedBranchId}
			/>

			<CheckInResultModal
				visible={resultModalVisible}
				onClose={() => setResultModalVisible(false)}
				success={checkInSuccess}
				userName={checkInUserName}
				message={checkInMessage}
			/>
		</ThemedView>
	);
}
