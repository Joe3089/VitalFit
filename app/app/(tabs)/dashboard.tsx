import BirthdayOfferBanner from '@/components/auth/dashboard/BirthdayOfferBanner';
import CrossFitBanner from '@/components/auth/dashboard/CrossFitBanner';
import { MembershipCard } from '@/components/auth/dashboard/membershipcard';
import { QRModal } from '@/components/auth/dashboard/QRModal';
import { UpcomingClassesCarousel } from '@/components/auth/dashboard/upcomingclasses';
import { UpcomingRoutinesSection } from '@/components/auth/dashboard/upcomingroutines';
import { UserHeader } from '@/components/auth/dashboard/userheader';
import WeeklyChallengeBanner from '@/components/auth/dashboard/WeeklyChallengeBanner';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Text as RNText, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { user, loading: userLoading } = useUser();
	const [loading, setLoading] = useState(true);
	const [qrModalVisible, setQrModalVisible] = useState(false);
	const [userToken, setUserToken] = useState<string>('');
	const hasMembership = user?.membership?.status === 'Active';

	const calculateDaysRemaining = () => {
		if (!hasMembership || !user?.membership?.end_date) return 0;
		const end = new Date(user.membership.end_date);
		const now = new Date();
		const diff = end.getTime() - now.getTime();
		return Math.ceil(diff / (1000 * 3600 * 24));
	};

	const daysRemaining = calculateDaysRemaining();
	const planStatusText = hasMembership ? t('dashboard.member.activeMembership') : t('dashboard.member.noActivePlan');

	useEffect(() => {
		const init = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (!token) {
					console.error('No se encontró token en AsyncStorage');
					router.replace('/(auth)/login');
					return;
				}

				setUserToken(token);
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [router]);

	useFocusEffect(
		React.useCallback(() => {
			const onBackPress = () => {
				BackHandler.exitApp();
				return true;
			};

			const subscription = BackHandler.addEventListener(
				'hardwareBackPress',
				onBackPress
			);

			return () => subscription.remove();
		}, [])
	);

	const mockRoutines = [
		{
			id: '1',
			title: t('dashboard.mock.routineDay'),
			subtitle: t('dashboard.mock.routineSubtitle'),
			duration: t('dashboard.mock.routineDuration'),
			image: require('@/assets/images/rutina.png'),
		},
	];

	if (loading || userLoading) {
		return (
			<ThemedView className='flex-1 justify-center items-center bg-white dark:bg-neutral-950'>
				<ActivityIndicator size='large' color='#F27F2A' />
			</ThemedView>
		);
	}

	const displayName = user
		? user.lastName
			? `${user.firstName || t('dashboard.defaultUser')} ${user.lastName}`
			: user.firstName || t('dashboard.defaultUser')
		: t('dashboard.defaultUser');

	return (
		<ThemedView className='flex-1 bg-white dark:bg-neutral-950'>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingTop: Math.max(insets.top, 40),
					paddingBottom: Math.max(insets.bottom + 80, 120),
				}}>
				<UserHeader
					name={displayName}
					avatarUrl={user?.profilePicture}
					role={user?.roleName}
					onBadgesPress={() => router.replace('/badges')}
					onNotificationPress={() => router.replace('/notifications')}
					hasUnreadNotifications={false}
				/>

				<MembershipCard
					hasMembership={hasMembership}
					daysRemaining={daysRemaining}
					membershipStatus={planStatusText}
					onQRPress={() => setQrModalVisible(true)}
					onGetMembershipPress={() => router.replace('/membership-entry')}
				/>

				{hasMembership && <UpcomingClassesCarousel />}

				<UpcomingRoutinesSection
					mode={hasMembership ? 'member' : 'guest'}
					routines={mockRoutines}
					onPrimaryActionPress={(id) =>
						hasMembership
							? router.replace(`/routine/details?id=${id}`)
							: router.replace('/membership-entry')
					}
				/>

				{hasMembership ? (
					<View className='gap-3'>
						<BirthdayOfferBanner />

						<WeeklyChallengeBanner
							onPress={() => router.replace('/training')}
						/>

						<BirthdayOfferBanner />

						<CrossFitBanner
							imageSource={require('@/assets/images/crossfit.png')}
							title='CrossFit'
							onPress={() => console.log('Abrir challenge:', 'crossfit')}
						/>
					</View>
				) : (
					<>
						<BirthdayOfferBanner />

						<RNText className='font-heading' style={{ color: '#111827', fontWeight: '700', fontSize: 18, marginTop: 16, marginBottom: 8 }}>
							{t('dashboard.member.packages')}
						</RNText>
						<View className='gap-3 mb-4'>
							<CrossFitBanner
								imageSource={require('@/assets/images/rutina.png')}
								title={t('dashboard.banners.crossfit4')}
								onPress={() => router.replace('/membership-entry')}
							/>
							<CrossFitBanner
								imageSource={require('@/assets/images/rutin.png')}
								title={t('dashboard.banners.crossfit4')}
								onPress={() => router.replace('/membership-entry')}
							/>
						</View>
						<View className='gap-3'>
							<WeeklyChallengeBanner
								onPress={() => console.log('Abrir challenge:', 'plank-challenge')}
							/>
						</View>
					</>
				)}
			</ScrollView>

			<QRModal
				visible={qrModalVisible}
				onClose={() => setQrModalVisible(false)}
				token={userToken}
				userName={displayName}
			/>
		</ThemedView>
	);
}