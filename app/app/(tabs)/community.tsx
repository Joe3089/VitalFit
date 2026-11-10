import ChallengeGrid from '@/components/auth/community/ChallengeGrid';
import WeeklyChallengeBanner from '@/components/auth/dashboard/WeeklyChallengeBanner';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComunidadScreen() {
	const { t } = useTranslation();
	return (
		<ThemedView style={{ flex: 1, backgroundColor: '#ffffff' }}>
			<SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 24,
						paddingBottom: 120,
					}}>
					<View className='items-center mb-6'>
						<Image
							source={require('@/assets/images/Frame.png')}
							style={{ width: 150, height: 50, resizeMode: 'contain' }}
						/>
					</View>

					<View className='mb-6'>
						<WeeklyChallengeBanner
							onPress={() => console.log('Abrir challenge:', 'plank-challenge')}
						/>
					</View>

					<ChallengeGrid
						onPlankPress={() => console.log('Abrir challenge: plank')}
						onSprintPress={() => console.log('Abrir challenge: sprint')}
						onSquatPress={() => console.log('Abrir challenge: squat')}
					/>

					<View className='mt-6'>
						<Text
							className='font-heading'
							style={{
								color: '#111827',
								fontWeight: '800',
								fontSize: 18,
								letterSpacing: 0.5,
								textTransform: 'uppercase',
							}}>
							{t('community.joinChallenges')}
						</Text>
					</View>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}
