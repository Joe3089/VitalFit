import { Logo } from '@/components/auth/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MembershipEntryScreen() {
	const { t } = useTranslation();
	const router = useRouter();

	useFocusEffect(
		React.useCallback(() => {
			const onBackPress = () => {
				router.replace('/(tabs)/dashboard');
				return true;
			};

			const subscription = BackHandler.addEventListener(
				'hardwareBackPress',
				onBackPress
			);

			return () => subscription.remove();
		}, [router])
	);

	return (
		<SafeAreaView className='flex-1 bg-white'>
			<ThemedView
				lightColor='#ffffff'
				darkColor='#050816'
				className='flex-1 px-6 pt-4 pb-4'>
				<ScrollView showsVerticalScrollIndicator={false}>
					<View className='items-center mb-4'>
						<View style={{ transform: [{ scale: 1.15 }] }}>
							<Logo />
						</View>
						<ThemedText
							lightColor='#f97316'
							darkColor='#f97316'
							className='font-heading text-lg tracking-[0.18em] mt-1'
							style={{ fontFamily: 'BebasNeue-Regular' }}>
							{t('membershipEntry.title')}
						</ThemedText>
					</View>

					<View className='gap-5'>
						<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => {
									router.push('/memberships');
								}}>
							<LinearGradient
								colors={['#4F3521', '#F27F2A']}
								locations={[0.2, 0.9]}
								start={{ x: 0.5, y: 0 }}
								end={{ x: 0.5, y: 1 }}
								style={{ borderRadius: 24, paddingHorizontal: 20, paddingVertical: 16 }}>
								<View className='flex-row items-center mb-3'>
									<View
										className='w-8 h-8 rounded-full items-center justify-center mr-3'
										style={{ backgroundColor: 'rgba(0,0,0,0.12)' }}>
										<Dumbbell size={18} color='#ffffff' />
									</View>
									<View className='flex-1'>
										<ThemedText
											lightColor='#ffffff'
											darkColor='#ffffff'
											className='font-heading text-[13px] font-semibold'
											style={{ fontFamily: 'BebasNeue-Regular' }}>
											{t('membershipEntry.buyMembership')}
										</ThemedText>
										<ThemedText
											lightColor='#ffffff'
											darkColor='#ffffff'
											className='font-body text-[10px] opacity-95'
											style={{ fontFamily: 'Montserrat_400Regular' }}>
											{t('membershipEntry.membershipDesc')}
										</ThemedText>
									</View>
								</View>
								<View className='ml-1'>
									<ThemedText
										lightColor='#ffffff'
										darkColor='#ffffff'
										className='font-body text-[9px] mb-1'
										style={{ fontFamily: 'Montserrat_400Regular' }}>
										• {t('membershipEntry.membershipBullets.access')}
									</ThemedText>
									<ThemedText
										lightColor='#ffffff'
										darkColor='#ffffff'
										className='font-body text-[9px] mb-1'
										style={{ fontFamily: 'Montserrat_400Regular' }}>
										• {t('membershipEntry.membershipBullets.benefits')}
									</ThemedText>
									<ThemedText
										lightColor='#ffffff'
										darkColor='#ffffff'
										className='font-body text-[9px]'
										style={{ fontFamily: 'Montserrat_400Regular' }}>
										• {t('membershipEntry.membershipBullets.discounts')}
									</ThemedText>
								</View>
							</LinearGradient>
						</TouchableOpacity>

						<TouchableOpacity
								activeOpacity={0.9}
								onPress={() => {
									router.push({
										pathname: '/services',
										params: {
											id: 'free-trial',
											title: 'Free Trial',
											price: '0',
										},
									} as never);
								}}>
							<LinearGradient
								colors={['#4F3521', '#F27F2A']}
								locations={[0.2, 0.9]}
								start={{ x: 0.5, y: 0 }}
								end={{ x: 0.5, y: 1 }}
								style={{ borderRadius: 24, paddingHorizontal: 20, paddingVertical: 16 }}>
								<View className='flex-row items-center mb-3'>
									<View
										className='w-8 h-8 rounded-full items-center justify-center mr-3'
										style={{ backgroundColor: 'rgba(0,0,0,0.12)' }}>
										<Dumbbell size={18} color='#ffffff' />
									</View>
									<View className='flex-1'>
										<ThemedText
											lightColor='#ffffff'
											darkColor='#ffffff'
											className='font-heading text-[13px] font-semibold'
											style={{ fontFamily: 'BebasNeue-Regular' }}>
											{t('membershipEntry.buyService')}
										</ThemedText>
										<ThemedText
											lightColor='#ffffff'
											darkColor='#ffffff'
											className='font-body text-[10px] opacity-95'
											style={{ fontFamily: 'Montserrat_400Regular' }}>
											{t('membershipEntry.serviceDesc')}
										</ThemedText>
									</View>
								</View>
								<View className='ml-1'>
									<ThemedText
										lightColor='#ffffff'
										darkColor='#ffffff'
										className='font-body text-[9px] mb-1'
										style={{ fontFamily: 'Montserrat_400Regular' }}>
										• {t('membershipEntry.serviceBullets.classes')}
									</ThemedText>
									<ThemedText
										lightColor='#ffffff'
										darkColor='#ffffff'
										className='font-body text-[9px] mb-1'
										style={{ fontFamily: 'Montserrat_400Regular' }}>
										• {t('membershipEntry.serviceBullets.personalTraining')}
									</ThemedText>
									<ThemedText
										lightColor='#ffffff'
										darkColor='#ffffff'
										className='font-body text-[9px]'
										style={{ fontFamily: 'Montserrat_400Regular' }}>
										• {t('membershipEntry.serviceBullets.individualServices')}
									</ThemedText>
								</View>
							</LinearGradient>
						</TouchableOpacity>
					</View>

					<View className='mt-10'>
						<PrimaryButton
							title={t('membershipEntry.backHome')}
							onPress={() => router.replace('/(tabs)/dashboard')}
						/>
					</View>
				</ScrollView>
			</ThemedView>
		</SafeAreaView>
	);
}
