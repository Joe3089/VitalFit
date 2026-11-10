import React from 'react';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

export type CrossFitBannerProps = {
	imageSource: ImageSourcePropType;
	title: string;
	onPress?: () => void;
	ctaLabel?: string;
};

export default function CrossFitBanner({ imageSource, title, onPress, ctaLabel = 'Ver más' }: CrossFitBannerProps) {
	return (
		<View className='h-48 w-full rounded-2xl overflow-hidden'>
			<Image
				source={imageSource}
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					width: '100%',
					height: '100%',
				}}
				resizeMode='cover'
			/>
			<View className='absolute inset-0 bg-black/40' />
			<View className='flex-1 justify-end p-5'>
				<Text className='font-heading text-white font-bold text-3xl mb-4'>{title}</Text>
				<TouchableOpacity
					className='bg-orange-500 rounded-lg px-5 py-2.5 self-start'
					onPress={onPress}
					activeOpacity={0.8}>
					<Text className='font-body text-white font-bold text-sm'>{ctaLabel}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
