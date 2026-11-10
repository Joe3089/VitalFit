import { UserAvatar } from '@/components/UserAvatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi, { AssignedClientResponse } from '@/services/vitalfitSdk';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MagnifyingGlassIcon, PlusIcon } from 'react-native-heroicons/outline';

// Custom debounce implementation to avoid lodash dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let timeout: any;
	const debounced = (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
	debounced.cancel = () => {
		clearTimeout(timeout);
	};
	return debounced;
}

export default function ClientsScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { token } = useAuth();
	const { user } = useUser();

	const [clients, setClients] = useState<AssignedClientResponse[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');

	// Function to fetch clients
	const fetchClientsData = async (currentPage: number, search: string, isRefresh = false) => {
		if ((!isRefresh && !hasMore) || !token || !user?.userId) return;

		setLoading(true);
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const response = await (vitalFitApi.instructor as any).getAssignedClients(
				token,
				user.userId,
				{
					page: currentPage,
					limit: 10,
					sort: 'desc',
					search: search,
				},
			);

			if (response?.data) {
				const newClients = response.data;

				setClients((prev) => {
					// Filter out duplicates based on user_id
					const existingIds = new Set(isRefresh ? [] : prev.map((c) => c.user_id));
					const uniqueNewClients = newClients.filter(
						(c: AssignedClientResponse) => !existingIds.has(c.user_id),
					);
					return isRefresh ? newClients : [...prev, ...uniqueNewClients];
				});

				setHasMore(newClients.length === 10);
			} else {
				if (isRefresh) setClients([]);
				setHasMore(false);
			}
		} catch (error) {
			console.error('Error fetching assigned clients:', error);
			setHasMore(false);
		} finally {
			setLoading(false);
		}
	};

	// Debounced search handler
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleSearch = useCallback(
		debounce((query: string) => {
			setPage(1);
			setHasMore(true);
			fetchClientsData(1, query, true);
		}, 500),
		[token, user?.userId],
	);

	// Effect to trigger search when query changes
	useEffect(() => {
		handleSearch(searchQuery);
		return () => {
			handleSearch.cancel();
		};
	}, [searchQuery, handleSearch]);

	const loadMore = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchClientsData(nextPage, searchQuery);
		}
	};

	const renderItem = ({ item }: { item: AssignedClientResponse }) => {
		const fullName = `${item.first_name} ${item.last_name}`;
		// Use the profile_picture_url directly from the item
		const avatarUrl = item.profile_picture_url || undefined;

		return (
			<View className='mb-4 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-4 shadow-sm'>
				<View className='mb-3 flex-row items-center'>
					<View className='mr-3'>
						<UserAvatar
							name={fullName}
							imageUrl={avatarUrl}
							size={44}
							// Remove style overwrites if UserAvatar handles colors internally to ensure distinct colors
							// Assuming UserAvatar uses hash for color if not provided or if style doesn't override it.
							// The user complained about color circles, checking implementation:
							// UserAvatar uses `getBackgroundColor(name)` but if `style` has backgroundColor, it might override it.
							// Passed style={{ backgroundColor: '#FED7AA' }} in previous code. Removing it to let dynamic colors work.
						/>
					</View>
					<View className='flex-1'>
						<Text
							className='text-[14px] font-bold text-[#1F2024]'
							style={{ fontFamily: 'Montserrat_600SemiBold' }}>
							{fullName}
						</Text>
						<Text
							className='text-[12px] text-[#71727A]'
							style={{ fontFamily: 'Montserrat_400Regular' }}>
							{`${t('instructor.clients.totalBookings')}: ${item.total_bookings}`}
						</Text>
						{item.phone && (
							<Text
								className='mt-1 text-[12px] text-[#111827]'
								style={{ fontFamily: 'Montserrat_500Medium' }}>
								{item.phone}
							</Text>
						)}
					</View>
				</View>

				<View className='mt-1 flex-row gap-3'>
					<TouchableOpacity
						activeOpacity={0.8}
						className='flex-1 flex-row items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white py-2.5'
						onPress={() =>
							router.push({
								pathname: '/instructor-assign-routine',
								params: {
									clientId: item.user_id,
									name: fullName,
								},
							})
						}>
						<PlusIcon width={16} height={16} color='#111827' />
						<Text
							className='ml-2 text-[12px] text-[#111827]'
							style={{ fontFamily: 'Montserrat_500Medium' }}>
							{t('instructor.clients.assignRoutine')}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						activeOpacity={0.8}
						className='flex-1 items-center justify-center rounded-2xl bg-[#f97316] py-2.5'
						onPress={() =>
							router.push({
								pathname: '/instructor-client-progress',
								params: {
									clientId: item.user_id,
									name: fullName,
								},
							})
						}>
						<Text
							className='text-[12px] text-white'
							style={{ fontFamily: 'Montserrat_600SemiBold' }}>
							{t('instructor.clients.viewProgress')}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	return (
		<ThemedView className='flex-1 bg-white pt-10'>
			<View className='mb-4 items-center px-4'>
				<Image
					source={require('@/assets/images/Frame.png')}
					style={{ width: 150, height: 50, resizeMode: 'contain' }}
				/>
			</View>
			<View className='mb-3 px-4'>
				<View className='w-full items-center justify-center rounded-2xl bg-[#F3F4F6] py-2'>
					<ThemedText
						lightColor='#111827'
						style={{ fontFamily: 'System', fontSize: 16, fontWeight: '600' }}>
						{t('instructor.clients.title')}
					</ThemedText>
				</View>
			</View>

			<View className='mb-4 px-4'>
				<View className='flex-row items-center rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3'>
					<MagnifyingGlassIcon size={20} color='#9CA3AF' />
					<TextInput
						className='ml-3 flex-1 text-[14px] text-[#1F2024]'
						placeholder={t('instructor.clients.searchPlaceholder', 'Buscar cliente...')}
						placeholderTextColor='#9CA3AF'
						value={searchQuery}
						onChangeText={setSearchQuery}
						style={{ fontFamily: 'Montserrat_400Regular' }}
					/>
				</View>
			</View>

			<FlatList
				data={clients}
				keyExtractor={(item) => item.user_id}
				renderItem={renderItem}
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
				ListEmptyComponent={
					loading ? (
						<ActivityIndicator size='small' color='#f97316' className='mt-10' />
					) : (
						<Text className='mt-4 text-center text-[14px] text-[#6b7280]'>
							{t('instructor.clients.noClients')}
						</Text>
					)
				}
				ListFooterComponent={
					loading && clients.length > 0 ? (
						<ActivityIndicator size='small' color='#f97316' className='mt-4' />
					) : null
				}
			/>
		</ThemedView>
	);
}
