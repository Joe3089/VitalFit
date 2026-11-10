import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type FloatingChatButtonProps = {
	bottomOffset?: number;
};

export function FloatingChatButton({ bottomOffset = 80 }: FloatingChatButtonProps) {
	const router = useRouter();
	const { user } = useUser();

	// Only show chatbot button if user has an active membership
	const hasMembership = user?.membership?.status === 'Active';

	if (!hasMembership) {
		return null;
	}

	return (
		<View style={[styles.container, { bottom: bottomOffset }]}>
			<TouchableOpacity
				onPress={() => router.push('/chatbot')}
				activeOpacity={0.8}
				style={styles.button}>
				<Ionicons name='chatbubble-ellipses' size={28} color='#ffffff' />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 16,
		zIndex: 1000,
	},
	button: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#f97316',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
	},
});
