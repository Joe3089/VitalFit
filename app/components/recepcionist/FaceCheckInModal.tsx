import { ThemedView } from '@/components/themed-view';
import { checkInWithFace } from '@/services/faceAuthService';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
	visible: boolean;
	onClose: () => void;
	onSuccess: (userName: string, serviceName: string) => void;
	onError: (error: string) => void;
	branchId: string | null;
}

export const FaceCheckInModal: React.FC<Props> = ({ visible, onClose, onSuccess, onError, branchId }) => {
	const { t } = useTranslation();
	const [permission, requestPermission] = useCameraPermissions();
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);
	const cameraRef = useRef<CameraView>(null);

	const handleCapture = async () => {
		if (!cameraRef.current) return;

		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.8,
			});
			if (photo?.uri) {
				setCapturedImage(photo.uri);
			}
		} catch {
			onError(t('faceCheckIn.errors.captureFailed'));
		}
	};

	const handleRetake = () => {
		setCapturedImage(null);
	};

	const handleConfirm = async () => {
		if (!capturedImage || !branchId) {
			onError(t('checkIn.error.selectBranch'));
			return;
		}

		setProcessing(true);
		try {
			const response = await checkInWithFace(capturedImage, branchId);
			setCapturedImage(null);

			let userName = t('dashboard.defaultUser');

			// If we have user_id in response, fetch full user details
			if (response.user_id) {
				try {
					const vitalFitApi = (await import('@/services')).default;
					const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
					const token = await AsyncStorage.getItem('token');

					if (token) {
						const userResponse = await vitalFitApi.user.GetUserByID(response.user_id, token);
						const userData = userResponse.data;

						if (userData?.first_name) {
							userName = `${userData.first_name} ${userData.last_name || ''}`.trim();
						}
						console.log('[FaceCheckIn] User details fetched:', userName);
					}
				} catch (error) {
					console.error('[FaceCheckIn] Error fetching user details:', error);
					// Fallback to data from response
					if (response.user?.first_name) {
						userName = `${response.user.first_name} ${response.user.last_name || ''}`.trim();
					}
				}
			} else if (response.user?.first_name) {
				userName = `${response.user.first_name} ${response.user.last_name || ''}`.trim();
			}

			// Pass message only, not service_name
			onSuccess(userName, response.message || t('checkIn.successMessage'));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t('faceCheckIn.errors.checkInFailed');
			onError(errorMessage);
		} finally {
			setProcessing(false);
		}
	};

	const handleClose = () => {
		setCapturedImage(null);
		setProcessing(false);
		onClose();
	};

	if (!permission) {
		return <View />;
	}

	if (!permission.granted) {
		return (
			<Modal visible={visible} animationType="slide" transparent>
				<ThemedView style={styles.container}>
					<Text className='font-body' style={styles.message}>{t('faceCheckIn.permission.message')}</Text>
					<TouchableOpacity onPress={requestPermission} style={styles.button}>
						<Text className='font-body' style={styles.buttonText}>{t('faceCheckIn.permission.button')}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleClose} style={styles.closeButtonText}>
						<Text className='font-body' style={{ color: 'white', marginTop: 20 }}>{t('common.cancel')}</Text>
					</TouchableOpacity>
				</ThemedView>
			</Modal>
		);
	}

	// Preview state - show captured image
	if (capturedImage) {
		return (
			<Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
				<View style={styles.container}>
					<Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFillObject} />

					{processing && (
						<View style={styles.uploadingOverlay}>
							<ActivityIndicator size="large" color="#F27F2A" />
							<Text className='font-body' style={styles.uploadingText}>{t('faceCheckIn.modal.processing')}</Text>
						</View>
					)}

					<TouchableOpacity style={styles.closeIcon} onPress={handleClose} disabled={processing}>
						<Ionicons name="close-circle" size={50} color="white" />
					</TouchableOpacity>

					{!processing && (
						<View style={styles.previewButtonsContainer}>
							<TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
								<Text className='font-body' style={styles.retakeButtonText}>{t('faceCheckIn.modal.retake')}</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
								<Text className='font-body' style={styles.confirmButtonText}>{t('faceCheckIn.modal.confirm')}</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</Modal>
		);
	}

	// Camera state
	return (
		<Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
			<View style={styles.container}>
				<CameraView
					ref={cameraRef}
					style={StyleSheet.absoluteFillObject}
					facing="back"
				/>

				<View style={styles.overlay}>
					<View style={styles.unfocusedContainer}></View>
					<View style={styles.middleContainer}>
						<View style={styles.unfocusedContainer}></View>
						<View style={styles.focusedContainer}>
							<View style={styles.ovalFrame} />
						</View>
						<View style={styles.unfocusedContainer}></View>
					</View>
					<View style={styles.unfocusedContainer}></View>
				</View>

				<TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
					<Ionicons name="close-circle" size={50} color="white" />
				</TouchableOpacity>

				<View style={styles.instructionContainer}>
					<Text className='font-body' style={styles.instructionText}>
						{t('faceCheckIn.modal.instruction')}
					</Text>
				</View>

				<View style={styles.captureButtonContainer}>
					<TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
						<View style={styles.captureButtonInner} />
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
	message: { textAlign: 'center', paddingBottom: 10, color: 'white', marginHorizontal: 20 },
	button: { backgroundColor: '#F27F2A', padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 20 },
	buttonText: { color: 'white', fontWeight: 'bold' },
	closeButtonText: { alignItems: 'center' },
	overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
	unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
	middleContainer: { flexDirection: 'row', flex: 2 },
	focusedContainer: { flex: 6, justifyContent: 'center', alignItems: 'center' },
	ovalFrame: {
		width: 250,
		height: 320,
		borderWidth: 3,
		borderColor: '#F27F2A',
		borderRadius: 125,
		backgroundColor: 'transparent',
	},
	closeIcon: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
	instructionContainer: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center' },
	instructionText: {
		color: 'white',
		fontSize: 18,
		fontWeight: '600',
		backgroundColor: 'rgba(0,0,0,0.5)',
		padding: 10,
		borderRadius: 8,
	},
	captureButtonContainer: {
		position: 'absolute',
		bottom: 80,
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	captureButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(255,255,255,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 4,
		borderColor: 'white',
	},
	captureButtonInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: 'white',
	},
	previewButtonsContainer: {
		position: 'absolute',
		bottom: 80,
		left: 20,
		right: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	retakeButton: {
		flex: 1,
		marginRight: 10,
		paddingVertical: 15,
		borderRadius: 10,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'white',
	},
	retakeButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
	confirmButton: {
		flex: 1,
		marginLeft: 10,
		paddingVertical: 15,
		borderRadius: 10,
		backgroundColor: '#F27F2A',
		alignItems: 'center',
	},
	confirmButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
	uploadingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.7)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	uploadingText: { color: 'white', fontSize: 16, marginTop: 15, fontWeight: '500' },
});
