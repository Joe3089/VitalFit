import { StyledTextInput } from '@/components/StyledTextInput';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { UserAvatar } from '@/components/UserAvatar';
import { useUser } from '@/contexts/UserContext';
import vitalFitApi from '@/services';
import { uploadProfilePicture } from '@/services/imageUpload';

import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { isAPIError } from '@vitalfit/sdk';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, PencilSquareIcon, PhoneIcon, UserCircleIcon } from 'react-native-heroicons/solid';
import PhoneInput, { IPhoneInputRef } from 'react-native-international-phone-number';
import { z } from 'zod';

const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

const createProfileSchema = (t: (key: string) => string) => z.object({
    firstName: z.string().min(1, t('myProfile.errors.nameRequired')).regex(nameRegex, t('myProfile.errors.nameLetters')),
    lastName: z.string().min(1, t('myProfile.errors.lastNameRequired')).regex(nameRegex, t('myProfile.errors.lastNameLetters')),
    documentId: z.string().min(6, t('myProfile.errors.documentMin')).regex(/^[0-9]+$/, t('myProfile.errors.documentNumeric')),
    birthDate: z.string().min(1, t('myProfile.errors.birthDateRequired')).refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 18;
    }, { message: t('myProfile.errors.adult') }),
    phone: z.string().optional().refine((phone) => {
        if (!phone) return true;
        const numericPhone = phone.replace(/\D/g, '');
        return numericPhone.length >= 10 && numericPhone.length <= 15;
    }, { message: t('myProfile.errors.phoneLength') }),
    gender: z.string().min(1, t('myProfile.errors.genderRequired')),
});

