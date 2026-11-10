
import vitalFitApi from '@/services';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface Props {
	visible: boolean;
	onClose: () => void;
	token: string; 
	userName: string;
}

export const QRModal: React.FC<Props> = ({ visible, onClose, token, userName }) => {
	const { t } = useTranslation();
	const [qrValue, setQrValue] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const [remainingSeconds, setRemainingSeconds] = useState<number>(120);

	const formatTime = (secs: number) => {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	};

	const fetchQrToken = React.useCallback(async () => {
		try {
			setLoading(true);
			console.log('Solicitando Token QR con Auth Token length:', token?.length);
			const response = await vitalFitApi.user.QrToken(token);
			if (response?.token) {
				console.log('Token QR Recibido:', response.token);
				console.log('Longitud del Token QR:', response.token.length);
				setQrValue(response.token);
				setError(null);
				setRemainingSeconds(30);
			} else {
				console.warn('Respuesta QrToken sin token:', response);
				setQrValue(null);
				setError(t('qr.errorGenerating'));
			}
		} catch (error) {
			console.error("Error generando QR:", error);
			setQrValue(null);
			setError(t('qr.errorGenerating'));
		} finally {
			setLoading(false);
		}
	}, [token, t]);
	useEffect(() => {
		if (visible && token) {
			fetchQrToken();
		}
	}, [visible, token, fetchQrToken]);

	useEffect(() => {
		if (!visible) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		// Tick every second to update UI countdown. When it hits 0, refresh the QR and reset.
		intervalRef.current = setInterval(() => {
			setRemainingSeconds((prev) => {
				if (prev <= 1) {
					fetchQrToken();
					return 30;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [visible, fetchQrToken, t]);

	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={visible}
			onRequestClose={onClose}
		>
			<View style={styles.centeredView}>
				<View style={styles.modalView}>

					<View style={styles.header}>
						<Text className='font-heading' style={styles.modalTitle}>{t('qr.title')}</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Ionicons name="close" size={24} color="#6B7280" />
						</TouchableOpacity>
					</View>

					<Text className='font-heading' style={styles.userName}>{userName}</Text>
					<Text className='font-body' style={styles.instruction}>
						{t('qr.instruction')}
					</Text>

					<View style={styles.qrContainer}>
						{loading ? (
							<ActivityIndicator size="large" color="#F27F2A" />
						) : qrValue ? (
							<QRCode
								value={qrValue}
								size={200}
								color="black"
								backgroundColor="white"
							/>
						) : (
							<Text className='font-body' style={{ color: 'red' }}>{error ?? t('qr.loadFailed')}</Text>
						)}
					</View>

					{!loading && (
						<Text className='font-body' style={styles.timerText}>{t('qr.expiresIn', { time: formatTime(remainingSeconds) })}</Text>
					)}

					{!loading && (
						<TouchableOpacity onPress={() => { fetchQrToken(); setRemainingSeconds(120); }} style={styles.refreshButton}>
							<Ionicons name="refresh" size={20} color="#F27F2A" />
							<Text className='font-body' style={styles.refreshText}>{t('qr.refresh')}</Text>
						</TouchableOpacity>
					)}

				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)', 
	},
	modalView: {
		width: '85%',
		backgroundColor: 'white',
		borderRadius: 20,
		padding: 24,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	header: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#111827',
	},
	closeButton: {
		padding: 4,
	},
	userName: {
		fontSize: 20,
		fontWeight: '600',
		color: '#F27F2A', 
		marginBottom: 8,
	},
	instruction: {
		fontSize: 14,
		color: '#6B7280',
		textAlign: 'center',
		marginBottom: 24,
	},
	qrContainer: {
		padding: 16,
		backgroundColor: 'white',
		borderRadius: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
		marginBottom: 20,
	},
	refreshButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
	},
	refreshText: {
		color: '#F27F2A',
		fontWeight: '600',
		marginLeft: 8,
	},
	timerText: {
		fontSize: 12,
		color: '#6B7280',
		marginBottom: 8,
	},
});
