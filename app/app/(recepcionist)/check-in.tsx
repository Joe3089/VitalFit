import { ValidateCheckInCard } from '@/components/auth/dashboard/ValidateCheckInCard';
import { FaceCheckInModal } from '@/components/recepcionist/FaceCheckInModal';
import { QRScannerModal } from '@/components/recepcionist/QRScannerModal';
import { CheckInResultModal } from '@/components/recepcionista/CheckInResultModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Image, ScrollView, StyleSheet, View } from 'react-native';

export default function CheckInScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { selectedBranchId } = useBranch();
	const { toastState, showToast, hideToast } = useToast();
	const scrollViewRef = useRef<ScrollView>(null);
	const [scannerVisible, setScannerVisible] = useState(false);
	const [faceCheckInVisible, setFaceCheckInVisible] = useState(false);
	const [resultModalVisible, setResultModalVisible] = useState(false);
	const [checkInSuccess, setCheckInSuccess] = useState(false);
	const [checkInUserName, setCheckInUserName] = useState('');
	const [checkInMessage, setCheckInMessage] = useState('');

	useFocusEffect(
		useCallback(() => {
			setTimeout(() => {
				scrollViewRef.current?.scrollTo({ y: 0, animated: true });
			}, 100);
			const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
				router.replace('/(recepcionist)/dashboard');
				return true;
			});

			return () => backHandler.remove();
		}, [router]),
	);

	const handleValidateMembership = async (qrJwtLong: string) => {
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) return;
			if (!selectedBranchId) {
				Alert.alert(`${t('common.attention')}`, t('checkIn.error.selectBranch'));
				return;
			}
			const branchId = selectedBranchId;

			console.log('[QR Check-In] Sending request...', {
				qrJwtLong: qrJwtLong.substring(0, 20) + '...',
				branchId,
				tokenLength: token.length,
			});

			const checkInPayload = {
				qr_jwt: qrJwtLong,
				branch_id: branchId,
			};

			console.log('[QR Check-In] Full payload:', JSON.stringify(checkInPayload, null, 2));

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const response = await (vitalFitApi as any).access.checkIn(token, checkInPayload);

			const data = response.data || response;

			console.log('[Check-In] Respuesta completa:', JSON.stringify(data, null, 2));

			let userName = t('dashboard.defaultUser');

			// If we have user_id in response, fetch full user details
			if (data?.user_id) {
				try {
					const userResponse = await vitalFitApi.user.GetUserByID(data.user_id, token || '');
					const userData = userResponse.data;

					if (userData?.first_name) {
						userName = `${userData.first_name} ${userData.last_name || ''}`.trim();
					}
					console.log('[Check-In] User details fetched:', userName);
				} catch (error) {
					console.error('[Check-In] Error fetching user details:', error);
					// Fallback to data from response
					if (data?.user?.first_name) {
						userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
					}
				}
			} else if (data?.user?.first_name) {
				userName = `${data.user.first_name} ${data.user.last_name || ''}`.trim();
			} else if (data?.first_name) {
				userName = `${data.first_name} ${data.last_name || ''}`.trim();
			} else if (data?.name) {
				userName = data.name;
			}

			setCheckInSuccess(true);
			setCheckInUserName(userName);
			// Show only the message, not the service name
			setCheckInMessage(data.message || t('checkIn.successMessage'));
			setResultModalVisible(true);
			setScannerVisible(false);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error('[QR Check-In] Error occurred:', error);
			console.error('[QR Check-In] Error details:', {
				message: error?.message,
				messages: error?.messages,
				status: error?.status,
				name: error?.name,
				response: error?.response,
				data: error?.data,
			});

			// Log the full error object as JSON
			try {
				console.error('[QR Check-In] Full error JSON:', JSON.stringify(error, null, 2));
			} catch {
				console.error('[QR Check-In] Could not stringify error');
			}

			let errorMessage = t('checkIn.error.default');

			if (isAPIError(error)) {
				console.log('[QR Check-In] API Error detected - Status:', error.status);
				console.log('[QR Check-In] API Error messages:', error.messages);

				if (error.status === 402) {
					errorMessage = t('checkIn.error.paymentPending');
				} else if (error.status === 403) {
					errorMessage = t('checkIn.error.accessDenied');
					// Log additional context for 403 errors
					console.error('[QR Check-In] 403 Error - Access Denied. This might be a backend permission issue.');
				} else if (error.status === 401) {
					errorMessage = t('checkIn.error.qrExpired');
				} else {
					errorMessage = error.message || error.messages?.join(', ') || t('checkIn.error.default');
				}
			} else {
				errorMessage = error.message || t('common.error.connection');
			}

			console.log('[QR Check-In] Final error message to display:', errorMessage);

			setCheckInSuccess(false);
			setCheckInMessage(errorMessage);
			setResultModalVisible(true);
		}
	};

	const handleFaceCheckInPress = () => {
		if (!selectedBranchId) {
			Alert.alert(`${t('common.attention')}`, t('checkIn.error.selectBranch'));
			return;
		}
		setFaceCheckInVisible(true);
	};

	const handleFaceCheckInSuccess = (userName: string, serviceName: string) => {
		setCheckInSuccess(true);
		setCheckInUserName(userName);
		setCheckInMessage(serviceName);
		setFaceCheckInVisible(false);
		setResultModalVisible(true);
	};

	const handleFaceCheckInError = (errorMessage: string) => {
		setCheckInSuccess(false);
		setCheckInMessage(errorMessage);
		setFaceCheckInVisible(false);
		setResultModalVisible(true);
	};

	const handleEmailCheckInError = (errorMessage: string) => {
		showToast('error', t('checkIn.error.title'), errorMessage);
	};

	const handleEmailCheckIn = async (userId: string, userName: string) => {
		try {
			const token = await AsyncStorage.getItem('token');
			console.log('[CheckIn] Token retrieved:', token ? `${token.substring(0, 20)}... (length: ${token.length})` : 'null');

			if (!token) {
				showToast('error', t('checkIn.error.title'), t('common.error.sessionExpired'));
				return;
			}

			if (!selectedBranchId) {
				showToast('error', t('checkIn.error.title'), t('checkIn.error.selectBranch'));
				return;
			}

			console.log('[CheckIn] Processing email check-in...', {
				userId,
				branchId: selectedBranchId,
				tokenLength: token.length,
				tokenSegments: token.split('.').length
			});

			const checkInData = {
				user_id: userId,
				branch_id: selectedBranchId,
			};

			console.log('[CheckIn] Check-in data:', checkInData);

			// Use checkInManual for email-based check-ins (not QR code)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const response = await (vitalFitApi as any).access.checkInManual(token, checkInData);

			const data = response.data || response;

			console.log('[Email Check-In] Response:', JSON.stringify(data, null, 2));

			setCheckInSuccess(true);
			setCheckInUserName(userName);
			setCheckInMessage(data.service_name || t('checkIn.success.default'));
			setResultModalVisible(true);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error('[CheckIn] Error in email check-in:', error);
			console.error('[CheckIn] Error details:', {
				message: error?.message,
				status: error?.status,
				name: error?.name,
				stack: error?.stack
			});

			let errorMessage = t('checkIn.error.default');

			if (isAPIError(error)) {
				console.log('[CheckIn] API Error detected - Status:', error.status);
				if (error.status === 402) {
					errorMessage = t('checkIn.error.paymentPending');
				} else if (error.status === 403) {
					errorMessage = t('checkIn.error.accessDenied');
				} else if (error.status === 401) {
					// Check if it's a token issue
					if (error.message && error.message.includes('token')) {
						errorMessage = t('common.error.sessionExpired');
					} else {
						errorMessage = t('checkIn.error.unauthorized');
					}
				} else {
					errorMessage = error.message || t('checkIn.error.default');
				}
			} else if (error?.message) {
				errorMessage = error.message;
			} else {
				errorMessage = t('common.error.connection');
			}

			console.log('[CheckIn] Showing error:', errorMessage);
			showToast('error', t('checkIn.error.title'), errorMessage);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 100 }}>
				<View style={styles.header}>
					<Image
						source={require('@/assets/images/Frame.png')}
						style={styles.logo}
						resizeMode='contain'
					/>
					<ThemedText className='font-heading' style={styles.title}>
						{t('checkIn.title')}
					</ThemedText>
				</View>

				<View style={styles.cardWrapper}>
					<ValidateCheckInCard
						onScanPress={() => setScannerVisible(true)}
						onFaceScanPress={handleFaceCheckInPress}
						onEmailCheckIn={handleEmailCheckIn}
						onEmailCheckInError={handleEmailCheckInError}
						branchId={selectedBranchId ?? undefined}
					/>
				</View>
			</ScrollView>

			<ToastNotification
				visible={toastState.visible}
				type={toastState.type}
				title={toastState.title}
				message={toastState.message}
				onClose={hideToast}
			/>

			<QRScannerModal
				visible={scannerVisible}
				onClose={() => setScannerVisible(false)}
				onScan={handleValidateMembership}
			/>

			<FaceCheckInModal
				visible={faceCheckInVisible}
				onClose={() => setFaceCheckInVisible(false)}
				onSuccess={handleFaceCheckInSuccess}
				onError={handleFaceCheckInError}
				branchId={selectedBranchId}
			/>

			<CheckInResultModal
				visible={resultModalVisible}
				onClose={() => setResultModalVisible(false)}
				success={checkInSuccess}
				userName={checkInUserName}
				message={checkInMessage}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	header: {
		alignItems: 'center',
		paddingTop: 60,
		paddingBottom: 30,
	},
	logo: {
		width: 150,
		height: 50,
		marginBottom: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#1F2937',
	},
	cardWrapper: {
		marginHorizontal: 20,
		marginBottom: 16,
	},
});