export default function MyProfileScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, updateLocalUser } = useUser();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const phoneInputRef = useRef<IPhoneInputRef>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
    const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; title: string; message: string; }>({
        visible: false,
        type: 'success',
        title: '',
        message: '',
    });

    const ProfileSchema = useMemo(() => createProfileSchema(t), [t]);
    type ProfileFormData = z.infer<typeof ProfileSchema>;

    const { control, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            documentId: '',
            birthDate: '',
            phone: '',
            gender: '',
        },
    });

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setSelectedImage(user.profilePicture);
        
        const formattedBirthDate = user.birthDate ? format(new Date(user.birthDate), 'yyyy-MM-dd') : '';

        reset({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            documentId: user.identityDocument || '',
            birthDate: formattedBirthDate,
            phone: user.phone || '',
            gender: user.gender || '',
        });

        setLoading(false);
    }, [user, reset]);

    const handleImagePick = useCallback(async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.status !== 'granted') {
                Alert.alert(t('myProfile.permissions.title'), t('myProfile.permissions.message'));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // ✅ Corregido: uso de la nueva API
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            Alert.alert(t('myProfile.toast.errorTitle'), t('myProfile.galleryError'));
        }
    }, [t]);

    const onSubmit = useCallback(async (data: ProfileFormData) => {
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token || !user?.userId) {
                setToast({
                    visible: true,
                    type: 'error',
                    title: t('myProfile.toast.errorTitle'),
                    message: !token ? t('myProfile.errors.noToken') : t('myProfile.errors.noUserId'),
                });
                setSaving(false);
                return;
            }

            const genderForApi = data.gender === 'M' ? 'male' : 'female';
            let finalProfilePictureUrl = user.profilePicture;

            if (selectedImage && selectedImage !== user.profilePicture) {
                try {
                    finalProfilePictureUrl = await uploadProfilePicture(selectedImage);
                } catch (uploadError) {
                    console.error('Error al subir imagen:', uploadError);
                    setToast({
                        visible: true,
                        type: 'error',
                        title: t('myProfile.toast.errorTitle'),
                        message: t('myProfile.errors.uploadImageError'),
                    });
                    setSaving(false);
                    return;
                }
            }

            const updateData = {
                first_name: data.firstName,
                last_name: data.lastName,
                birth_date: data.birthDate,
                gender: genderForApi,
                email: user.email,
                phone: data.phone || undefined,
                identity_document: data.documentId,
                profile_picture_url: finalProfilePictureUrl,
            };

            await vitalFitApi.user.updateUserClient(user.userId, updateData, token);

            updateLocalUser({
                firstName: data.firstName,
                lastName: data.lastName,
                identityDocument: data.documentId,
                phone: data.phone || '',
                gender: data.gender,
                birthDate: data.birthDate,
                profilePicture: finalProfilePictureUrl,
            });

            setIsEditing(false);
            setToast({
                visible: true,
                type: 'success',
                title: t('myProfile.toast.successTitle'),
                message: t('myProfile.toast.successMessage'),
            });
        } catch (error: unknown) {
            console.error('Error al actualizar perfil:', error);
            let errorMessage = t('myProfile.errors.updateError');
            if (isAPIError(error)) {
                errorMessage = error.messages.join(', ');
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            setToast({
                visible: true,
                type: 'error',
                title: t('myProfile.toast.errorTitle'),
                message: errorMessage,
            });
        } finally {
            setSaving(false);
        }
    }, [user, selectedImage, updateLocalUser, t]);

    const handleToggleEdit = useCallback(() => {
        if (isEditing) {
            handleSubmit(onSubmit)();
        } else {
            setIsEditing(true);
        }
    }, [isEditing, handleSubmit, onSubmit]);

    const handleCancelEdit = useCallback(() => {
        if (user) {
            const formattedBirthDate = user.birthDate ? format(new Date(user.birthDate), 'yyyy-MM-dd') : '';
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                documentId: user.identityDocument || '',
                birthDate: formattedBirthDate,
                phone: user.phone || '',
                gender: user.gender || '',
            });
            setSelectedImage(user.profilePicture);
        }
        setIsEditing(false);
    }, [user, reset]);

    const displayName = useMemo(() => {
        if (!user) return t('clientProfile.defaultName');
        return user.lastName && user.firstName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || t('clientProfile.defaultName');
    }, [user, t]);



    if (loading) {
        return (
            <ThemedView className='flex-1 justify-center items-center bg-white'>
                <ActivityIndicator size='large' color='#F27F2A' />
            </ThemedView>
        );
    }

    return (
        <ThemedView className='flex-1 bg-white pt-10'>
            <ToastNotification
                visible={toast.visible}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
                removeClippedSubviews={true}
            >
                <View className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center' style={{ position: 'relative' }}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                        style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
                        <ChevronLeftIcon width={20} height={20} color='#f97316' />
                    </TouchableOpacity>

                    <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>{t('myProfile.title')}</Text>
                </View>

                <View className='mb-4 items-center'>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={isEditing ? handleImagePick : undefined}
                        disabled={!isEditing}
                        style={{ position: 'relative', marginBottom: 12 }}>
                        <UserAvatar
                            name={displayName}
                            imageUrl={selectedImage}
                            size={96}
                        />
                        {isEditing && (
                            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                                <PencilSquareIcon width={16} height={16} color='#FFFFFF' />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text className='font-heading' style={{ color: '#111827', fontSize: 20, fontWeight: '600' }}>{displayName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text className='font-body' style={{ color: '#6b7280', fontSize: 13, marginRight: 4 }}>{t('myProfile.level')} 24</Text>
                        <Image source={require('@/assets/images/medal2.png')} style={{ width: 14, height: 14 }} contentFit='contain' />
                    </View>
                    <Text className='font-body' style={{ color: '#f97316', fontSize: 13, marginTop: 2 }}>{t('myProfile.premium')}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        className='flex-1 rounded-2xl py-3 items-center justify-center'
                        style={{ backgroundColor: isEditing ? '#4b5563' : '#f97316' }}
                        onPress={handleToggleEdit}
                        disabled={saving}>
                        {saving ? (
                            <ActivityIndicator size='small' color='#ffffff' />
                        ) : (
                            <Text className='font-body' style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                                {isEditing ? t('myProfile.saveChanges') : t('myProfile.edit')}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {isEditing && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            className='flex-1 rounded-2xl py-3 items-center justify-center'
                            style={{ backgroundColor: '#9CA3AF' }}
                            onPress={handleCancelEdit}
                            disabled={saving}>
                            <Text className='font-body' style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{t('myProfile.cancel')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View className='mb-4 rounded-2xl bg-[#F3F4F6] px-4 py-4'>
                    <View className='flex-row items-center mb-3'>
                        <UserCircleIcon width={18} height={18} color='#111827' />
                        <Text className='font-heading' style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#111827' }}>{t('myProfile.personalInfo')}</Text>
                    </View>

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.firstName')}</Text>
                    {isEditing ? (
                        <Controller
                            control={control}
                            name='firstName'
                            render={({ field: { onChange, onBlur, value } }) => (
                                <StyledTextInput
                                    label={undefined}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    placeholder={t('myProfile.placeholders.name')}
                                    error={errors.firstName?.message}
                                />
                            )}
                        />
                    ) : (
                        <TextInput
                            editable={false}
                            value={user?.firstName}
                            placeholder={t('myProfile.placeholders.name')}
                            placeholderTextColor='#9CA3AF'
                            style={styles.readOnlyInput}
                        />
                    )}

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.lastName')}</Text>
                    {isEditing ? (
                        <Controller
                            control={control}
                            name='lastName'
                            render={({ field: { onChange, onBlur, value } }) => (
                                <StyledTextInput
                                    label={undefined}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    placeholder={t('myProfile.placeholders.lastName')}
                                    error={errors.lastName?.message}
                                />
                            )}
                        />
                    ) : (
                        <TextInput
                            editable={false}
                            value={user?.lastName}
                            placeholder={t('myProfile.placeholders.lastName')}
                            placeholderTextColor='#9CA3AF'
                            style={styles.readOnlyInput}
                        />
                    )}

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.identityDoc')}</Text>
                    {isEditing ? (
                        <Controller
                            control={control}
                            name='documentId'
                            render={({ field: { onChange, onBlur, value } }) => (
                                <StyledTextInput
                                    label={undefined}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    placeholder={t('myProfile.placeholders.identityDoc')}
                                    keyboardType='numeric'
                                    error={errors.documentId?.message}
                                />
                            )}
                        />
                    ) : (
                        <TextInput
                            editable={false}
                            value={user?.identityDocument}
                            placeholder={t('myProfile.placeholders.identityDoc')}
                            placeholderTextColor='#9CA3AF'
                            keyboardType='numeric'
                            style={styles.readOnlyInput}
                        />
                    )}

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.birthDate')}</Text>
                    {isEditing ? (
                        <Controller
                            control={control}
                            name='birthDate'
                            render={({ field: { onChange, value } }) => {
                                const date = value ? new Date(value) : new Date();
                                return (
                                    <View style={{ width: '100%' }}>
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker(true)}
                                            style={{ position: 'relative' }}>
                                            <StyledTextInput
                                                label={undefined}
                                                value={value ? format(date, 'yyyy-MM-dd') : ''}
                                                editable={false}
                                                pointerEvents='none'
                                                placeholder={t('myProfile.placeholders.birthDate')}
                                                error={errors.birthDate?.message}
                                            />
                                            <View style={{ position: 'absolute', right: 10, bottom: 10 }}>
                                                <Calendar size={18} color='#9CA3AF' />
                                            </View>
                                        </TouchableOpacity>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={date}
                                                mode='date'
                                                display='default'
                                                onChange={(_event, selectedDate) => {
                                                    setShowDatePicker(false);
                                                    if (selectedDate) {
                                                        onChange(selectedDate.toISOString());
                                                    }
                                                }}
                                            />
                                        )}
                                    </View>
                                );
                            }}
                        />
                    ) : (
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                editable={false}
                                value={user?.birthDate ? format(new Date(user.birthDate), 'yyyy-MM-dd') : ''}
                                placeholder={t('myProfile.placeholders.birthDate')}
                                placeholderTextColor='#9CA3AF'
                                style={[styles.readOnlyInput, { paddingRight: 32 }]}
                            />
                            <View style={{ position: 'absolute', right: 10, top: 10 }}>
                                <Calendar size={18} color='#9CA3AF' />
                            </View>
                        </View>
                    )}

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.gender')}</Text>
                    {isEditing ? (
                        <Controller
                            control={control}
                            name='gender'
                            render={({ field: { onChange, value } }) => (
                                <View style={{ width: '100%', marginBottom: 10 }}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => onChange('M')}
                                            style={[styles.genderButton, { backgroundColor: value === 'M' ? '#f97316' : '#E5E7EB' }]}>
                                            <Text className='font-body' style={{ color: value === 'M' ? '#FFFFFF' : '#6b7280', fontSize: 13, fontWeight: '600' }}>{t('myProfile.male')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => onChange('F')}
                                            style={[styles.genderButton, { backgroundColor: value === 'F' ? '#f97316' : '#E5E7EB' }]}>
                                            <Text className='font-body' style={{ color: value === 'F' ? '#FFFFFF' : '#6b7280', fontSize: 13, fontWeight: '600' }}>{t('myProfile.female')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errors.gender && <Text className='font-body' style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{errors.gender.message}</Text>}
                                </View>
                            )}
                        />
                    ) : (
                        <TextInput
                            editable={false}
                            value={user?.gender === 'M' ? t('myProfile.male') : user?.gender === 'F' ? t('myProfile.female') : ''}
                            placeholder={t('myProfile.placeholders.gender')}
                            placeholderTextColor='#9CA3AF'
                            style={styles.readOnlyInput}
                        />
                    )}
                </View>

                <View className='mb-4 rounded-2xl bg-[#F3F4F6] px-4 py-4'>
                    <View className='flex-row items-center mb-3'>
                        <PhoneIcon width={18} height={18} color='#111827' />
                        <Text className='font-heading' style={{ marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#111827' }}>{t('myProfile.contactInfo')}</Text>
                    </View>

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.email')}</Text>
                    <TextInput
                        editable={false}
                        value={user?.email}
                        placeholder={t('myProfile.placeholders.email')}
                        placeholderTextColor='#9CA3AF'
                        keyboardType='email-address'
                        style={styles.readOnlyInput}
                    />

                    <Text className='font-body' style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{t('myProfile.phone')}</Text>
                    {isEditing ? (
                        <Controller
                            control={control}
                            name='phone'
                            render={({ field: { onChange, value, ref } }) => (
                                <View style={{ width: '100%' }}>
                                    <PhoneInput
                                        ref={ref || phoneInputRef}
                                        value={value || ''}
                                        onChangePhoneNumber={(phoneNumber) => onChange(phoneNumber)}
                                        defaultCountry='VE'
                                        placeholder={t('myProfile.placeholders.phone')}
                                        phoneInputStyles={{
                                            container: { ...styles.phoneContainer, opacity: 1 },
                                            flagContainer: styles.flagContainer,
                                            flag: styles.flag,
                                            caret: styles.caret,
                                            divider: styles.divider,
                                            callingCode: styles.callingCode,
                                            input: styles.phoneInput,
                                        }}
                                    />
                                    {errors.phone && <Text className='font-body' style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{errors.phone.message}</Text>}
                                </View>
                            )}
                        />
                    ) : (
                        <TextInput
                            editable={false}
                            value={user?.phone}
                            placeholder={t('myProfile.placeholders.phone')}
                            placeholderTextColor='#9CA3AF'
                            keyboardType='phone-pad'
                            style={styles.readOnlyInput}
                        />
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    readOnlyInput: {
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        color: '#111827',
        marginBottom: 10,
    },
    genderButton: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    phoneContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        height: 48,
    },
    flagContainer: {
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
    },
    flag: {
        width: 24,
        height: 16,
    },
    caret: {
        color: '#6B7280',
        fontSize: 12,
    },
    divider: {
        backgroundColor: '#E5E7EB',
    },
    callingCode: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    phoneInput: {
        fontSize: 14,
        color: '#111827',
    },
});