import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { UsersIcon } from 'react-native-heroicons/mini';

interface Props {
	currentOccupancy: number;
	maxCapacity: number;
}

export function GymCapacityCard({ currentOccupancy = 0, maxCapacity = 100 }: Props) {
	const { t } = useTranslation();

	// Prevent division by zero and ensure valid numbers
	const safeMaxCapacity = maxCapacity > 0 ? maxCapacity : 1;
	const occupancyPercentage = Math.round((currentOccupancy / safeMaxCapacity) * 100);
	const availableSpaces = Math.max(0, safeMaxCapacity - currentOccupancy);

	return (
		<View className='mt-4 rounded-2xl border border-[#f97316] bg-white p-4 shadow-sm dark:bg-neutral-900'>
			<View className='mb-2 flex-row items-center'>
				<UsersIcon width={20} height={20} color='#0F172A' />
				<Text className='ml-2 text-[16px] font-semibold text-neutral-900 dark:text-white'>
					{t('dashboard.capacity.title')}
				</Text>
			</View>

			<Text className='mb-3 text-[14px] text-neutral-700 dark:text-neutral-400'>
				{t('dashboard.capacity.subtitle')}
			</Text>

			<View className='mb-3 flex-row items-end justify-between'>
				<Text className='text-[15px] font-medium text-neutral-800 dark:text-neutral-400'>
					{t('dashboard.capacity.occupancy')}
				</Text>
				<Text
					style={{ fontFamily: 'BebasNeue-Regular' }}
					className='text-[39px] leading-none text-black dark:text-white'>
					{currentOccupancy}/{safeMaxCapacity}
				</Text>
			</View>

			<View className='flex-row items-center justify-between'>
				<View className='rounded-lg bg-neutral-100 px-3 py-1 dark:bg-neutral-800'>
					<Text className='text-[13px] font-medium text-neutral-900 dark:text-white'>
						{occupancyPercentage}
						{t('dashboard.capacity.occupied')}
					</Text>
				</View>
				<Text className='text-[13px] text-neutral-600 dark:text-neutral-400'>
					{availableSpaces} {t('dashboard.capacity.available')}
				</Text>
			</View>
		</View>
	);
}
