import { Logo } from '@/components/auth/Logo';
import { CodeInput } from '@/components/CodeInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/themed-text';
import { ToastNotification } from '@/components/ToastNotification';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConfirmEmailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { fetchUser } = useUser();
    const { login: authLogin } = useAuth();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { toastState, showToast, hideToast } = useToast();

    const handleConfirmCode = async () => {
        if (!code.trim()) {
            showToast('error', t('confirmEmail.toast.errorTitle'), t('confirmEmail.toast.enterCode'));
            return;
        }

        setIsLoading(true);

        try {
            const storedPassword = await AsyncStorage.getItem('temp_password');

            if (!storedPassword) {
                showToast(
                    'error',
                    t('confirmEmail.toast.errorTitle'),
                    t('confirmEmail.toast.tempPasswordNotFound')
                );
                setTimeout(() => router.replace('/(auth)/login'), 2000);
                return;
            }

            await vitalFitApi.client.put({
                url: `/auth/activate/${code.trim()}`,
                data: {
                    password: storedPassword,
                    confirm_password: storedPassword,
                },
            });

            showToast(
                'success',
                t('confirmEmail.toast.successTitle'),
                t('confirmEmail.toast.successMessage')
            );

            // Show success modal
            setShowSuccessModal(true);

            // Wait 3 seconds before logging in
            await new Promise(resolve => setTimeout(resolve, 3000));

            const email = await AsyncStorage.getItem('temp_email');
            const password = await AsyncStorage.getItem('temp_password');

            if (!email || !password) {
                setShowSuccessModal(false);
                setTimeout(() => router.replace('/(auth)/login'), 2000);
                return;
            }

            try {
                const loginResponse = await vitalFitApi.auth.login({ email, password });
                const token = loginResponse.token;
                const refreshToken = loginResponse.refresh_token;

                if (!token || !refreshToken) {
                    console.error('No se recibió token después del login automático');
                    setShowSuccessModal(false);
                    setTimeout(() => router.replace('/(auth)/login'), 2000);
                    return;
                }

                // Use AuthContext to store both tokens
                await authLogin(token, refreshToken);

                // Check if user registered via OAuth and store flag
                const isOAuthRegistration = await AsyncStorage.getItem('temp_oauth_registration');
                if (isOAuthRegistration === 'true') {
                    await AsyncStorage.setItem('is_oauth_user', 'true');
                    console.log('OAuth flag stored for OAuth registration');
                }

                // Fetch user data to populate context
                await fetchUser();

                // Add a small delay to ensure user data is loaded
                await new Promise(resolve => setTimeout(resolve, 300));

                // Clean up temporary storage
                await AsyncStorage.multiRemove(['temp_email', 'temp_password', 'temp_oauth_registration']);

                // Get user role to navigate to correct dashboard
                const whoamiResponse = await vitalFitApi.user.WhoAmI(token);
                const role = whoamiResponse.user?.role?.name?.toLowerCase();

                setShowSuccessModal(false);

                if (role === 'instructor') {
                    router.replace('/(instructor)/dashboard');
                } else if (role === 'recepcionist' || role === 'receptionist') {
                    router.replace('/(recepcionist)/dashboard');
                } else {
                    router.replace('/(tabs)/dashboard');
                }
            } catch (loginErr: unknown) {
                console.error('Error en login automático:', loginErr);
                setShowSuccessModal(false);
                setTimeout(() => router.replace('/(auth)/login'), 2000);
            }
        } catch (error: unknown) {
            let errorMessage = t('confirmEmail.toast.errorMessage');
            let errorDetails = '';

            if (isAPIError(error)) {
                errorMessage = error.messages.join(', ');
                errorDetails = `Status: ${error.status}, Messages: ${error.messages.join(', ')}`;
            } else if (error instanceof Error) {
                errorMessage = error.message;
                errorDetails = `Error: ${error.message}`;
            }

            console.error('Error al confirmar o iniciar sesión:', error);
            console.error('Error details:', errorDetails);

            // Hide modal if it's showing
            setShowSuccessModal(false);

            showToast('error', t('confirmEmail.toast.errorTitle'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            const email = await AsyncStorage.getItem('temp_email');

            if (!email) {
                showToast(
                    'error',
                    t('confirmEmail.toast.errorTitle'),
                    t('confirmEmail.toast.emailNotFound')
                );
                return;
            }

            await vitalFitApi.user.resendActivateOtp(email);

            showToast(
                'success',
                t('confirmEmail.toast.resendTitle'),
                t('confirmEmail.toast.resendMessage')
            );
        } catch (error: unknown) {
            let errorMessage = t('confirmEmail.toast.resendError');

            if (isAPIError(error)) {
                errorMessage = error.messages.join(', ');
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            showToast('error', t('confirmEmail.toast.errorTitle'), errorMessage);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                    paddingBottom: insets.bottom + 32,
                }}
                keyboardShouldPersistTaps='handled'>
                <ToastNotification
                    visible={toastState.visible}
                    type={toastState.type}
                    title={toastState.title}
                    message={toastState.message}
                    onClose={hideToast}
                />

                <View className='items-center mb-8'>
                    <Logo />
                </View>

                <View className='mb-16'>
                    <ThemedText
                        type='title'
                        lightColor={Colors.light.tint}
                        className='font-heading text-center text-3xl'
                        style={{
                            lineHeight: 32,
                        }}>
                        {t('confirmEmail.title')}
                    </ThemedText>
                </View>

                <Text className='font-body text-gray-500 text-center mb-8 text-lg'>
                    {t('confirmEmail.subtitle')}
                </Text>

                <View className='w-full max-w-xs mb-8'>
                    <Text className='text-sm text-gray-500 mb-1 font-semibold'></Text>
                    <CodeInput
                        onComplete={(inputCode: string) => {
                            setCode(inputCode);
                        }}
                    />
                </View>

                <TouchableOpacity onPress={handleResendCode} className='mb-8'>
                    <Text className='text-blue-500 font-semibold'>
                        {t('confirmEmail.resendText')} 
                        {t('confirmEmail.resendLink')}
                    </Text>
                </TouchableOpacity>

                <View className='w-full gap-4'>
                    <PrimaryButton
                        title={isLoading ? t('confirmEmail.verifyingButton') : t('confirmEmail.verifyButton')}
                        onPress={handleConfirmCode}
                        disabled={isLoading}
                    />
                    <SecondaryButton 
                        title={t('forgotPassword.step1.cancelButton')} 
                        onPress={() => router.back()} 
                    />
                </View>
            </ScrollView>

            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType='fade'>
                <View className='flex-1 justify-center items-center bg-black/50'>
                    <View className='bg-white rounded-2xl p-8 mx-6 items-center shadow-lg'>
                        <View className='mb-4'>
                            <Text className='text-6xl'>✓</Text>
                        </View>
                        <ThemedText
                            type='subtitle'
                            lightColor={Colors.light.tint}
                            className='font-heading text-center text-xl mb-2'>
                            {t('confirmEmail.modal.title')}
                        </ThemedText>
                        <Text className='font-body text-gray-600 text-center'>
                            {t('confirmEmail.modal.message')}
                        </Text>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}