import { ThemedText } from '@/components/themed-text';
import { Image } from 'expo-image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type ReservationCardProps = {
	time: string;
	title: string;
	instructor: string;
	branch: string;
	imageUrl: string;
	status: 'assisted' | 'absent' | 'cancelled';
};

export default function ReservationCard({
	time,
	title,
	instructor,
	branch,
	imageUrl,
	status,
}: ReservationCardProps) {
	const { t } = useTranslation();
	const statusStyles = {
		assisted: {
			text: t('common.status.assisted'),
			bgColor: 'bg-green-100 dark:bg-green-900',
			textColor: 'text-green-600 dark:text-green-400',
		},
		absent: {
			text: t('common.status.absent'),
			bgColor: 'bg-red-100 dark:bg-red-900',
			textColor: 'text-red-600 dark:text-red-400',
		},
		cancelled: {
			text: t('common.status.cancelled'),
			bgColor: 'bg-yellow-100 dark:bg-yellow-900',
			textColor: 'text-yellow-600 dark:text-yellow-400',
		},
	};

	const currentStatus = statusStyles[status];

	return (
		<View className='bg-white dark:bg-neutral-900 rounded-2xl p-4 mb-4 flex-row items-center'>
			<View className='flex-1'>
				<ThemedText className='text-sm text-neutral-500'>{time}</ThemedText>
				<ThemedText className='text-xl font-bold mt-1'>{title}</ThemedText>
				<ThemedText className='text-sm text-neutral-500 mt-1'>
					{instructor} · {branch}
				</ThemedText>
				<View className={`rounded-full py-2 px-4 mt-4 self-start ${currentStatus.bgColor}`}>
					<ThemedText className={`font-semibold ${currentStatus.textColor}`}>
						{currentStatus.text}
					</ThemedText>
				</View>
			</View>
			<Image source={imageUrl} style={{ width: 100, height: 100, borderRadius: 12 }} />
		</View>
	);
}
