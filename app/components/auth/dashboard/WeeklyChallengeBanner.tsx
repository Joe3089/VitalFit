import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export type WeeklyChallengeBannerProps = { onPress?: () => void };

export default function WeeklyChallengeBanner({ onPress }: WeeklyChallengeBannerProps) {
	const { t } = useTranslation();

	return (
		<View className='h-48 w-full rounded-2xl overflow-hidden flex-row bg-neutral-800'>
			<View className='w-1/2 justify-center px-5'>
				<Text className='font-heading text-orange-500 font-bold text-3xl leading-9 mb-0'>
					{t('dashboard.banners.weeklyChallenge')}
				</Text>
				<Text className='font-body text-white font-semibold text-lg mb-0'>{t('dashboard.banners.plankWithHipTwist')}</Text>
				<TouchableOpacity
					className='bg-orange-500 rounded-lg px-5 py-2.5 self-start'
					onPress={onPress}
					activeOpacity={0.8}>
					<Text className='font-body text-white font-bold text-sm'>{t('common.viewMore')}</Text>
				</TouchableOpacity>
			</View>

			<View className='w-1/2 flex-1'>
				<Image
					source={require('@/assets/images/woman4.png')}
					style={{ width: '100%', height: '100%' }}
					resizeMode='cover'
				/>
			</View>
		</View>
	);
}
