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
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, ShieldCheckIcon } from 'react-native-heroicons/solid';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const createChangePasswordSchema = (t: (key: string) => string) => z
  .object({
    currentPassword: z.string().min(1, t('changePassword.errors.currentPasswordRequired')),
    newPassword: z
      .string()
      .min(8, t('changePassword.errors.newPasswordMin'))
      .regex(/[A-Z]/, t('changePassword.errors.uppercase'))
      .regex(/[a-z]/, t('changePassword.errors.lowercase'))
      .regex(/[0-9]/, t('changePassword.errors.number'))
      .regex(/[^a-zA-Z0-9]/, t('changePassword.errors.special')),
    confirmPassword: z.string(),
  })

  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('changePassword.errors.passwordMismatch'),
    path: ['confirmPassword'],
  })

  .refine((data) => data.newPassword !== data.currentPassword, {
    message: t('changePassword.errors.samePassword'),
    path: ['newPassword'],
  });

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function InstructorChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toastState, showToast, hideToast } = useToast();

  const ChangePasswordSchema = useMemo(() => createChangePasswordSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ChangePasswordSchema),
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
        setErrorMessage(t('changePassword.errors.noSession'));
        return;
      }

      await vitalFitApi.user.UpgradePassword(
        token,
        data.currentPassword,
        data.newPassword,
        data.confirmPassword
      );

      showToast('success', t('changePassword.toast.successTitle'), t('changePassword.toast.successMessage'));
      
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: unknown) {
      console.log('Error al cambiar password:', error);

      let message = t('changePassword.errors.generic');

      if (isAPIError(error)) {
        if (error.status === 401) {
          message = t('changePassword.errors.incorrectPassword');
        } else if (error.messages && error.messages.length > 0) {
          message = error.messages.join(', ');
        } else if (error.message && error.message !== 'Ocurrió un error inesperado') {
          message = error.message;
        } else {
          message = t('changePassword.errors.verifyPassword');
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrorMessage(message);
      showToast('error', t('changePassword.toast.errorTitle'), message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView className='flex-1 bg-white pt-10'>
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
          <View
            className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center'
            style={{ position: 'relative' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
              <ChevronLeftIcon width={20} height={20} color='#f97316' />
            </TouchableOpacity>

            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '600' }} className="font-heading">
              {t('changePassword.title')}
            </Text>
          </View>

          <View className='mb-4 flex-row items-center'>
            <View className='w-9 h-9 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
              <ShieldCheckIcon width={20} height={20} color='#111827' />
            </View>
            <View className='flex-1'>
              <Text className='text-[15px] font-semibold text-[#111827] font-heading'>{t('changePassword.accountSecurity')}</Text>
              <Text className='text-[12px] text-[#6b7280] font-body'>{t('changePassword.updatePassword')}</Text>
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
              }}>
              <Text style={{ color: '#B91C1C', fontSize: 12 }} className="font-body">{errorMessage}</Text>
            </View>
          )}

          <View>
            <Controller
              control={control}
              name='currentPassword'
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  label={t('changePassword.currentPasswordLabel')}
                  isPasswordInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={t('changePassword.currentPasswordPlaceholder')}
                  error={errors.currentPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name='newPassword'
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  label={t('changePassword.newPasswordLabel')}
                  isPasswordInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={t('changePassword.newPasswordPlaceholder')}
                  error={errors.newPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name='confirmPassword'
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  label={t('changePassword.confirmPasswordLabel')}
                  isPasswordInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={t('changePassword.confirmPasswordPlaceholder')}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <PrimaryButton
              title={isLoading ? t('changePassword.savingButton') : t('changePassword.saveButton')}
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