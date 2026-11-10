import { PrimaryButton } from '@/components/PrimaryButton';
import { StyledTextInput } from '@/components/StyledTextInput';
import { ToastNotification } from '@/components/ToastNotification';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/hooks/useToast';
import vitalFitApi from '@/services';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, ShieldCheckIcon } from 'react-native-heroicons/solid';
import { z } from 'zod';

// Este schema se crea dentro del componente para acceder a useTranslation
function createChangePasswordSchema() {
  return z
    .object({
      currentPassword: z.string().min(1, { message: 'receptionist.changePassword.errors.currentRequired' }),
      newPassword: z
        .string()
        .min(8, { message: 'receptionist.changePassword.errors.minLength' })
        .regex(/[A-Z]/, { message: 'receptionist.changePassword.errors.uppercase' })
        .regex(/[a-z]/, { message: 'receptionist.changePassword.errors.lowercase' })
        .regex(/[0-9]/, { message: 'receptionist.changePassword.errors.number' })
        .regex(/[^a-zA-Z0-9]/, { message: 'receptionist.changePassword.errors.special' }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'receptionist.changePassword.errors.passwordMismatch',
      path: ['confirmPassword'],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: 'receptionist.changePassword.errors.sameAsCurrent',
      path: ['newPassword'],
    });
}

type FormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;

export default function RecepcionistChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toastState, showToast, hideToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createChangePasswordSchema()),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        const msg = t('receptionist.changePassword.errors.noSession');
        setErrorMessage(msg);
        return;
      }

      await vitalFitApi.user.UpgradePassword(
        token,
        data.currentPassword,
        data.newPassword,
        data.confirmPassword
      );

      showToast(
        'success',
        t('receptionist.changePassword.toast.successTitle'),
        t('receptionist.changePassword.toast.successMessage')
      );

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: unknown) {
      console.log('Error al cambiar password:', error);

      let message = t('receptionist.changePassword.errors.generic');

      if (isAPIError(error)) {
        if (error.status === 401) {
          message = t('receptionist.changePassword.errors.incorrectCurrent');
        } else if (error.messages && error.messages.length > 0) {
          message = error.messages.join(', ');
        } else if (error.message && error.message !== 'Ocurrió un error inesperado') {
          message = error.message;
        } else {
          message = t('receptionist.changePassword.errors.tryAgain');
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
      showToast('error', t('receptionist.changePassword.toast.errorTitle'), message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView className="flex-1 bg-white pt-10">
      <ToastNotification
        visible={toastState.visible}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
        onClose={hideToast}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        >
          <View
            className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center"
            style={{ position: 'relative' }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}
            >
              <ChevronLeftIcon size={20} color="#f97316" />
            </TouchableOpacity>

            <Text className="font-heading" style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
              {t('receptionist.changePassword.title')}
            </Text>
          </View>

          <View className="mb-4 flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center mr-3">
              <ShieldCheckIcon size={20} color="#111827" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-[15px] font-semibold text-[#111827]">
                {t('receptionist.changePassword.sectionTitle')}
              </Text>
              <Text className="font-body text-[12px] text-[#6b7280]">
                {t('receptionist.changePassword.sectionSubtitle')}
              </Text>
            </View>
          </View>

          {errorMessage && (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 10,
                marginBottom: 12,
              }}
            >
              <Text className="font-body" style={{ color: '#B91C1C', fontSize: 12 }}>
                {errorMessage}
              </Text>
            </View>
          )}

          <View>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  label={t('receptionist.changePassword.currentPassword')}
                  isPasswordInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={t('receptionist.changePassword.currentPasswordPlaceholder')}
                  error={errors.currentPassword?.message && t(errors.currentPassword.message)}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  label={t('receptionist.changePassword.newPassword')}
                  isPasswordInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={t('receptionist.changePassword.newPasswordPlaceholder')}
                  error={errors.newPassword?.message && t(errors.newPassword.message)}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  label={t('receptionist.changePassword.confirmPassword')}
                  isPasswordInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={t('receptionist.changePassword.confirmPasswordPlaceholder')}
                  error={errors.confirmPassword?.message && t(errors.confirmPassword.message)}
                />
              )}
            />

            <PrimaryButton
              title={isLoading ? t('receptionist.changePassword.saving') : t('receptionist.changePassword.save')}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}