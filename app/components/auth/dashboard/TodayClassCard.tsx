import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CalendarDaysIcon, ChevronRightIcon, ClockIcon } from 'react-native-heroicons/mini';

type TodayClassProps = {
	title?: string;
	dateLabel?: string;
	spotsLabel?: string; 
	timeLabel?: string; 
	headerTitle?: string;
};

export function TodayClassCard({
	title = 'Powerlifting Avanzado',
	dateLabel = '15 de Noviembre del 2025',
	spotsLabel = '10/15',
	timeLabel = '07:00 (90 MIN)',
	headerTitle = 'Clase de hoy',
}: TodayClassProps) {
	return (
		<View className='mt-6 rounded-2xl bg-white px-4 py-3 border border-[#e5e7eb] shadow-sm'>
			<View className='flex-row items-center mb-3'>
				<CalendarDaysIcon width={18} height={18} color='#f97316' />
				<Text className='ml-2 text-[14px] font-medium text-[#111827]'>
					{headerTitle}
				</Text>
			</View>

			<View className='rounded-xl bg-white px-4 py-4 flex-row justify-between items-center border border-[#e5e7eb]'>
				<View className='flex-col flex-1 pr-3'>
					<Text className='text-[14px] font-semibold text-[#111827]'>{title}</Text>
					<Text className='mt-[2px] text-[12px] text-[#4b5563]'>{dateLabel}</Text>

					<View className='mt-3 flex-row items-center'>
						<ClockIcon width={14} height={14} color='#f97316' />
						<Text className='ml-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f97316]'>
							{timeLabel}
						</Text>
					</View>
				</View>

				<TouchableOpacity
					activeOpacity={0.8}
					className='flex-row items-center rounded-full bg-white px-3 py-1 border border-[#f97316]'>
					<Text className='text-[12px] font-medium text-[#111827]'>{spotsLabel}</Text>
					<ChevronRightIcon width={12} height={12} color='#f97316' style={{ marginLeft: 4 }} />
				</TouchableOpacity>
			</View>
		</View>
	);
}
