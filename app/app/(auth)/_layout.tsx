import { Stack } from 'expo-router';

export default function AuthLayout() {
	return (
		<Stack
			screenOptions={{
				contentStyle: { backgroundColor: '#FFFFFF' },
				headerShown: false,
			}}>
			<Stack.Screen name='login' />
			<Stack.Screen name='register' />
			<Stack.Screen name='forgot-password' />
			<Stack.Screen name='confirm-email' />
		</Stack>
	);
}
