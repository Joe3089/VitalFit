import { UserAvatar } from '@/components/UserAvatar';
import { AssignedClientResponse } from '@/services/vitalfitSdk';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRightIcon, UsersIcon } from 'react-native-heroicons/outline';

interface MyClientsCardGroupProps {
	clients: AssignedClientResponse[];
	onClientPress?: (client: AssignedClientResponse) => void;
}

export function MyClientsCardGroup({ clients, onClientPress }: MyClientsCardGroupProps) {
	const { t } = useTranslation();

	return (
		<View className='mt-6 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-sm'>
			<View className='mb-3 flex-row items-center'>
				<UsersIcon size={18} color='#f97316' />
				<Text className='ml-2 text-[14px] font-medium text-[#111827]'>
					{t('instructor.dashboard.myClients.title')}
				</Text>
			</View>

			{clients.length === 0 ? (
				<Text className='py-4 text-center text-gray-500'>
					{t('instructor.clients.noClients')}
				</Text>
			) : (
				clients.map((client) => {
					const fullName = `${client.first_name} ${client.last_name}`;
					const avatarUrl = client.profile_picture_url || undefined;

					return (
						<TouchableOpacity
							key={client.user_id}
							className='mb-3 flex-row items-center justify-between rounded-2xl bg-[#F8F9FB] px-4 py-3'
							activeOpacity={0.8}
							onPress={() => onClientPress?.(client)}>
							<View className='mr-3'>
								<UserAvatar name={fullName} imageUrl={avatarUrl} size={40} />
							</View>

							<View className='flex-1'>
								<Text className='text-[14px] font-bold text-[#1F2024]'>
									{fullName}
								</Text>
								<Text className='mt-0.5 text-[12px] text-[#71727A]'>
									{`${t('instructor.clients.totalBookings')}: ${client.total_bookings}`}
								</Text>
							</View>

							<ChevronRightIcon size={12} color='#71727A' />
						</TouchableOpacity>
					);
				})
			)}
		</View>
	);
}
