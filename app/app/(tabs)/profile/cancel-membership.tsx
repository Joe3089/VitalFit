import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CancelMembershipScreen() {
	const router = useRouter();

	return (
		<SafeAreaView className='flex-1 bg-white dark:bg-neutral-950'>
			<TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} className='absolute left-4 top-14'>
					<ChevronLeftIcon size={28} color='#F27F2A' />
				</TouchableOpacity>
			<View className='flex-1 justify-center items-center p-6'>
				<ThemedText className='font-heading text-3xl font-bold text-center mb-12'>
					¿Estás seguro de que quieres cancelar?
				</ThemedText>

				<View className='w-full'>
					<SecondaryButton
						title='Mantener membresía'
						onPress={() => router.push('/membership-entry')}
					/>
					<View className='h-4' />
					<PrimaryButton
						title='Cancelar membresía'
						onPress={() => {
							console.log('Membresía cancelada');
							router.replace('/(tabs)/profile');
						}}
					/>
				</View>
			</View>
		</SafeAreaView>
	);
}
