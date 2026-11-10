import { PrimaryButton } from '@/components/PrimaryButton';
import { StyledTextInput } from '@/components/StyledTextInput';
import { ThemedText } from '@/components/themed-text';
import { ToastNotification } from '@/components/ToastNotification';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ExclamationTriangleIcon } from 'react-native-heroicons/outline';
import PhoneInput, { IPhoneInputRef } from 'react-native-international-phone-number';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MembershipPaymentDetailScreen() {
	const { t } = useTranslation();
	const router = useRouter();

	const params = useLocalSearchParams<{
		invoiceId: string;
		totalAmount: string;
		methodId: string;
		methodName: string;
		currency: string;
	}>();

	const [loading, setLoading] = useState(false);
	const [loadingConfig, setLoadingConfig] = useState(true);
	const [paymentConfig, setPaymentConfig] = useState<Record<string, unknown> | null>(null);

	// Form Fields
	const [reference, setReference] = useState('');
	const [documentNumber, setDocumentNumber] = useState(''); // Used for PagoMovil
	const [phone, setPhone] = useState(''); // Used for PagoMovil
	const [senderName, setSenderName] = useState(''); // Used for Transfer/Zelle/Cash

	const phoneInputRef = useRef<IPhoneInputRef | null>(null);
	const { toastState, showToast, hideToast } = useToast();
	const currencySymbol = params.currency === 'EUR' ? '€' : params.currency === 'VES' ? 'Bs' : '$';

	React.useEffect(() => {
		const fetchConfig = async () => {
			try {
				// Use the client directly to ensure we hit the correct endpoint
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const response = await vitalFitApi.client.get({
					url: `/billing/payment-methods/${params.methodId}`,
				});

				const responseData = response.data || response;
				if (responseData && responseData.configuration) {
					setPaymentConfig(responseData.configuration);
				} else if (responseData && responseData.data && responseData.data.configuration) {
					setPaymentConfig(responseData.data.configuration);
				}
			} catch (error) {
				console.error('Error fetching payment config:', error);
				showToast('error', t('common.error.title'), t('common.error.text'));
			} finally {
				setLoadingConfig(false);
			}
		};
		if (params.methodId) {
			fetchConfig();
		} else {
			setLoadingConfig(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params.methodId]);

	const handleProcessPayment = async () => {
		// Validate based on payment type
		const isReferenceRequired = !isCashOrPoint;

		if (
			isReferenceRequired &&
			(!reference ||
				(isPagoMovil && !documentNumber) ||
				(isPagoMovil && !phone) ||
				((isTransfer || isZelle) && !senderName))
		) {
			showToast('warning', t('common.attention'), t('payment.toast.incompleteFields'));
			return;
		}

		if (isReferenceRequired && reference.length < 4) {
			showToast('warning', t('common.attention'), t('payment.toast.invalidReference'));
			return;
		}

		setLoading(true);
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) throw new Error(t('errors.sessionExpired'));

			let receiptUrl = t('payment.defaultReceiptHelper');
			if (isPagoMovil) receiptUrl = `CI: ${documentNumber} - Tlf: ${phone}`;
			if (isTransfer || isZelle)
				receiptUrl = `${t('payment.transfer.holderPrefix')}${senderName}`;
			if (isCashOrPoint) receiptUrl = t('payment.cashReceiptHelper');

			await vitalFitApi.billing.AddPaymentToInvoice(
				{
					invoice_id: params.invoiceId,
					payment_method_id: params.methodId,
					amount_paid: Number(params.totalAmount),
					currency_paid: params.currency || 'USD',
					transaction_id: reference || `SITIO-${Date.now()}`,
					receipt_url: receiptUrl,
				},
				token,
			);

			showToast(
				'success',
				t('payment.toast.paymentReported'),
				t('payment.toast.sentToVerification'),
			);

			setTimeout(() => {
				router.replace('/(tabs)/dashboard');
			}, 2500);
		} catch (error) {
			console.error(error);
			const msg = error instanceof Error ? error.message : t('common.error.unknown');
			showToast(
				'error',
				t('payment.toast.errorPayment'),
				`${t('common.error.unableToRegister')}: ${msg}`,
			);
		} finally {
			setLoading(false);
		}
	};

	// Determine Payment Type Helpers
	// Normalize string to handle accents (Móvil -> Movil)
	const normalizedName = (params.methodName || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');

	const isZelle = (paymentConfig && paymentConfig.email) || normalizedName.includes('zelle');

	const isPagoMovil =
		(paymentConfig && (paymentConfig.phone || paymentConfig.phone_number)) ||
		normalizedName.includes('pago movil') ||
		normalizedName.includes('mobile');

	// Transfer is usually default if account number exists and not zelle/pagomovil
	const isTransfer =
		!isZelle &&
		!isPagoMovil &&
		((paymentConfig && (paymentConfig.account_number || paymentConfig.number)) ||
			normalizedName.includes('transfer') ||
			normalizedName.includes('banco') ||
			normalizedName.includes('bank'));

	const isCashOrPoint = !isZelle && !isPagoMovil && !isTransfer; // Fallback for Cash, POS, etc.

	return (
		<SafeAreaView className='flex-1 bg-white'>
			<Stack.Screen options={{ headerShown: false }} />
			<ToastNotification
				visible={toastState.visible}
				type={toastState.type}
				title={toastState.title}
				message={toastState.message}
				onClose={hideToast}
			/>

			<ScrollView className='flex-1 px-6 pb-32 pt-6'>
				<View className='mb-8 items-center'>
					<ThemedText
						className='mb-2 text-center font-heading text-3xl font-bold'
						style={{ fontFamily: 'BebasNeue-Regular' }}>
						{t('payment.method.title')}
					</ThemedText>
					<ThemedText
						className='text-center font-body text-gray-500'
						style={{ fontFamily: 'Montserrat_400Regular' }}>
						{params.methodName}
					</ThemedText>
				</View>

				{/* Bank Details Card */}
				{loadingConfig ? (
					<ActivityIndicator size='large' color='#f97316' className='mb-6' />
				) : (
					<View className='mb-6 rounded-2xl border border-orange-500/80 bg-orange-50 px-4 py-4'>
						<ThemedText
							className='mb-3 font-body text-xs font-bold uppercase tracking-widest text-orange-800'
							style={{ fontFamily: 'Montserrat_700Bold' }}>
							{t('payment.mobile.bankDetailsTitle')}
						</ThemedText>

						<View className='space-y-3'>
							{/* Dynamic Configuration Rendering */}
							{paymentConfig && Object.keys(paymentConfig).length > 0 ? (
								Object.entries(paymentConfig).map(([key, value], index) => {
									// Skip empty values or internal keys if necessary, but user asked for ALL info.
									// We'll format the key to look like a label.
									const label = key
										.replace(/_/g, ' ')
										.replace(/\b\w/g, (c) => c.toUpperCase());

									return (
										<View
											key={key}
											className={`flex-row justify-between ${index < Object.keys(paymentConfig).length - 1 ? 'border-b border-orange-200 pb-2' : 'pt-1'}`}>
											<ThemedText
												className='font-body text-sm capitalize text-gray-600'
												style={{ fontFamily: 'Montserrat_400Regular' }}>
												{/* Try to translate known keys, else fallback to formatted key */}
												{t(`payment.labels.${key}`, {
													defaultValue: label,
												})}
											</ThemedText>
											<ThemedText
												className='ml-4 flex-1 text-right font-body font-bold text-gray-900'
												style={{ fontFamily: 'Montserrat_700Bold' }}>
												{String(value || '-')}
											</ThemedText>
										</View>
									);
								})
							) : (
								<ThemedText
									className='text-center font-body italic text-gray-500'
									style={{ fontFamily: 'Montserrat_400Regular' }}>
									{t('payment.instructions.cash')}
								</ThemedText>
							)}
						</View>
					</View>
				)}

				{/* Total Card */}
				<View className='mb-8 flex-row items-center justify-between rounded-3xl border border-orange-100 bg-white p-6'>
					<View>
						<ThemedText
							className='mb-1 font-body text-xs font-bold uppercase tracking-widest text-orange-500'
							style={{ fontFamily: 'Montserrat_700Bold' }}>
							{t('payment.totalToPay')}
						</ThemedText>
						<ThemedText
							className='font-body font-bold text-neutral-900'
							style={{ fontFamily: 'Montserrat_700Bold' }}>
							{t('payment.transfer.order')} #{params.invoiceId?.slice(0, 8)}
						</ThemedText>
					</View>
					<View className='items-end'>
						<ThemedText
							className='font-heading text-4xl font-bold text-neutral-900'
							style={{ fontFamily: 'BebasNeue-Regular' }}>
							{currencySymbol}
							{parseFloat(params.totalAmount || '0').toFixed(2)}
						</ThemedText>
						<ThemedText
							className='font-body text-sm font-bold text-orange-500'
							style={{ fontFamily: 'Montserrat_700Bold' }}>
							{params.currency || 'USD'}
						</ThemedText>
					</View>
				</View>

				{/* Report Forms */}
				<View className='mb-8 space-y-4'>
					{isPagoMovil && (
						<View>
							<ThemedText
								className='mb-2 font-body text-sm font-medium text-gray-600'
								style={{ fontFamily: 'Montserrat_500Medium' }}>
								{t('payment.form.originPhone')}
							</ThemedText>
							<View className='overflow-hidden rounded-xl border border-gray-300 bg-white'>
								<PhoneInput
									ref={phoneInputRef}
									value={phone}
									onChangePhoneNumber={(ph) => setPhone(ph)}
									defaultCountry='VE'
									placeholder='0414 1234567'
									phoneInputStyles={{
										container: {
											backgroundColor: 'transparent',
											borderWidth: 0,
											height: 50,
										},
										flagContainer: { backgroundColor: 'transparent' },
										callingCode: { color: '#4b5563' },
										input: { color: '#111827' },
									}}
								/>
							</View>
						</View>
					)}

					{isPagoMovil && (
						<StyledTextInput
							label={t('payment.form.document')}
							placeholder='V-12345678'
							value={documentNumber}
							onChangeText={setDocumentNumber}
						/>
					)}

					{!isCashOrPoint && (
						<StyledTextInput
							label={t('payment.form.reference')}
							placeholder='Ej: 123456'
							value={reference}
							onChangeText={setReference}
							keyboardType='numeric'
						/>
					)}

					{(isTransfer || isZelle) && (
						<StyledTextInput
							label={t('payment.transfer.labels.holder')} // "Titular de la cuenta emisora"
							placeholder='Nombre y Apellido'
							value={senderName}
							onChangeText={setSenderName}
						/>
					)}
				</View>

				{/* Warning / Notes */}
				{!isCashOrPoint && (
					<View className='mb-8 flex-row items-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3'>
						<ExclamationTriangleIcon size={24} color='#3b82f6' />
						<View className='ml-3 flex-1'>
							<ThemedText
								className='mb-1 font-body text-xs font-bold text-blue-800'
								style={{ fontFamily: 'Montserrat_700Bold' }}>
								{t('payment.warning.verificationTitle')}
							</ThemedText>
							<ThemedText
								className='font-body text-xs text-blue-600'
								style={{ fontFamily: 'Montserrat_400Regular' }}>
								{t('payment.warning.verificationMessage')}
							</ThemedText>
						</View>
					</View>
				)}

				<View className='mb-10'>
					{loading ? (
						<ActivityIndicator size='large' color='#f97316' />
					) : (
						<PrimaryButton
							title={
								isCashOrPoint
									? t('payment.confirmOrder')
									: t('payment.reportPayment')
							}
							onPress={handleProcessPayment}
						/>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
