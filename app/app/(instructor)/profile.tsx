import { InstructorQRModal } from '@/components/instructor/InstructorQRModal';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
	ArrowRightOnRectangleIcon,
	BellIcon,
	ChevronRightIcon,
	GlobeAltIcon,
	ShieldCheckIcon,
	UserCircleIcon,
	ClipboardDocumentListIcon
} from 'react-native-heroicons/outline';

export default function InstructorProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { user, loading, clearUser } = useUser();
	const { logout } = useAuth();
	const [qrModalVisible, setQrModalVisible] = useState(false);
	const [logoutModalVisible, setLogoutModalVisible] = useState(false);

	if (loading) {
		return (
			<ThemedView className='flex-1 justify-center items-center bg-white'>
				<ActivityIndicator size='large' color='#F27F2A' />
			</ThemedView>
		);
	}

	const displayName = user
		? user.lastName
			? `${user.firstName || t('instructor.profile.defaultName')} ${user.lastName}`
			: user.firstName || t('instructor.profile.defaultName')
		: t('instructor.profile.defaultName');

	const handleConfirmLogout = async () => {
		setLogoutModalVisible(false);
		clearUser();
		await logout();
	};



	return (
		<ThemedView className='flex-1 bg-white pt-10'>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
				{/* Avatar e info básica */}
				<View className='mb-4 items-start'>
					<UserAvatar
						name={displayName}
						imageUrl={user?.profilePicture}
						size={96}
						style={{ marginBottom: 12 }}
					/>
					<Text className='text-[20px] font-semibold text-[#111827]'>{displayName}</Text>

					<Text className='text-[13px] text-[#f97316] mt-0.5'>{t('instructorProfile.role')}</Text>
				</View>

				<View className='mb-4'>
				</View>

				<View className='mb-2'>
					<Text className='text-[14px] font-semibold text-[#111827] mb-2'>{t('instructor.profile.settings')}</Text>
				</View>

				<TouchableOpacity
					activeOpacity={0.8}
					className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
					onPress={() => {
						router.push('/instructor-profile-personal');
					}}>
					<View className='flex-row items-center'>
						<View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
							<UserCircleIcon width={18} height={18} color='#f97316' />
						</View>
						<Text className='text-[13px] text-[#f97316]'>{t('instructor.profile.personalInfo')}</Text>
					</View>
					<ChevronRightIcon width={16} height={16} color='#f97316' />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
					onPress={() => {
						router.push('/instructor-security');
					}}>
					<View className='flex-row items-center'>
						<View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
							<ShieldCheckIcon width={18} height={18} color='#f97316' />
						</View>
						<Text className='text-[13px] text-[#f97316]'>{t('instructor.profile.security')}</Text>
					</View>
					<ChevronRightIcon width={16} height={16} color='#f97316' />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
					onPress={() => {
						router.push('/language');
					}}>
					<View className='flex-row items-center'>
						<View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
							<GlobeAltIcon width={18} height={18} color='#f97316' />
						</View>
						<Text className='text-[13px] text-[#f97316]'>{t('instructor.profile.language')}</Text>
					</View>
					<ChevronRightIcon width={16} height={16} color='#f97316' />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
					onPress={() => {
						router.push('/instructor-notifications');
					}}>
					<View className='flex-row items-center'>
						<View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
							<BellIcon width={18} height={18} color='#f97316' />
						</View>
						<Text className='text-[13px] text-[#f97316]'>{t('instructor.profile.notifications')}</Text>
					</View>
					<ChevronRightIcon width={16} height={16} color='#f97316' />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-3'
					onPress={() => {
						router.push('/instructor-my-routines');
					}}>
					<View className='flex-row items-center'>
						<View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
							<ClipboardDocumentListIcon width={18} height={18} color='#f97316' />
						</View>
						<Text className='text-[13px] text-[#f97316]'>{t('instructor.profile.myRoutines')}</Text>
					</View>
					<ChevronRightIcon width={16} height={16} color='#f97316' />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					className='w-full flex-row items-center justify-between rounded-2xl bg-white border border-[#f97316] px-4 py-3 mb-6'
					onPress={() => {
						setLogoutModalVisible(true);
					}}>
					<View className='flex-row items-center'>
						<View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
							<ArrowRightOnRectangleIcon width={18} height={18} color='#b91c1c' />
						</View>
						<Text className='text-[13px] text-[#b91c1c] font-semibold'>{t('instructor.profile.logout')}</Text>
					</View>
					<ChevronRightIcon width={16} height={16} color='#b91c1c' />
				</TouchableOpacity>
			</ScrollView>

			<InstructorQRModal
				visible={qrModalVisible}
				onClose={() => setQrModalVisible(false)}
			/>

			<Modal
				visible={logoutModalVisible}
				transparent
				animationType='fade'
				onRequestClose={() => setLogoutModalVisible(false)}>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.4)',
						justifyContent: 'center',
						alignItems: 'center',
						paddingHorizontal: 24,
					}}>
					<View
						style={{
							width: '100%',
							maxWidth: 360,
							borderRadius: 16,
							backgroundColor: '#FFFFFF',
							paddingHorizontal: 20,
							paddingVertical: 20,
						}}>
						<Text
							style={{
								fontSize: 16,
								fontWeight: '600',
								color: '#111827',
								marginBottom: 8,
							}}>
							{t('instructor.profile.logoutConfirm.title')}
						</Text>
						<Text
							style={{
								fontSize: 13,
								color: '#4b5563',
								marginBottom: 16,
						}}>
							{t('instructor.profile.logoutConfirm.message')}
						</Text>
						<View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
							<TouchableOpacity
								activeOpacity={0.8}
								onPress={() => setLogoutModalVisible(false)}
								style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }}>
								<Text style={{ fontSize: 13, color: '#4b5563' }}>{t('instructor.profile.logoutConfirm.cancel')}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								activeOpacity={0.9}
								onPress={handleConfirmLogout}
								style={{
									paddingVertical: 8,
									paddingHorizontal: 14,
									borderRadius: 999,
									backgroundColor: '#f97316',
								}}>
								<Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>{t('instructor.profile.logout')}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</ThemedView>
	);
}
