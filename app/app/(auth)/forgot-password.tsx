import { Logo } from '@/components/auth/Logo';
import { CodeInput } from '@/components/CodeInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StyledTextInput } from '@/components/StyledTextInput';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { Colors } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { ForgotPasswordSchema, type ForgotPasswordData } from '@/schemas/forgot-password';
import vitalFitApi from '@/services';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAPIError } from '@vitalfit/sdk';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SlidersVertical } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ForgotPasswordScreen() {
	const { t } = useTranslation();
	const [step, setStep] = useState<number>(1);
	const [email, setEmail] = useState<string>('');
	const [token, setToken] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { toastState, showToast, hideToast } = useToast();
	const router = useRouter();
	const params = useLocalSearchParams();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordData>({
		resolver: zodResolver(ForgotPasswordSchema),
		defaultValues: {
			password: '',
			confirmPassword: '',
		},
	});

	const handleCancel = () => {
		if (params.from === 'settings') {
			router.back();
		} else {
			router.push('/(auth)/login');
		}
	};

	const handleSendEmail = async (): Promise<void> => {
		if (!email) {
			showToast(
				'error',
				t('forgotPassword.step1.toast.errorTitle'),
				t('login.toast.emptyFields'),
			);
			return;
		}

		setIsLoading(true);
		try {
			await vitalFitApi.auth.forgotPassword(email);
		} catch (error: unknown) {
			if (isAPIError(error)) {
				const msg = error.messages.join(', ').toLowerCase();
				if (
					msg.includes('not found') ||
					msg.includes('no existe') ||
					msg.includes('email') ||
					msg.includes('usuario') ||
					msg.includes('does not exist')
				) {
					// Ignorar
				} else {
					console.error('Error real al enviar correo:', error);
					showToast(
						'error',
						t('forgotPassword.step1.toast.errorTitle'),
						t('login.toast.unexpectedError'),
					);
					setIsLoading(false);
					return;
				}
			} else if (error instanceof Error) {
				console.error('Error inesperado al enviar correo:', error);
				showToast(
					'error',
					t('forgotPassword.step1.toast.errorTitle'),
					t('login.toast.unexpectedError'),
				);
				setIsLoading(false);
				return;
			}
		}

		showToast(
			'success',
			t('forgotPassword.step1.toast.successTitle'),
			t('forgotPassword.step1.toast.successMessage'),
		);
		setStep(2);
		setIsLoading(false);
	};

	const handleValidateToken = async (code: string): Promise<void> => {
		setIsLoading(true);
		try {
			await vitalFitApi.auth.validateResetToken(code);
			setToken(code);
			setStep(3);
		} catch (error: unknown) {
			let errorMessage = t('forgotPassword.step2.toast.errorMessage');
			if (isAPIError(error)) {
				errorMessage = error.messages.join(', ');
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			console.error('Error al validar el código:', error);
			showToast('error', t('forgotPassword.step2.toast.errorTitle'), errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async (data: ForgotPasswordData): Promise<void> => {
		setIsLoading(true);
		try {
			if (!token) {
				showToast('error', t('forgotPassword.step3.toast.errorTitle'), 'Token not found');
				setIsLoading(false);
				return;
			}

			await vitalFitApi.client.post({
				url: '/auth/password/reset',
				data: {
					token: token,
					password: data.password,
					confirm_password: data.confirmPassword,
				},
			});

			showToast(
				'success',
				t('forgotPassword.step3.toast.successTitle'),
				t('forgotPassword.step3.toast.successMessage'),
			);

			setTimeout(() => {
				router.push('/(auth)/login');
			}, 2000);
		} catch (error: unknown) {
			let errorMessage = t('forgotPassword.step3.toast.errorMessage');
			if (isAPIError(error)) {
				errorMessage = error.messages.join(', ');
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			console.error('Error al restablecer contraseña:', error);
			showToast('error', t('forgotPassword.step3.toast.errorTitle'), errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<KeyboardAvoidingView
				style={{ flex: 1, width: '100%', alignItems: 'center' }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
				<ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
					<View style={styles.formContainer}>
						<Logo />

						<ThemedText
							type='title'
							lightColor={Colors.light.tint}
							style={styles.title}>
							{t(`forgotPassword.titles.step${step}`)}
						</ThemedText>
						<Text className='font-body mb-8 text-center text-lg text-gray-500'>
							{t(`forgotPassword.subtitles.step${step}`)}
						</Text>

						<ProgressIndicator currentStep={step} />

						{step === 1 && (
							<>
								<StyledTextInput
									label={t('forgotPassword.step1.emailLabel')}
									placeholder={t('forgotPassword.step1.emailPlaceholder')}
									keyboardType='email-address'
									value={email}
									onChangeText={setEmail}
								/>
								<PrimaryButton
									title={
										isLoading
											? t('forgotPassword.step1.sendingCodeButton')
											: t('forgotPassword.step1.sendCodeButton')
									}
									onPress={handleSendEmail}
									disabled={isLoading}
								/>
								<SecondaryButton
									title={t('forgotPassword.step1.cancelButton')}
									onPress={handleCancel}
									style={{ marginTop: 12 }}
								/>
							</>
						)}

						{step === 2 && (
							<>
								<CodeInput onComplete={handleValidateToken} />
								<SecondaryButton
									title={t('forgotPassword.step2.cancelButton')}
									onPress={handleCancel}
									style={{ marginTop: 12 }}
								/>
							</>
						)}

						{step === 3 && (
							<>
								<Controller
									control={control}
									name='password'
									render={({ field: { onChange, onBlur, value } }) => (
										<StyledTextInput
											label={t('forgotPassword.step3.passwordLabel')}
											isPasswordInput
											icon={
												<SlidersVertical
													size={16}
													color={Colors.light.icon}
												/>
											}
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											error={errors.password?.message}
											placeholder={t(
												'forgotPassword.step3.passwordPlaceholder',
											)}
										/>
									)}
								/>
								<Controller
									control={control}
									name='confirmPassword'
									render={({ field: { onChange, onBlur, value } }) => (
										<StyledTextInput
											label={t('forgotPassword.step3.confirmPasswordLabel')}
											isPasswordInput
											icon={
												<SlidersVertical
													size={16}
													color={Colors.light.icon}
												/>
											}
											value={value}
											onBlur={onBlur}
											onChangeText={onChange}
											error={errors.confirmPassword?.message}
											placeholder={t(
												'forgotPassword.step3.confirmPasswordPlaceholder',
											)}
										/>
									)}
								/>
								<PrimaryButton
									title={
										isLoading
											? t('forgotPassword.step3.savingButton')
											: t('forgotPassword.step3.saveButton')
									}
									onPress={handleSubmit(handleResetPassword)}
									disabled={isLoading}
								/>
								<SecondaryButton
									title={t('forgotPassword.step3.cancelButton')}
									onPress={handleCancel}
									style={{ marginTop: 12 }}
								/>
							</>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			<ToastNotification
				visible={toastState.visible}
				type={toastState.type}
				title={toastState.title}
				message={toastState.message}
				onClose={hideToast}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', paddingTop: 80, backgroundColor: 'white' },
	scrollView: {
		width: '100%',
	},
	scrollContent: {
		flexGrow: 1,
		alignItems: 'center',
		paddingTop: 0,
		paddingBottom: 40,
	},
	formContainer: {
		width: '100%',
		maxWidth: 384,
		paddingHorizontal: 24,
		alignItems: 'center',
		gap: 16,
	},
	title: { fontSize: 28, textAlign: 'center' },
});
