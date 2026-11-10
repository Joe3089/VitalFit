import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRightOnRectangleIcon, ChevronRightIcon } from 'react-native-heroicons/outline';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';

type SettingsMenuItemProps = {
	title: string;
	onPress?: () => void;
	isDestructive?: boolean;
	isWarning?: boolean;
	hasNav?: boolean;
	icon?: React.ReactNode;
};

const SettingsMenuItem = ({
	title,
	onPress,
	isDestructive = false,
	isWarning = false,
	hasNav = false,
	icon,
}: SettingsMenuItemProps) => {
	const textStyle = {
		fontSize: 14,
		color: isDestructive ? '#ef4444' : isWarning ? '#f97316' : '#000000',
	};

	return (
		<TouchableOpacity
			onPress={onPress}
			className='flex-row justify-between items-center py-4 px-4 bg-neutral-100 dark:bg-neutral-800'>
			<Text className='font-body' style={textStyle}>{title}</Text>
			{icon || (hasNav && <ChevronRightIcon size={20} color='#9ca3af' />)}
		</TouchableOpacity>
	);
};

type SettingsToggleItemProps = {
	title: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
};

const SettingsToggleItem = ({ title, value, onValueChange }: SettingsToggleItemProps) => (
	<View className='flex-row justify-between items-center py-4 px-4 bg-neutral-100 dark:bg-neutral-800'>
		<Text className='font-body' style={{ fontSize: 14, color: '#000000' }}>{title}</Text>
		<Switch
			value={value}
			onValueChange={onValueChange}
			trackColor={{ false: '#767577', true: '#f97316' }}
			thumbColor={value ? '#ffffff' : '#f4f3f4'}
		/>
	</View>
);

const SectionHeader = ({ title }: { title: string }) => (
	<View className='px-2 pt-6 pb-3'>
		<Text className='font-body text-sm text-gray-500 dark:text-gray-400'>{title}</Text>
	</View>
);

export default function SettingsScreen() {
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [pushNotifications, setPushNotifications] = useState(true);
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await AsyncStorage.removeItem('token');
			await AsyncStorage.removeItem('userData');
			setShowLogoutModal(false);
			router.replace('/(auth)/login');
		} catch (error) {
			console.error('Error al cerrar sesión:', error);
		}
	};

	return (
		<View className='flex-1 bg-white dark:bg-neutral-900'>
			<Stack.Screen options={{ headerShown: false }} />

			<View className='flex-row items-center justify-center pt-14 pb-4 px-4 bg-white dark:bg-neutral-900 relative'>
				<TouchableOpacity onPress={() => router.back()} className='absolute left-4 top-14'>
					<ChevronLeftIcon size={28} color='#F27F2A' />
				</TouchableOpacity>
				<ThemedText className='text-xl font-bold' style={{ fontFamily: Fonts.title }}>
					Configuración
				</ThemedText>
			</View>

			<ScrollView className='bg-white dark:bg-neutral-900 px-4'>
				<View>
					<SectionHeader title='Aplicación' />
					<View className='rounded-xl overflow-hidden mb-3'>
						<SettingsToggleItem
							title='Notificaciones Push'
							value={pushNotifications}
							onValueChange={setPushNotifications}
						/>
					</View>

					<SectionHeader title='Cuenta' />
					<View className='rounded-xl overflow-hidden'>
						<SettingsMenuItem
							title='Cambiar contraseña'
							onPress={() =>
								router.push({
									pathname: '/(auth)/forgot-password',
									params: { from: 'settings' },
								})
							}
							hasNav
						/>
						<View className='h-[1px] bg-white dark:bg-neutral-900 mx-4' />
						<SettingsMenuItem
							title='Salir'
							onPress={() => setShowLogoutModal(true)}
							isWarning={true}
							icon={<ArrowRightOnRectangleIcon size={20} color='#f97316' />}
						/>
						<View className='h-[1px] bg-white dark:bg-neutral-900 mx-4' />
						<SettingsMenuItem
							title='Eliminar cuenta'
							onPress={() => console.log('Eliminar cuenta')}
							isDestructive={true}
						/>
					</View>
				</View>
			</ScrollView>

			<Modal
				visible={showLogoutModal}
				transparent={true}
				animationType='fade'
				onRequestClose={() => setShowLogoutModal(false)}>
				<View className='flex-1 justify-center items-center bg-black/50'>
					<View className='bg-white dark:bg-neutral-900 rounded-3xl w-11/12 max-w-sm p-8 shadow-2xl'>
						<ThemedText className='text-2xl font-bold text-center mb-4'>
							¿Cerrar sesión?
						</ThemedText>
						<ThemedText className='text-base text-center text-neutral-600 dark:text-neutral-400 mb-8'>
							¿Estás seguro que quieres cerrar sesión?
						</ThemedText>

						<View className='gap-3'>
							<TouchableOpacity
								onPress={handleLogout}
								className='bg-orange-500 py-4 rounded-2xl items-center'
								activeOpacity={0.8}>
								<ThemedText className='text-white text-lg font-bold'>
									Sí, cerrar sesión
								</ThemedText>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => setShowLogoutModal(false)}
								className='bg-neutral-200 dark:bg-neutral-800 py-4 rounded-2xl items-center'
								activeOpacity={0.8}>
								<ThemedText className='text-neutral-800 dark:text-white text-lg font-bold'>
									No, cancelar
								</ThemedText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
