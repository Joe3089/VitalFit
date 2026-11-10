import { LogoSimple } from '@/components/auth/Logo';
import { SocialButton } from '@/components/auth/SocialButton';
import { LoadingModal } from '@/components/LoadingModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ToastNotification } from '@/components/ToastNotification';
import { Colors } from '@/constants/theme';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { useClerk, useAuth as useClerkAuth, useOAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import Checkbox from 'expo-checkbox';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, SlidersVertical } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
	const { toastState, showToast, hideToast } = useToast();
	const router = useRouter();
	const { fetchUser } = useUser();

	useEffect(() => {
		const onBackPress = () => {
			router.replace('/');
			return true;
		};

		const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

		return () => subscription.remove();
	}, [router]);
	const { t } = useTranslation();
	const { signOut } = useClerk();
	const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
	const { getToken } = useClerkAuth();
	const { login: authLogin } = useAuthContext();
	const [isChecked, setChecked] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	useEffect(() => {
		// Load stored email if exists
		const loadStoredEmail = async () => {
			try {
				const storedEmail = await AsyncStorage.getItem('lastEmail');
				if (storedEmail) {
					setEmail(storedEmail);
					setChecked(true);
				}
			} catch (error) {
				console.error('Error loading stored email:', error);
			}
		};
		loadStoredEmail();
	}, []);

	const handleLogin = useCallback(async () => {
		if (!email || !password) {
			showToast('error', t('login.toast.errorTitle'), t('login.toast.emptyFields'));
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			showToast('error', t('login.toast.errorTitle'), t('login.toast.invalidEmail'));
			return;
		}

		setIsLoading(true);

		try {
			// Get FCM device token before login
			let deviceToken: string | null = null;
			try {
				deviceToken = await registerForPushNotificationsAsync();
			} catch (tokenError) {
				console.warn('Could not get FCM token, continuing without it:', tokenError);
			}

			// Prepare login payload
			const loginPayload = {
				email,
				password,
				device_token: deviceToken || undefined,
			};

			// Use SDK's client.post directly because auth.login() strips device_token
			const response = await vitalFitApi.client.post({
				url: '/auth/login',
				data: loginPayload,
			});

			// Save or remove email based on checkbox
			if (isChecked) {
				await AsyncStorage.setItem('lastEmail', email);
			} else {
				await AsyncStorage.removeItem('lastEmail');
			}

			const token = response.token;
			const refreshToken = response.refresh_token;

			if (token && refreshToken) {
				// Use AuthContext to store tokens
				await authLogin(token, refreshToken);

				await fetchUser();

				await new Promise((resolve) => setTimeout(resolve, 300));

				const whoamiResponse = await vitalFitApi.user.WhoAmI(token);
				const role = whoamiResponse.user?.role?.name?.toLowerCase();

				if (role === 'instructor') {
					router.replace('/(instructor)/dashboard');
				} else if (role === 'recepcionist' || role === 'receptionist') {
					router.replace('/(recepcionist)/dashboard');
				} else {
					router.replace('/(tabs)/dashboard');
				}
			} else {
				console.warn('No se recibió token en la respuesta del SDK.');
			}
		} catch (error: unknown) {
			let errorMessage = t('login.toast.unexpectedError');
			const errorTitle = t('login.toast.loginErrorTitle');

			// Check specifically for account not found or unauthorized
			const errorString = JSON.stringify(error).toLowerCase();
			const messageString = error instanceof Error ? error.message.toLowerCase() : '';

			if (errorString.includes('not found') || messageString.includes('not found')) {
				errorMessage = t('login.toast.verifyData');
				// Use console.log to avoid yellow box
				console.log('Login error (handled): Account not found');
			} else if (
				errorString.includes('unauthorized') ||
				messageString.includes('unauthorized')
			) {
				errorMessage = t('login.toast.incorrectCredentials');
				// Use console.log to avoid yellow box
				console.log('Login error (handled): Unauthorized');
			} else {
				if (isAPIError(error)) {
					errorMessage = error.messages.join(', ');
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}
				// Log full error for other cases
				console.error(
					'Error en el login (detalle completo):',
					JSON.stringify(error, null, 2),
				);
			}

			showToast('error', errorTitle, errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [email, password, isChecked, showToast, t, authLogin, router, fetchUser, setIsLoading]);

	const handleGoogleSignIn = useCallback(async () => {
		setIsGoogleLoading(true);
		try {
			try {
				await signOut();
			} catch {
				console.log('No había sesión previa para cerrar');
			}

			const { createdSessionId, setActive } = await startOAuthFlow({
				redirectUrl: Linking.createURL('/(auth)/login', { scheme: 'vitalfit' }),
			});

			if (createdSessionId && setActive) {
				await setActive({ session: createdSessionId });

				await new Promise((resolve) => setTimeout(resolve, 1000));

				const clerkToken = await getToken({ template: 'vitalfit-backend' });

				if (clerkToken) {
					try {
						JSON.parse(atob(clerkToken.split('.')[1]));
					} catch (decodeError) {
						console.error('Error al decodificar JWT:', decodeError);
					}
					try {
						// Get FCM device token before OAuth login
						let deviceToken: string | null = null;
						try {
							deviceToken = await registerForPushNotificationsAsync();
						} catch (tokenError) {
							console.warn(
								'Could not get FCM token for OAuth, continuing without it:',
								tokenError,
							);
						}

						// Prepare OAuth login payload
						const oauthPayload = {
							session_token: clerkToken,
							device_token: deviceToken || undefined,
						};

						// Use SDK's client.post directly because auth.oAuthLogin() strips device_token
						const response = await vitalFitApi.client.post({
							url: '/auth/oauth-login',
							data: oauthPayload,
						});

						const backendToken = response.token;
						const backendRefreshToken = (response as { refresh_token?: string })
							.refresh_token;

						if (backendToken) {
							// Use AuthContext to store tokens
							await authLogin(backendToken, backendRefreshToken);
							// Store OAuth flag to indicate user signed in with Google
							await AsyncStorage.setItem('is_oauth_user', 'true');

							await fetchUser();

							await new Promise((resolve) => setTimeout(resolve, 1000));

							const savedToken = await AsyncStorage.getItem('token');
							if (savedToken) {
								const whoamiResponse = await vitalFitApi.user.WhoAmI(backendToken);
								const role = whoamiResponse.user?.role?.name?.toLowerCase();

								if (role === 'instructor') {
									router.replace('/(instructor)/dashboard');
								} else if (role === 'recepcionist' || role === 'receptionist') {
									router.replace('/(recepcionist)/dashboard');
								} else {
									router.replace('/(tabs)/dashboard');
								}
								showToast(
									'success',
									'¡Bienvenido!',
									'Iniciaste sesión con Google exitosamente',
								);
							} else {
								console.error(
									'El token no se guardó correctamente en AsyncStorage',
								);
								showToast('error', 'Error', 'No se pudo guardar la sesión');
							}
						}
					} catch (backendError: unknown) {
						console.error('Error al autenticar con el backend:', backendError);

						if (isAPIError(backendError)) {
							const errorMessages = backendError.messages.join(', ').toLowerCase();

							if (
								errorMessages.includes('usuario no encontrado') ||
								errorMessages.includes('not found') ||
								errorMessages.includes('unauthorized')
							) {
								console.log(
									'Usuario no registrado, redirigiendo al flujo de registro',
								);
								showToast(
									'success',
									'Cuenta no registrada',
									'Vamos a completar tu registro con Google',
								);
								router.replace('/(auth)/register?oauth=google');
							} else {
								showToast(
									'error',
									'Error de autenticación',
									backendError.messages.join(', '),
								);
							}
						} else if (
							backendError instanceof Error &&
							backendError.message?.includes('Usuario no encontrado')
						) {
							showToast(
								'success',
								'Cuenta no registrada',
								'Vamos a completar tu registro con Google',
							);
							router.replace('/(auth)/register?oauth=google');
						} else {
							showToast(
								'error',
								'Error de autenticación',
								'No se pudo iniciar sesión con Google',
							);
						}
					}
				} else {
					console.warn('No se pudo obtener el token de sesión con el template');
					showToast('error', 'Error', 'No se pudo obtener el token de Clerk');
				}
			}
		} catch (error: unknown) {
			console.error('Error en Google Sign-In:', error);

			if (error instanceof Error && error.message?.includes('already signed in')) {
				showToast('success', 'Ya has iniciado sesión', 'Redirigiendo al dashboard...');
				router.replace('/(tabs)/dashboard');
			} else {
				showToast(
					'error',
					'Error de autenticación',
					'No se pudo iniciar sesión con Google',
				);
			}
		} finally {
			setIsGoogleLoading(false);
		}
	}, [startOAuthFlow, getToken, signOut, router, showToast, fetchUser, authLogin]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
			<KeyboardAvoidingView
				style={{ flex: 1, backgroundColor: '#FFFFFF' }}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				<ToastNotification
					visible={toastState.visible}
					type={toastState.type}
					title={toastState.title}
					message={toastState.message}
					onClose={hideToast}
				/>
				<LoadingModal visible={isGoogleLoading} message='Autenticando con Google...' />
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<ScrollView
						contentContainerStyle={{
							flexGrow: 1,
							paddingHorizontal: 32,
							paddingTop: 8,
							paddingBottom: 16,
						}}
						keyboardShouldPersistTaps='handled'
						showsVerticalScrollIndicator={false}
						style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
						<TouchableOpacity
							onPress={() => router.replace('/')}
							className='absolute left-4 top-4 z-10 h-10 w-10 items-center justify-center'
							style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 }}>
							<ArrowLeft size={24} color='#000' />
						</TouchableOpacity>
						<View className='w-full max-w-sm self-center'>
							<View className='mb-1 mt-12 items-center'>
								<LogoSimple size={180} />
							</View>

							<Text className='mb-1 text-center font-heading text-3xl uppercase text-black'>
								{t('login.title')}
							</Text>

							<Text className='mb-4 text-center font-body text-base text-gray-500'>
								{t('login.subtitle')}
							</Text>

							<View className='mt-2 gap-3 px-2'>
								<View className='mb-2'>
									<Text className='mb-1 ml-1 text-sm font-bold text-black'>
										{t('login.emailLabel')}
									</Text>
									<TextInput
										placeholder={t('login.emailPlaceholder')}
										value={email}
										onChangeText={setEmail}
										keyboardType='email-address'
										autoCapitalize='none'
										style={{ height: 44 }}
										className='rounded-md border border-gray-300 px-4'
									/>
								</View>

								<View className='mb-2'>
									<View className='mb-1 ml-1 flex-row items-center'>
										<SlidersVertical
											size={16}
											color={Colors.light.text}
											className='mr-2'
										/>
										<Text className='text-sm font-bold text-black'>
											{t('login.passwordLabel')}
										</Text>
									</View>
									<View
										style={{ height: 44 }}
										className='flex-row items-center rounded-md border border-gray-300 px-4'>
										<TextInput
											placeholder={t('login.passwordPlaceholder')}
											secureTextEntry={!showPassword}
											value={password}
											onChangeText={setPassword}
											className='flex-1'
										/>
										<TouchableOpacity
											onPress={() => setShowPassword(!showPassword)}>
											{showPassword ? (
												<EyeOff size={20} color={Colors.light.icon} />
											) : (
												<Eye size={20} color={Colors.light.icon} />
											)}
										</TouchableOpacity>
									</View>
								</View>
							</View>

							<View className='my-3 w-full flex-row items-center justify-between'>
								<View className='flex-row items-center'>
									<Checkbox
										value={isChecked}
										onValueChange={setChecked}
										color={isChecked ? Colors.light.tint : undefined}
										style={{
											transform: [{ scale: 0.7 }],
											borderRadius: 5,
										}}
									/>
									<Text className='ml-2 text-xs text-gray-600'>
										{t('login.rememberMe')}
									</Text>
								</View>
								<Link href='/(auth)/forgot-password' asChild>
									<TouchableOpacity>
										<View className='flex-row items-center'>
											<Text className='text-xs text-gray-600'>
												{t('login.forgotPassword')}
											</Text>
											<Text className='text-xs font-semibold text-[#F27F2A]'>
												{t('login.recover')}
											</Text>
										</View>
									</TouchableOpacity>
								</Link>
							</View>

							<View className='mb-3 gap-3'>
								<PrimaryButton
									title={
										isLoading
											? t('login.signingInButton')
											: t('login.signInButton')
									}
									onPress={handleLogin}
									disabled={isLoading}
								/>
								<SocialButton
									title={
										isGoogleLoading ? 'Iniciando...' : t('login.googleSignIn')
									}
									iconName='google'
									onPress={handleGoogleSignIn}
									disabled={isGoogleLoading}
								/>
							</View>

							<View className='flex-row items-center justify-center'>
								<Text className='text-gray-600'>{t('login.noAccount')}</Text>
								<Link href='/(auth)/register' asChild>
									<TouchableOpacity>
										<Text className='font-semibold text-[#F27F2A]'>
											{t('login.signUpLink')}
										</Text>
									</TouchableOpacity>
								</Link>
							</View>
						</View>
					</ScrollView>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
