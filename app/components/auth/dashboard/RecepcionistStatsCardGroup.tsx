import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import {
	CalendarDaysIcon,
	ChartBarIcon,
	ClipboardDocumentCheckIcon,
} from 'react-native-heroicons/mini';

interface Props {
	checkInsTodayCount?: number | null;
	classesTodayCount?: number | null;
	monthlyTrend?: number | null;
}

export function RecepcionistStatsCardGroup({
	checkInsTodayCount = null,
	classesTodayCount = null,
	monthlyTrend = null,
}: Props) {
	const { t } = useTranslation();

	const renderValue = (value: number | string | null | undefined, suffix = '') => {
		if (value === null || value === undefined) return '-';
		return `${value}${suffix}`;
	};

	return (
		<View className='mt-4 flex-row justify-between px-2'>
			{/* Daily Check-ins */}
			<View className='w-[32%] rounded-2xl border border-[#f97316] bg-white p-3 shadow-sm dark:bg-neutral-900'>
				<View className='mb-1 flex-row items-center justify-center'>
					<ClipboardDocumentCheckIcon width={20} height={20} color='#22C55E' />
					<Text
						className='ml-1 flex-shrink text-center text-[11px] font-medium text-neutral-900 dark:text-white'
						adjustsFontSizeToFit
						numberOfLines={1}>
						{t('dashboard.stats.dailyCheckIns')}
					</Text>
				</View>
				<Text className='mt-1 text-center text-[22px] font-semibold text-neutral-900 dark:text-white'>
					{renderValue(checkInsTodayCount)}
				</Text>
			</View>

			{/* Classes Today */}
			<View className='w-[32%] rounded-2xl border border-[#f97316] bg-white p-3 shadow-sm dark:bg-neutral-900'>
				<View className='mb-1 flex-row items-center justify-center'>
					<CalendarDaysIcon width={20} height={20} color='#F17B23' />
					<Text
						className='ml-1 flex-shrink text-center text-[11px] font-medium text-neutral-900 dark:text-white'
						adjustsFontSizeToFit
						numberOfLines={1}>
						{t('dashboard.stats.classesToday')}
					</Text>
				</View>
				<Text className='mt-1 text-center text-[22px] font-semibold text-neutral-900 dark:text-white'>
					{renderValue(classesTodayCount)}
				</Text>
			</View>

			{/* Monthly Occupancy */}
			<View className='w-[32%] rounded-2xl border border-[#f97316] bg-white p-3 shadow-sm dark:bg-neutral-900'>
				<View className='mb-1 flex-row items-center justify-center'>
					<ChartBarIcon width={20} height={20} color='#9747FF' />
					<Text
						className='ml-1 flex-shrink text-center text-[11px] font-medium text-neutral-900 dark:text-white'
						adjustsFontSizeToFit
						numberOfLines={1}>
						{t('dashboard.stats.monthlyTrend')}
					</Text>
				</View>
				<Text className='mt-1 text-center text-[22px] font-semibold text-neutral-900 dark:text-white'>
					{renderValue(monthlyTrend, '%')}
				</Text>
			</View>
		</View>
	);
}
