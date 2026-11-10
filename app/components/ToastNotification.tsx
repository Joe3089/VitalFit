import { AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface Props {
	type: 'success' | 'error' | 'warning';
	title: string;
	message: string;
	visible: boolean;
	onClose: () => void;
	duration?: number;
}

export function ToastNotification({
	type,
	title,
	message,
	visible,
	onClose,
	duration = 5000,
}: Props) {
	const translateY = useRef(new Animated.Value(-150)).current;

	const handleClose = useCallback(() => {
		Animated.timing(translateY, {
			toValue: -150,
			duration: 300,
			useNativeDriver: true,
		}).start(onClose);
	}, [onClose, translateY]);

	useEffect(() => {
		if (visible) {
			Animated.spring(translateY, {
				toValue: 0,
				useNativeDriver: true,
				tension: 50,
				friction: 7,
			}).start();

			const timer = setTimeout(handleClose, duration);

			return () => clearTimeout(timer);
		}
	}, [visible, duration, handleClose, translateY]);

	if (!visible) return null;

	let backgroundColor: string;
	let iconBackgroundColor: string;
	let IconComponent: React.ElementType;
	const titleColor = '#111827';
	let messageColor = '#6B7280';

	switch (type) {
		case 'success':
			backgroundColor = '#F0FDF4';
			iconBackgroundColor = '#22C55E';
			IconComponent = CheckCircle;
			break;
		case 'warning':
			backgroundColor = '#FFFBEB';
			iconBackgroundColor = '#F59E0B';
			IconComponent = AlertCircle;
			break;
		case 'error':
			backgroundColor = '#FEF2F2';
			iconBackgroundColor = '#EF4444';
			IconComponent = XCircle;
			messageColor = '#B91C1C';
			break;
		default:
			backgroundColor = '#FFFFFF';
			iconBackgroundColor = '#6B7280';
			IconComponent = AlertCircle;
	}

	return (
		<Animated.View style={[styles.container, { backgroundColor, transform: [{ translateY }] }]}>
			<View style={styles.content}>
				<View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
					<IconComponent size={24} color='white' />
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: titleColor }]}>{title}</Text>
					<Text style={[styles.message, { color: messageColor }]}>{message}</Text>
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 60,
		left: 16,
		right: 16,
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 8,
		zIndex: 1000,
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.05)',
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	textContainer: {
		flex: 1,
		gap: 2,
	},
	title: {
		fontSize: 16,
		fontWeight: '700',
	},
	message: {
		fontSize: 14,
	},
});
