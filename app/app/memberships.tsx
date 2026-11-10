
import MembershipPlanCard from '@/components/auth/dashboard/MembershipPlanCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PublicMembershipResponse {
	membership_type_id: string;
	name: string;
	description: string;
	duration_days: number;
	price: number;
	base_currency: string;
	ref_price: string;
	ref_currency: string;
	is_active: boolean;
}

export default function MembershipsScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [plans, setPlans] = useState<PublicMembershipResponse[]>([]);
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

	const selectedPlan = plans.find((plan) => plan.membership_type_id === selectedPlanId);

	// Helper function to get translated membership name
	const getMembershipName = (plan: PublicMembershipResponse): string => {
		// Normalize the name by trimming and converting to uppercase for consistent lookup
		const normalizedName = plan.name.trim().toUpperCase();
		const translationKey = `memberships.plans.${normalizedName}.name`;
		const translated = t(translationKey);

		// If translation exists and is different from the key, use it
		return translated !== translationKey ? translated : plan.name;
	};

	// Helper function to get translated membership description
	const getMembershipDescription = (plan: PublicMembershipResponse): string => {
		// Normalize the name by trimming and converting to uppercase for consistent lookup
		const normalizedName = plan.name.trim().toUpperCase();
		const translationKey = `memberships.plans.${normalizedName}.description`;
		const translated = t(translationKey);

		// If translation exists and is different from the key, use it
		return translated !== translationKey ? translated : plan.description;
	};

	useEffect(() => {
		const fetchMemberships = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				const jwt = token || '';

				const response = await vitalFitApi.membership.publicGetMemberships(
					jwt,
					{ page: 1, limit: 100, sort: 'asc' as const },
					'USD',
				);

				const fetchedPlans = response.data || [];
				setPlans(fetchedPlans);

				if (fetchedPlans.length > 0) {
					setSelectedPlanId(fetchedPlans[0].membership_type_id);
				}
			} catch (error) {
				console.error('Error al obtener membresías:', error);
				Alert.alert('Error', t('memberships.error.loadPlans'));
			} finally {
				setLoading(false);
			}
		};

		fetchMemberships();
	}, [t]);

	return (
		<ImageBackground source={require('@/assets/images/chicafit.png')} className="flex-1" style={{ flex: 1 }} resizeMode="cover">
			<SafeAreaView className="flex-1 bg-transparent">
				<View className='flex-1'>
					<ScrollView className='flex-1'>
						<View className='flex-1'>
							<View className='h-72 w-full justify-end'>
								<View className='px-6 pb-6'>
									<View className='items-center'>
										<ThemedText
											lightColor="#f97316"
											darkColor="#f97316"
											className="font-heading mb-1 text-center tracking-[0.25em]"
											style={{
												fontFamily: 'BebasNeue-Regular',
												fontSize: 28,
												textShadowColor: '#000',
												textShadowRadius: 5,
												textShadowOffset: { width: 1, height: 1 },
												paddingVertical: 4,
												paddingHorizontal: 6,
												overflow: 'visible',
											}}
										>
											{t('memberships.titlePrefix')}
										</ThemedText>

										<ThemedText
											lightColor='#f97316'
											darkColor='#f97316'
											className='font-heading mb-3 text-center text-6xl'
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
											{t('memberships.titleSuffix')}
										</ThemedText>
										<ThemedText
											lightColor="#f97316"
											darkColor="#e5e7eb"
											className="font-body px-2 text-center text-sm"
											style={{
												fontFamily: 'Montserrat_400Regular',
												fontSize: 18,
												textShadowColor: '#000',
												textShadowRadius: 5,
												textShadowOffset: { width: 1, height: 1 },
												paddingVertical: 4,
												paddingHorizontal: 6,
												overflow: 'visible',
											}}
										>
											{t('memberships.subtitle')}
										</ThemedText>
									</View>
								</View>
							</View>

							<View className='px-6 pb-24 pt-6'>
								{loading ? (
									<View className='items-center justify-center py-10'>
										<ActivityIndicator size='large' color='#f97316' />
									</View>
								) : (
									<>
										{plans.map((plan) => (
											<MembershipPlanCard
												key={plan.membership_type_id}
												title={getMembershipName(plan)}
												price={plan.price.toString()}
												features={[getMembershipDescription(plan)]}
												period={t('memberships.periodDays', { days: plan.duration_days })}
												isFree={plan.price === 0}
												badgeLabel={plan.price === 0 ? t('memberships.free') : undefined}
												isSelected={
													selectedPlanId === plan.membership_type_id
												}
												onPress={() =>
													setSelectedPlanId(plan.membership_type_id)
												}
											/>
										))}

										<View className='mt-4'>
											<PrimaryButton
												title={
													selectedPlan
														? t('memberships.acquirePlan', { name: getMembershipName(selectedPlan) })
														: t('memberships.acquire')
												}
												onPress={() => {
													if (!selectedPlan) return;
													const translatedName = getMembershipName(selectedPlan);
													const translatedPeriod = t('memberships.periodDays', { days: selectedPlan.duration_days });
													const href =
														`/membership-checkout` +
														`?id=${selectedPlan.membership_type_id}` +
														`&title=${encodeURIComponent(translatedName)}` +
														`&price=${selectedPlan.price}` +
														`&period=${encodeURIComponent(translatedPeriod)}`;
													router.push(href as never);
												}}
											/>
										</View>
									</>
								)}
							</View>
						</View>
					</ScrollView>
				</View>
			</SafeAreaView>
		</ImageBackground>
	);
}