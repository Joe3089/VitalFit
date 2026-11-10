import { Logo } from '@/components/auth/Logo';
import { Step1Gender } from '@/components/auth/register/Step1Gender';
import { Step2Credentials } from '@/components/auth/register/Step2Credentials';
import { Step3PersonalDetails } from '@/components/auth/register/Step3PersonalDetails';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { Colors } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import { createRegisterSchema, createStep1Schema, createStep2Schema, RegisterData } from '@/schemas/register';
import vitalFitApi from '@/services';
import { useUser } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError, SignUpRequest, UserGender } from '@vitalfit/sdk';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function generateSecurePassword() {
    const random = Math.random().toString(36).slice(-10);
    return `A${random}!1`;
}

export default function RegisterScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();
    const isOAuthFlow = params.oauth === 'google';

    const { user, isSignedIn } = useUser();

    const [step, setStep] = useState(1);
    const { toastState, showToast, hideToast } = useToast();

    const RegisterSchema = useMemo(() => createRegisterSchema(t), [t]);
    const Step1Schema = useMemo(() => createStep1Schema(t), [t]);
    const Step2Schema = useMemo(() => createStep2Schema(t), [t]);

    const {
        control,
        handleSubmit,
        trigger,
        formState: { errors },
        getValues,
        setValue,
        setError,
    } = useForm<RegisterData>({
        resolver: (values, context, options) => zodResolver(RegisterSchema)(values, context, options),
        defaultValues: {
            acceptTerms: false,
        },
    });

    useEffect(() => {
        if (isOAuthFlow && isSignedIn && user) {
            // Pre-llenar datos del usuario de Google
            if (user.firstName) setValue('name', user.firstName);
            if (user.lastName) setValue('lastName', user.lastName);
            if (user.emailAddresses?.[0]?.emailAddress) {
                setValue('email', user.emailAddresses[0].emailAddress);
            }
            if (user.phoneNumbers?.[0]?.phoneNumber) {
                setValue('phone', user.phoneNumbers[0].phoneNumber);
            }
            if (user.imageUrl) {
                setValue('profile_picture_url', user.imageUrl);
            }
            const autoPassword = generateSecurePassword();
            setValue('password', autoPassword);
            setValue('confirmPassword', autoPassword);
        }
    }, [isOAuthFlow, isSignedIn, user, setValue]);

    const handleRegistration = async (data: RegisterData) => {
        const cleanedData = { ...data };

        try {
            const payload: SignUpRequest = {
                email: cleanedData.email,
                password: cleanedData.password,
                gender: cleanedData.gender === 'prefer-not-to-say' ? null : (cleanedData.gender as UserGender),
                first_name: cleanedData.name,
                last_name: cleanedData.lastName,
                identity_document: cleanedData.documentId,
                birth_date: new Date(cleanedData.birthDate).toISOString().split('T')[0],
                phone: cleanedData.phone,
                profile_picture_url: cleanedData.profile_picture_url || '',
                role_name: 'client',
            };

            await vitalFitApi.auth.signUp(payload);

            await AsyncStorage.setItem('temp_email', cleanedData.email);
            await AsyncStorage.setItem('temp_password', cleanedData.password);

            // Store flag if this is an OAuth registration
            if (isOAuthFlow) {
                await AsyncStorage.setItem('temp_oauth_registration', 'true');
                console.log('OAuth registration flag stored');
            }

            showToast(
                'success',
                t('register.toast.successTitle'),
                t('register.toast.successMessage')
            );

            setTimeout(() => {
                router.replace('/(auth)/confirm-email');
            }, 2000);

        } catch (error: unknown) {
            let errorMessage = t('register.toast.unexpectedError');

            if (isAPIError(error)) {
                errorMessage = error.messages.join(', ');
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            showToast('error', t('register.toast.errorTitle'), errorMessage);
        }
    };

    const onSubmitPress = handleSubmit(handleRegistration);

    const nextStep = async () => {
        let fieldsToValidate: (keyof RegisterData)[] = [];

        if (step === 1) {
            fieldsToValidate = ['gender'];
        } else if (step === 2 && !isOAuthFlow) {
            fieldsToValidate = ['email', 'password', 'confirmPassword'];
        }

        await trigger(fieldsToValidate);

        const currentSchema =
            step === 1 ? Step1Schema :
            step === 2 && !isOAuthFlow ? Step2Schema :
            null;

        if (currentSchema) {
            const result = currentSchema.safeParse(getValues());
            if (!result.success) {
                result.error.issues.forEach((issue) => {
                    setError(issue.path[0] as keyof RegisterData, {
                        type: 'manual',
                        message: issue.message,
                    });
                });
                return;
            }
        }

        if (step === 1 && isOAuthFlow) {
            setStep(3);
        } else {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    useEffect(() => {
        const onBackPress = () => {
            if (step === 1) {
                router.replace('/');
                return true;
            } else {
                setStep(step - 1);
                return true;
            }
        };

        const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            onBackPress
        );

        return () => subscription.remove();
    }, [step, router]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>

                <ToastNotification
                    visible={toastState.visible}
                    type={toastState.type}
                    title={toastState.title}
                    message={toastState.message}
                    onClose={hideToast}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}>

                    {step === 1 && (
                        <TouchableOpacity
                            onPress={() => router.replace('/')}
                            style={styles.backButton}>
                            <ArrowLeft size={24} color='#000' />
                        </TouchableOpacity>
                    )}

                    <ThemedView style={styles.container}>
                    <View style={styles.formContainer}>
                        <Logo />

                        {step === 1 && (
                            <ThemedText className='font-heading' style={styles.mainTitle}>
                                {t('register.step1Title')}
                            </ThemedText>
                        )}

                        {step === 2 && (
                            <>
                                <ThemedText className='font-heading' style={styles.mainTitle}>
                                    {t('register.step2Title')}
                                </ThemedText>
                                <Text className='font-body text-gray-500 text-center mb-8 text-lg'>
                                    {t('register.step2Subtitle')}
                                </Text>
                            </>
                        )}

                        {step === 3 && (
                            <Text className='font-body text-gray-500 text-center mb-8 text-lg'>
                                {t('register.step3Subtitle')}
                            </Text>
                        )}

                        <View style={styles.stepContainer}>
                            {step === 1 && (
                                <Step1Gender
                                    control={control}
                                    errors={errors}
                                    onNextStep={nextStep}
                                />
                            )}

                            {step === 2 && (
                                <Step2Credentials
                                    control={control}
                                    errors={errors}
                                    onNextStep={nextStep}
                                    onPrevStep={prevStep}
                                    isSignedIn={isSignedIn}
                                />
                            )}

                            {step === 3 && (
                                <Step3PersonalDetails
                                    control={control}
                                    errors={errors}
                                    onSubmit={onSubmitPress}
                                    onPrevStep={prevStep}
                                />
                            )}
                        </View>

                        <View style={styles.footer}>
                            <Link href='/(auth)/login'>
                                <Text style={styles.footerText}>
                                    {t('register.alreadyHaveAccount')}
                                    <Text style={styles.footerLink}>
                                        {t('register.signInLink')}
                                    </Text>
                                </Text>
                            </Link>
                        </View>

                    </View>
                </ThemedView>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1, backgroundColor: 'white' },
    scrollContent: { flexGrow: 1 },
    container: { flex: 1, alignItems: 'center', backgroundColor: 'white', paddingTop: 60 },
    formContainer: { width: '100%', maxWidth: 384, paddingHorizontal: 24, alignItems: 'center', flex: 1 },
    stepContainer: { flex: 1, width: '100%', alignItems: 'center', gap: 16 },
    mainTitle: { fontSize: 32, marginBottom: 8, textAlign: 'center', color: '#F27F2A', lineHeight: 38 },
    footer: { marginTop: 'auto', paddingBottom: 16 },
    footerText: { color: '#5C5E60' },
    footerLink: { color: Colors.light.tint, fontWeight: '600' },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
    },
});