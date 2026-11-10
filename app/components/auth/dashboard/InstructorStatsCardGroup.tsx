import { KPICard } from '@/types/reports';
import { Dumbbell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { CheckCircleIcon, UsersIcon } from 'react-native-heroicons/outline';

type Props = {
	monthlyClasses?: KPICard | null;
	studentCount?: KPICard | null;
	attendanceRate?: number;
};

export function InstructorStatsCardGroup({ monthlyClasses, studentCount, attendanceRate }: Props) {
	const { t } = useTranslation();
	const cards = [
		{
			label: monthlyClasses?.trend ? `${t('instructor.dashboard.stats.monthlyClasses')} ${monthlyClasses.trend}` : t('instructor.dashboard.stats.monthlyClasses'),
			value: monthlyClasses ? `${monthlyClasses.value}` : '--',
			icon: <Dumbbell size={16} color='#f97316' strokeWidth={1.8} />,
		},
		{
			label: studentCount?.trend ? `${t('instructor.dashboard.stats.studentsToday')} ${studentCount.trend}` : t('instructor.dashboard.stats.studentsToday'),
			value: studentCount ? `${studentCount.value}` : '--',
			icon: <UsersIcon size={16} color='#f97316' />,
		},
		{
			label: t('instructor.dashboard.stats.attendanceRate'),
			value: attendanceRate !== undefined ? `${attendanceRate}%` : '--%',
			icon: <CheckCircleIcon size={16} color='#f97316' />,
		},
	];

	return (
		<View className='flex-row justify-between mt-6 px-2'>
			{cards.map((card, index) => (
				<View
					key={index}
					className='w-[30%] bg-white rounded-2xl px-2 py-3 border border-[#f97316] shadow-sm'>
					<View className='items-center mb-1'>{card.icon}</View>
					<Text className='text-center text-[18px] font-semibold text-[#111827]'>
						{card.value}
					</Text>
					<Text className='mt-1 text-center text-[10px] text-[#4b5563]'>{card.label}</Text>
				</View>
			))}
		</View>
	);
}
