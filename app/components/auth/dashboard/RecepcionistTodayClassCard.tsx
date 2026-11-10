import { ClassScheduleItem } from '@vitalfit/sdk';
import { Dumbbell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { CheckCircleIcon, ClockIcon, UserIcon, UsersIcon } from 'react-native-heroicons/mini';

interface Props {
	classes: ClassScheduleItem[];
}

export function RecepcionistTodayClassCard({ classes }: Props) {
	const { t } = useTranslation();

	const formatTime = (timeStr: string) => {
		if (!timeStr) return '';
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours, 10);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	};

	// If no classes, show only the "No more classes" card
	if (!classes || classes.length === 0) {
		return (
			<View className='mt-4 rounded-2xl border border-[#f97316] bg-white p-4 dark:bg-neutral-900'>
				<View className='mb-3 flex-row items-center'>
					<CheckCircleIcon width={16} height={16} color='#0F172A' />
					<Text className='ml-2 text-[16px] font-semibold text-neutral-900 dark:text-white'>
						{t('dashboard.todayClasses.title')}
					</Text>
				</View>
				<Text className='mb-4 text-[14px] text-neutral-700 dark:text-neutral-400'>
					{t('dashboard.todayClasses.subtitle')}
				</Text>

				<View className='mb-4 items-center justify-center rounded-xl border border-[#f97316] bg-white p-6 dark:bg-neutral-800'>
					<Text className='text-center text-[16px] font-bold text-neutral-500 dark:text-neutral-400'>
						{t('dashboard.todayClasses.noClasses')}
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View className='mt-4 rounded-2xl border border-[#f97316] bg-white p-4 dark:bg-neutral-900'>
			<View className='mb-3 flex-row items-center'>
				<CheckCircleIcon width={16} height={16} color='#0F172A' />
				<Text className='ml-2 text-[16px] font-semibold text-neutral-900 dark:text-white'>
					{t('dashboard.todayClasses.title')}
				</Text>
			</View>

			<Text className='mb-4 text-[14px] text-neutral-700 dark:text-neutral-400'>
				{t('dashboard.todayClasses.subtitle')}
			</Text>

			{classes.map((item, index) => (
				<View
					key={`${item.class_id}-${index}`}
					className='mb-4 rounded-xl border border-[#f97316] bg-white p-3 dark:bg-neutral-800'>
					<View className='mb-3 flex-row items-start justify-between'>
						<View className='flex-1 flex-row items-center'>
							<View className='mr-3 rounded-md bg-white p-2'>
								<Dumbbell width={28} height={28} color='#F27F2A' />
							</View>
							<View className='flex-1'>
								<Text className='text-[16px] font-extrabold leading-tight text-neutral-900 dark:text-white'>
									{item.class_name}
								</Text>
							</View>
						</View>
					</View>

					<View className='mb-3 gap-2'>
						<View className='flex-row items-center'>
							<UserIcon width={14} height={14} color='#0F172A' />
							<Text className='ml-2 text-[14px] capitalize text-neutral-800 dark:text-neutral-300'>
								{item.instructor_name}
							</Text>
						</View>

						<View className='flex-row items-center'>
							<ClockIcon width={16} height={16} color='#0F172A' />
							<Text className='ml-2 text-[14px] text-neutral-800 dark:text-neutral-300'>
								{formatTime(item.start_time)} - {formatTime(item.end_time)}
							</Text>
						</View>

						<View className='flex-row items-center'>
							<UsersIcon width={17} height={16} color='#0F172A' />
							<Text className='ml-2 text-[14px] text-neutral-800 dark:text-neutral-300'>
								{t('common.capacity')}: {item.max_capacity}
							</Text>
						</View>
					</View>
				</View>
			))}

			{/* Always append the "No More Classes" card at the end */}
			<View className='mb-4 items-center justify-center rounded-xl border border-[#f97316] bg-white p-6 dark:bg-neutral-800'>
				<Text className='text-center text-[16px] font-bold text-neutral-500 dark:text-neutral-400'>
					{t('dashboard.todayClasses.noClasses')}
				</Text>
			</View>
		</View>
	);
}
