import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/UserAvatar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    BackHandler,
    Image,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CheckCircleIcon, XMarkIcon } from 'react-native-heroicons/solid';

import { ToastNotification } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EnrollClientScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		id?: string;
		name?: string;
		date?: string;
		time?: string;
		capacity?: string;
		enrolled?: string;
		status?: string;
		instructor?: string;
		instructorImage?: string;
		serviceImage?: string;
		description?: string;
		notes?: string;
	}>();
	const { t } = useTranslation();

	const className = params.name || t('enrollClient.defaultClassName');

	// State for new flow
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [userData, setUserData] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const { toastState, showToast, hideToast } = useToast();

	const handleBackPress = useCallback(() => {
		if (step === 2) {
			setStep(1);
			setUserData(null);
			return true;
		}

		const queryParams = new URLSearchParams({
			id: params.id || '',
			name: params.name || '',
			date: params.date || '',
			time: params.time || '',
			capacity: params.capacity || '',
			enrolled: params.enrolled || '',
			status: params.status || '',
			instructor: params.instructor || '',
			instructorImage: params.instructorImage || '',
			serviceImage: params.serviceImage || '',
			description: params.description || '',
			notes: params.notes || '',
		});
		router.replace(`/(recepcionist)/class-details?${queryParams.toString()}`);
		return true;
	}, [router, params, step]);

	const handleSearchUser = async () => {
		if (!email.trim()) {
			 
			showToast(
				'error',
				t('common.error.unknown'),
				t('enrollClient.error.emailRequired') || 'El email es requerido',
			);
			return;
		}
		setLoading(true);
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;
			const res = await vitalFitApi.user.getUserByEmail(email.trim().toLowerCase(), token);
			if (res && res.data) {
				setUserData(res.data);
				setStep(2);
			} else {
				 
				showToast(
					'error',
					t('enrollClient.error.userNotFound') || 'Usuario no encontrado',
					'',
				);
			}
		} catch {
			 
			showToast(
				'error',
				t('enrollClient.error.searchFailed') || 'Error al buscar usuario',
				'',
			);
		} finally {
			setLoading(false);
		}
	};

	const handleEnroll = async () => {
		if (!userData?.user_id || !params.id) return;

		// Validation for Class Time
		if (params.date && params.time) {
			try {
				// Construct Date object from params
				// assuming params.date is YYYY-MM-DD or ISO and params.time is HH:mm
				const datePart = params.date.split('T')[0];
				const timePart = params.time;
				const classDateTimeStr = `${datePart}T${timePart}:00`;
				const classDate = new Date(classDateTimeStr);
				const now = new Date();

				// Check invalid date
				if (!isNaN(classDate.getTime())) {
					const diffMs = classDate.getTime() - now.getTime();
					const diffMinutes = diffMs / (1000 * 60);

					if (diffMinutes < 0) {
						showToast(
							'warning',
							t('common.attention'),
							t('enrollClient.warning.classPast'),
						);
					} else if (diffMinutes < 30) {
						showToast(
							'warning',
							t('common.attention'),
							t('enrollClient.warning.classStartingSoon'),
						);
					}
				}
			} catch {
				// Ignore date parsing errors
			}
		}

		setLoading(true);
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;

			await vitalFitApi.booking.bookClass({ user_id: userData.user_id }, params.id, token);
			setEmail(''); // Clear email on success
			setShowSuccessModal(true);
		} catch (error) {
			let errorMsg = t('enrollClient.error.enrollFailed') || 'Error de servidor';
			let errorType: 'error' | 'warning' = 'error';

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const apiError = error as any;

			// Try to map server messages to translations
			let serverMessage = '';
			if (apiError.messages && Array.isArray(apiError.messages)) {
				serverMessage = apiError.messages.join(', ');
			} else if (apiError.message) {
				serverMessage = apiError.message;
			}

			if (
				serverMessage.toLowerCase().includes('limit') ||
				serverMessage.toLowerCase().includes('capacity') ||
				serverMessage.toLowerCase().includes('full')
			) {
				errorMsg = t('enrollClient.error.classFull');
				errorType = 'warning';
			} else if (
				serverMessage.toLowerCase().includes('already') ||
				serverMessage.toLowerCase().includes('exist')
			) {
				errorMsg = t('enrollClient.error.alreadyEnrolled');
				errorType = 'warning';
			} else if (serverMessage) {
				errorMsg = serverMessage;
			}

			showToast(errorType, t('common.error.unexpected'), errorMsg);
			setEmail(''); // Clear email on failure as well
		} finally {
			setLoading(false);
		}
	};

	const handleSuccessClose = () => {
		setShowSuccessModal(false);
		const queryParams = new URLSearchParams({
			id: params.id || '',
			name: params.name || '',
			date: params.date || '',
			time: params.time || '',
			capacity: params.capacity || '',
			enrolled: params.enrolled || '',
			status: params.status || '',
			instructor: params.instructor || '',
			instructorImage: params.instructorImage || '',
			serviceImage: params.serviceImage || '',
			description: params.description || '',
			notes: params.notes || '',
		});
		router.replace(`/(recepcionist)/class-details?${queryParams.toString()}`);
	};

	useFocusEffect(
		useCallback(() => {
			const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
			return () => subscription.remove();
		}, [handleBackPress]),
	);

	return (
		<ThemedView style={styles.container}>
			<ToastNotification
				visible={toastState.visible}
				type={toastState.type}
				title={toastState.title}
				message={toastState.message}
				onClose={hideToast}
			/>
			<View style={styles.header}>
				<Image
					source={require('@/assets/images/Frame.png')}
					style={styles.logo}
					resizeMode='contain'
				/>
			</View>

			<View style={styles.content}>
				<ThemedText className='font-heading' style={styles.title}>
					{t('enrollClient.title')}
				</ThemedText>

				<View style={styles.classInfoCard}>
					<ThemedText className='font-heading' style={styles.classTitle}>
						{className}
					</ThemedText>
					<ThemedText className='font-body' style={styles.classDetails}>
						{params.date || t('enrollClient.placeholders.date')} •{' '}
						{params.time || t('enrollClient.placeholders.time')}
					</ThemedText>
				</View>

				<View style={styles.form}>
					{step === 1 ? (
						<>
							<View style={styles.inputGroup}>
								<ThemedText className='font-body' style={styles.label}>
									{t('common.email') || 'Correo electrónico'}
								</ThemedText>
								<TextInput
									style={styles.input}
									value={email}
									onChangeText={setEmail}
									placeholder={
										t('enrollClient.form.emailPlaceholder') ||
										'ejemplo@correo.com'
									}
									placeholderTextColor='#9CA3AF'
									autoCapitalize='none'
									keyboardType='email-address'
								/>
							</View>

							<TouchableOpacity
								style={styles.enrollButton}
								onPress={handleSearchUser}
								activeOpacity={0.8}
								disabled={loading}>
								{loading ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<ThemedText
										className='font-body'
										style={styles.enrollButtonText}>
										{t('common.search') || 'Buscar'}
									</ThemedText>
								)}
							</TouchableOpacity>
						</>
					) : (
						<>
							<View style={styles.userCard}>
								<View style={styles.userInfoContainer}>
									<UserAvatar
										name={`${userData?.first_name} ${userData?.last_name}`}
										imageUrl={userData?.profile_picture_url}
										size={60}
									/>
									<View style={{ marginLeft: 16, flex: 1 }}>
										<ThemedText
											className='font-heading'
											style={styles.userName}>
											{userData?.first_name} {userData?.last_name}
										</ThemedText>
										<ThemedText className='font-body' style={styles.userEmail}>
											{userData?.email}
										</ThemedText>
									</View>
								</View>

								<TouchableOpacity
									style={styles.changeUserButton}
									onPress={() => {
										setStep(1);
										setUserData(null);
									}}>
									<XMarkIcon size={16} color='#6B7280' />
									<ThemedText style={styles.changeUserText}>
										{t('common.cancel') || 'Cancelar'}
									</ThemedText>
								</TouchableOpacity>
							</View>

							<TouchableOpacity
								style={[styles.enrollButton, { marginTop: 16 }]}
								onPress={handleEnroll}
								activeOpacity={0.8}
								disabled={loading}>
								{loading ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<ThemedText
										className='font-body'
										style={styles.enrollButtonText}>
										{t('enrollClient.button')}
									</ThemedText>
								)}
							</TouchableOpacity>
						</>
					)}
				</View>
			</View>

			<Modal
				animationType='fade'
				transparent={true}
				visible={showSuccessModal}
				onRequestClose={handleSuccessClose}>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={handleSuccessClose}>
					<View style={styles.successModal}>
						<View style={styles.successIcon}>
							<CheckCircleIcon size={60} color='#10B981' />
						</View>

						<ThemedText className='font-heading' style={styles.successTitle}>
							{t('enrollClient.success.title') || t('common.success')}
						</ThemedText>
						<ThemedText className='font-body' style={styles.successMessage}>
							{t('enrollClient.success.message')}
						</ThemedText>
						<ThemedText className='font-body' style={styles.className}>
							{className}
						</ThemedText>
					</View>
				</TouchableOpacity>
			</Modal>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
	},
	header: {
		alignItems: 'center',
		paddingTop: 60,
		paddingBottom: 20,
	},
	logo: {
		width: 150,
		height: 50,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 24,
		textAlign: 'center',
	},
	classInfoCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 20,
		marginBottom: 32,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	classTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	classDetails: {
		fontSize: 14,
		color: '#6B7280',
	},
	form: {
		flex: 1,
	},
	inputGroup: {
		marginBottom: 24,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		color: '#111827',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 16,
		color: '#111827',
	},
	enrollButton: {
		backgroundColor: '#F97316',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 32,
		marginBottom: 48,
		shadowColor: '#F97316',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 4,
	},
	enrollButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	// Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 40,
	},
	successModal: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 32,
		alignItems: 'center',
		width: '100%',
		maxWidth: 320,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.25,
		shadowRadius: 20,
		elevation: 10,
	},
	successIcon: {
		marginBottom: 20,
	},
	successTitle: {
		fontSize: 24,
		fontWeight: '700',
		color: '#10B981',
		marginBottom: 12,
		textAlign: 'center',
	},
	successMessage: {
		fontSize: 16,
		fontWeight: '500',
		color: '#111827',
		marginBottom: 8,
		textAlign: 'center',
	},
	className: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 24,
		textAlign: 'center',
	},
	// New Styles
	userCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 20,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		alignItems: 'center',
		marginBottom: 20,
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		width: '100%',
	},
	userName: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
	},
	userEmail: {
		fontSize: 14,
		color: '#6B7280',
	},
	changeUserButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 8,
		backgroundColor: '#F3F4F6',
		borderRadius: 8,
		alignSelf: 'flex-start',
	},
	changeUserText: {
		fontSize: 12,
		color: '#4B5563',
		marginLeft: 4,
		fontWeight: '500',
	},
});
