import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { View } from 'react-native';
import { CalendarIcon, HomeIcon, UserIcon, UsersIcon } from 'react-native-heroicons/solid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InstructorLayout() {
	const insets = useSafeAreaInsets();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#f97316',
				tabBarInactiveTintColor: '#a1a1aa',
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarStyle: {
					backgroundColor: '#1f2937',
					borderTopWidth: 0,
					borderRadius: 0,
					marginHorizontal: 0,
					height: 60 + insets.bottom,
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					paddingHorizontal: 8,
					overflow: 'hidden',
					elevation: 0,
					paddingBottom: Math.max(insets.bottom, 6),
					paddingTop: 0,
				},
				tabBarItemStyle: {
					justifyContent: 'center',
					alignItems: 'center',
					height: 60,
					paddingVertical: 0,
					paddingTop: 0,
					paddingBottom: 0,
					margin: 0,
				},
				tabBarIconStyle: {
					marginTop: 0,
					marginBottom: 0,
				},
				tabBarShowLabel: false,
				tabBarLabel: () => null,
			}}>
			<Tabs.Screen
				name='dashboard'
				options={{
					title: 'Inicio',
					tabBarIcon: ({ focused }) => (
						<View
							style={{
								backgroundColor: focused ? '#f97316' : 'transparent',
								borderRadius: 12,
								width: 44,
								height: 44,
								alignItems: 'center',
								justifyContent: 'center',
								marginTop: 16,
							}}>
							<HomeIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name='classes'
				options={{
					title: 'Clases',
					tabBarIcon: ({ focused }) => (
						<View
							style={{
								backgroundColor: focused ? '#f97316' : 'transparent',
								borderRadius: 12,
								width: 44,
								height: 44,
								alignItems: 'center',
								justifyContent: 'center',
								marginTop: 16,
							}}>
							<CalendarIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name='clients'
				options={{
					title: 'Clientes',
					tabBarIcon: ({ focused }) => (
						<View
							style={{
								backgroundColor: focused ? '#f97316' : 'transparent',
								borderRadius: 12,
								width: 44,
								height: 44,
								alignItems: 'center',
								justifyContent: 'center',
								marginTop: 16,
							}}>
							<UsersIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name='profile'
				options={{
					title: 'Perfil',
					tabBarIcon: ({ focused }) => (
						<View
							style={{
								backgroundColor: focused ? '#f97316' : 'transparent',
								borderRadius: 12,
								width: 44,
								height: 44,
								alignItems: 'center',
								justifyContent: 'center',
								marginTop: 16,
							}}>
							<UserIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
						</View>
					),
				}}
			/>
		</Tabs>
	);
}
