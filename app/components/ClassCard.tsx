import { ThemedText } from '@/components/themed-text';
import { Image } from 'expo-image';
import i18n from 'i18next';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';

type ClassData = {
	time: string;
	title: string;
	instructor: string;
	branch: string;
	imageUrl: string | number;
};

type ClassCardProps = {
	time: string;
	title: string;
	instructor: string;
	branch: string;
	imageUrl: string | number;
	onPress: (classData: ClassData) => void;
	variant?: 'default' | 'overlay';
	category?: string;
	reserved?: boolean;
	date?: string;
};

export default function ClassCard({
	time,
	title,
	instructor,
	branch,
	imageUrl,
	onPress,
	variant = 'default',
	category,
	reserved,
	date,
}: ClassCardProps) {
	const { t } = useTranslation();
	const classData: ClassData = { time, title, instructor, branch, imageUrl };
	const [imageError, setImageError] = React.useState(false);

	const formatDate = (dateString?: string) => {
		if (!dateString) return t('common.today');
		const date = new Date(dateString + 'T00:00:00'); // Add time to ensure correct parsing
		const today = new Date();
		const isToday = date.toDateString() === today.toDateString();
		if (isToday) return t('common.today');
		
		return date.toLocaleDateString(i18n.language, { 
			weekday: 'long', 
			day: 'numeric', 
			month: 'short' 
		});
	};

	if (variant === 'overlay') {
		return (
			<TouchableOpacity
				onPress={() => onPress(classData)}
				className='rounded-2xl overflow-hidden mb-4 bg-neutral-900'>
				<View className='h-40 w-full rounded-2xl overflow-hidden'>
					{imageUrl && !imageError ? (
						<Image
							source={imageUrl}
							style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
							contentFit='cover'
							contentPosition='center'
							onError={() => setImageError(true)}
						/>
					) : (
						<View className='absolute inset-0 bg-black justify-center items-center'>
							<Image
								source={require('@/assets/images/isotipo.png')}
								style={{ width: 160, height: 160 }}
								contentFit='contain'
							/>
						</View>
					)}
					<View className='absolute inset-0 bg-black/25' />
					<View className='absolute inset-0 p-4 justify-between'>
						<View>
							<ThemedText
								className='font-heading'
								lightColor='#ffffff'
								darkColor='#ffffff'
								style={{ fontFamily: 'BebasNeue-Regular', fontSize: 24 }}
							>
								{title}
							</ThemedText>
							<ThemedText
								className='font-body'
								lightColor='#E0E0E0'
								darkColor='#E0E0E0'
								style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, marginTop: 2 }}
							>
								{formatDate(date)}, {time}
							</ThemedText>
							<ThemedText
								className='font-body'
								lightColor='#E5E7EB'
								darkColor='#E5E7EB'
								style={{ fontFamily: 'Montserrat_400Regular', fontSize: 11, marginTop: 4 }}
							>

							</ThemedText>
						</View>
						<View className='flex-row items-center justify-between mt-2'>
							<ThemedText
								className='font-body'
								lightColor='#E5E7EB'
								darkColor='#E5E7EB'
								style={{ fontFamily: 'Montserrat_400Regular', fontSize: 12 }}
							>
								{instructor.replace(/^Con\s+/i, '')}
							</ThemedText>
							{!!(category || branch) && (
								<View className='px-3 py-1 rounded-full'
									style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
									<ThemedText
										className='font-body'
										lightColor='#ffffff'
										darkColor='#ffffff'
										style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 11 }}
									>
										{category || t('common.category')}
									</ThemedText>
								</View>
							)}
						</View>
					</View>
					{reserved ? (
						<View className='absolute top-3 right-3 bg-orange-500 rounded-full px-2 py-1'>
							<ThemedText
								className='font-body'
								lightColor='#ffffff'
								darkColor='#ffffff'
								style={{ fontSize: 12, fontWeight: 'bold' }}>
								{t('common.reserved')}
							</ThemedText>
						</View>
					) : null}
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			onPress={() => onPress(classData)}
			className='bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-4 flex-row items-center'>
			<View className='flex-1'>
				<ThemedText className='font-body text-sm text-neutral-500'>{time}</ThemedText>
				<ThemedText className='font-heading text-xl font-bold mt-1'>{title}</ThemedText>
				<ThemedText className='font-body text-sm text-neutral-500 mt-1'>
					{instructor} · {branch}
				</ThemedText>
				<TouchableOpacity
					onPress={() => onPress(classData)}
					className='bg-neutral-100 dark:bg-neutral-800 rounded-full py-2 px-4 mt-4 self-start'>
					<ThemedText className='font-body font-semibold'>{t('common.viewDetails')}</ThemedText>
				</TouchableOpacity>
			</View>
			<View style={{ width: 112, height: 84 }} className='rounded-xl overflow-hidden'>
				{imageUrl && !imageError ? (
					<Image
						source={imageUrl}
						style={{ width: '100%', height: '100%' }}
						contentFit='cover'
						contentPosition='center'
						onError={() => setImageError(true)}
					/>
				) : (
					<View className='w-full h-full bg-black justify-center items-center'>
						<Image
							source={require('@/assets/images/isotipo.png')}
							style={{ width: 60, height: 60 }}
							contentFit='contain'
						/>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
}
