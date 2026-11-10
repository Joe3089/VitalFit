import { Colors } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { RegisterData } from '@/schemas/register';
import vitalFitApi from '@/services';
import { useAuth, useClerk, useOAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, SlidersVertical } from 'lucide-react-native';
import { useState } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { PrimaryButton } from '../../PrimaryButton';
import { StyledTextInput } from '../../StyledTextInput';
import { SocialButton } from '../SocialButton';

WebBrowser.maybeCompleteAuthSession();

interface Props {
    control: Control<RegisterData>;
    errors: FieldErrors<RegisterData>;
    onNextStep: () => void;
    onPrevStep: () => void;
    isSignedIn?: boolean;
}

export function Step2Credentials({ control, errors, onNextStep, onPrevStep }: Props) {
    const { t } = useTranslation();
    const router = useRouter();
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const { showToast } = useToast();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true);
        console.log('handleGoogleSignUp llamado');

        try {
            try {
                await signOut();
                console.log('Sesión previa cerrada');
            } catch {
                console.log('No había sesión previa');
            }

            console.log('Iniciando OAuth flow...');
            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/(auth)/register', { scheme: 'vitalfit' }),
            });

            console.log('OAuth flow completado:', { createdSessionId });

            if (createdSessionId && setActive) {
                console.log('Activando sesión...');
                await setActive({ session: createdSessionId });
                console.log('Sesión activada con ID:', createdSessionId);

                await new Promise(resolve => setTimeout(resolve, 1000));

                const clerkToken = await getToken({ template: 'vitalfit-backend' });

                if (clerkToken) {
                    console.log('Token de Clerk obtenido');

                    try {
                        console.log('Enviando al backend...');
                        const response = await vitalFitApi.auth.oAuthLogin({
                            session_token: clerkToken
                        });

                        console.log('Usuario ya registrado, iniciando sesión...');
                        const backendToken = response.token;

                        if (backendToken) {
                            await AsyncStorage.setItem('token', backendToken);
                            console.log('Token de backend guardado');

                            const whoamiResponse = await vitalFitApi.user.WhoAmI(backendToken);
                            const role = whoamiResponse.user?.role?.name?.toLowerCase();

                            showToast('success', '¡Bienvenido!', 'Iniciaste sesión con Google exitosamente');

                            if (role === 'instructor') {
                                router.replace('/(instructor)/dashboard');
                            } else if (role === 'recepcionist' || role === 'receptionist') {
                                router.replace('/(recepcionist)/dashboard');
                            } else {
                                router.replace('/(tabs)/dashboard');
                            }
                        }
                    } catch (loginError: unknown) {
                        console.log('Usuario no existe, continuando con registro...');

                        if (isAPIError(loginError)) {
                            const errorMessages = loginError.messages.join(', ').toLowerCase();

                            if (errorMessages.includes('usuario no encontrado') ||
                                errorMessages.includes('not found') ||
                                errorMessages.includes('unauthorized')) {
                                console.log('Continuando con flujo de registro');
                                router.replace('/(auth)/register?oauth=google');
                            } else {
                                showToast('error', 'Error de autenticación', loginError.messages.join(', '));
                            }
                        } else {
                            console.error('Error inesperado:', loginError);
                            showToast('error', 'Error', 'No se pudo completar la autenticación con Google');
                        }
                    }
                } else {
                    console.warn('No se pudo obtener el token de sesión');
                    showToast('error', 'Error', 'No se pudo obtener el token de Clerk');
                }
            } else {
                console.warn('No se creó sesión o setActive no está disponible');
                showToast('error', 'Error', 'No se pudo completar el inicio de sesión con Google');
            }
        } catch (err: unknown) {
            console.error('OAuth error:', err);

            if (err instanceof Error && err.message?.includes('already signed in')) {
                showToast('success', 'Ya has iniciado sesión', 'Redirigiendo...');
                router.replace('/(tabs)/dashboard');
            } else {
                showToast('error', 'Error de autenticación', 'No se pudo iniciar sesión con Google');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={onPrevStep}
                style={{
                    position: 'absolute',
                    top: -244,
                    left: -8,
                    zIndex: 10,
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: 20,
                }}>
                <ArrowLeft size={24} color='#000' />
            </TouchableOpacity>
            <Controller
                control={control}
                name='email'
                render={({ field: { onChange, onBlur, value } }) => (
                    <StyledTextInput
                        label={t('step2Credentials.emailLabel')}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.email?.message}
                    />
                )}
            />
            <Controller
                control={control}
                name='password'
                render={({ field: { onChange, onBlur, value } }) => (
                    <StyledTextInput
                        label={t('step2Credentials.passwordLabel')}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.password?.message}
                        isPasswordInput
                        icon={<SlidersVertical size={16} color={Colors.light.icon} />}
                    />
                )}
            />
            <Controller
                control={control}
                name='confirmPassword'
                render={({ field: { onChange, onBlur, value } }) => (
                    <StyledTextInput
                        label={t('step2Credentials.confirmPasswordLabel')}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.confirmPassword?.message}
                        isPasswordInput
                        icon={<SlidersVertical size={16} color={Colors.light.icon} />}
                    />
                )}
            />
            <PrimaryButton
                title={t('step2Credentials.continueButton')}
                onPress={onNextStep}
            />
            <SocialButton
                title={isGoogleLoading ? 'Cargando...' : t('step2Credentials.googleSignInButton')}
                iconName='google'
                disabled={isGoogleLoading}
                onPress={handleGoogleSignUp}
            />
        </>
    );
}