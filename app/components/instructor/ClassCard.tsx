import { useAuth } from '@/contexts/AuthContext';
import vitalFitApi, { BranchClassInfo, ClassScheduleItem } from '@/services/vitalfitSdk';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ClockIcon } from 'react-native-heroicons/mini';

export interface ClassCardProps {
	item: ClassScheduleItem | BranchClassInfo;
	dateStr: string;
	onPress?: () => void;
	showDate?: boolean;
}

const formatTime = (time: string) => {
	if (!time) return '';
	if (time.includes('T')) {
		return time.split('T')[1].substring(0, 5);
	}
	return time.substring(0, 5);
};

export const ClassCard: React.FC<ClassCardProps> = ({
	item,
	dateStr,
	onPress,
	showDate = true,
}) => {
	const { token } = useAuth();
	const [occupancy, setOccupancy] = useState<number | null>(null);

	// Robustly checking for properties to handle both ClassScheduleItem and BranchClassInfo
	// regardless of whether 'class_name' was manually added.
	/* eslint-disable @typescript-eslint/no-explicit-any */
	const title =
		(item as any).class_name || (item as any).service_name || (item as any).name || 'Clase';

	const startTime = (item as any).start_time || (item as any).starts_at;
	const endTime = (item as any).end_time || (item as any).ends_at;

	const classId = (item as any).class_id;
	/* eslint-enable @typescript-eslint/no-explicit-any */
	const capacity = item.max_capacity;

	useEffect(() => {
		let isMounted = true;
		const fetchOccupancy = async () => {
			if (token && classId) {
				try {
					// Note: usage of 'any' cast as typings might be missing as discovered previously
					// But per user request: GET /schedule/{classId}/bookings/count
					// Using existing SDK method if available or raw call if needed, but user said "use SDK".
					// I found getClassBookingCount in BookingService earlier.
					const response = await vitalFitApi.booking.getClassBookingCount(classId, token);
					if (isMounted && response) {
						// The SDK type for response might be ClassBookingCount object or just the DataResponse wrapper?
						// In index.d.ts: getClassBookingCount(classID: string, jwt: string): Promise<ClassBookingCount>;
						// I wasn't able to see ClassBookingCount definition, but usuall it returns an object.
						// If it returns { count: number } or simply number?
						// Let's assume it returns an object with a count property or we inspect it.
						// Safest bet: check if response has 'count' or 'data' property.
						// Since I couldn't see the type, I will treat it safely.
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const count = (response as any).count ?? (response as any).data ?? 0;
						setOccupancy(typeof count === 'number' ? count : 0);
					}
				} catch (error) {
					console.log('Error fetching occupancy:', error);
				}
			}
		};

		fetchOccupancy();
		return () => {
			isMounted = false;
		};
	}, [classId, token]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const currentOccupancy = occupancy !== null ? occupancy : ((item as any).occupied ?? 0);

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={onPress}>
			<View className='mb-3 flex-row items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-4'>
				<View className='flex-1 flex-col pr-3'>
					<Text className='text-[14px] font-semibold text-[#111827]'>{title}</Text>
					{showDate && (
						<Text className='mt-[2px] text-[12px] text-[#4b5563]'>{dateStr}</Text>
					)}
					<View className='mt-3 flex-row items-center'>
						<ClockIcon width={14} height={14} color='#f97316' />
						<Text className='ml-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f97316]'>
							{formatTime(startTime)} - {formatTime(endTime)}
						</Text>
					</View>
				</View>
				<View className='flex-row items-center rounded-full border border-[#f97316] bg-white px-3 py-1'>
					<Text className='text-[12px] font-medium text-[#111827]'>
						{currentOccupancy}/{capacity}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};
