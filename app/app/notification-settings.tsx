import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { BellIcon } from 'react-native-heroicons/outline';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';

const mockSettings = [
	{ id: '1', label: 'New offer available' },
	{ id: '2', label: 'New offer available' },
	{ id: '3', label: 'New offer available' },
	{ id: '4', label: 'New offer available' },
	{ id: '5', label: 'New offer available' },
	{ id: '6', label: 'New offer available' },
];

const SettingItem = ({ label }: { label: string }) => {
	const [isEnabled, setIsEnabled] = useState(false);
	const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

	return (
		<View className='flex-row items-center p-4 bg-white dark:bg-neutral-900'>
			<View className='w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 items-center justify-center mr-3'>
				<BellIcon size={24} color='#f97316' />
			</View>
			<View className='flex-1'>
				<Text className='font-body' style={{ fontSize: 14, fontWeight: '600', color: '#000000' }}>{label}</Text>
			</View>
			<Switch
				trackColor={{ false: '#767577', true: '#f97316' }}
				thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
				onValueChange={toggleSwitch}
				value={isEnabled}
			/>
		</View>
	);
};

export default function NotificationSettingsScreen() {
	const router = useRouter();

	return (
		<View className='flex-1 bg-white dark:bg-neutral-900'>
			<Stack.Screen options={{ headerShown: false }} />

			{/* Header */}
			<View className='flex-row items-center justify-center pt-14 pb-4 px-4 bg-white dark:bg-neutral-900 relative'>
				<TouchableOpacity
					onPress={() => router.back()}
					className='absolute left-4 top-14 p-2'>
					<ChevronLeftIcon size={28} color='#F27F2A' />
				</TouchableOpacity>
				<ThemedText className='text-xl font-bold' style={{ fontFamily: Fonts.title }}>
					Notificaciones
				</ThemedText>
			</View>

			<ScrollView>
				{mockSettings.map((item) => (
					<SettingItem key={item.id} label={item.label} />
				))}
			</ScrollView>
		</View>
	);
}
