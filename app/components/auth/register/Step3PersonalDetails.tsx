import { Colors } from '@/constants/theme';
import { RegisterData } from '@/schemas/register';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import Checkbox from 'expo-checkbox';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next'; // <---
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PhoneInput from 'react-native-international-phone-number';
import { PrimaryButton } from '../../PrimaryButton';
import { StyledTextInput } from '../../StyledTextInput';

interface Props {
    control: Control<RegisterData>;
    errors: FieldErrors<RegisterData>;
    onSubmit: () => void;
    onPrevStep: () => void;
}

export function Step3PersonalDetails({ control, errors, onSubmit, onPrevStep }: Props) {
    const { t } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);

    return (
        <>
            <TouchableOpacity
                onPress={onPrevStep}
                style={{
                    position: 'absolute',
                    top: -200,
                    left: 8,
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

            <ScrollView
                style={{ width: '100%' }}
                contentContainerStyle={{ alignItems: 'center', paddingVertical: 16, gap: 16 }}>

                <Controller
                    control={control}
                    name='name'
                    render={({ field: { onChange, onBlur, value } }) => (
                        <StyledTextInput
                            label={t('step3PersonalDetails.nameLabel')}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.name?.message}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name='lastName'
                    render={({ field: { onChange, onBlur, value } }) => (
                        <StyledTextInput
                            label={t('step3PersonalDetails.lastNameLabel')}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.lastName?.message}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name='documentId'
                    render={({ field: { onChange, onBlur, value } }) => (
                        <StyledTextInput
                            label={t('step3PersonalDetails.documentIdLabel')}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.documentId?.message}
                        />
                    )}
                />

                <Controller
                    control={control}
                    name='birthDate'
                    render={({ field: { onChange, value } }) => {
                        const date = value ? new Date(value) : new Date();
                        return (
                            <View style={{ width: '100%' }}>
                                <TouchableOpacity
                                    onPress={() => setShowPicker(true)}
                                    style={{ position: 'relative' }}>
                                    <StyledTextInput
                                        label={t('step3PersonalDetails.birthDateLabel')}
                                        value={value ? format(date, 'yyyy-MM-dd') : ''}
                                        editable={false}
                                        pointerEvents='none'
                                        error={errors.birthDate?.message}
                                    />
                                    <View style={{ position: 'absolute', right: 12, bottom: 12 }}>
                                        <Calendar size={20} color={Colors.light.icon} />
                                    </View>
                                </TouchableOpacity>
                                {showPicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode='date'
                                        display='default'
                                        onChange={(event, selectedDate) => {
                                            setShowPicker(false);
                                            if (selectedDate) onChange(selectedDate.toISOString());
                                        }}
                                    />
                                )}
                            </View>
                        );
                    }}
                />

                <Controller
                    control={control}
                    name='phone'
                    render={({ field: { onChange, value, ref } }) => (
                        <View style={{ width: '100%' }}>
                            <Text style={styles.label}>{t('step3PersonalDetails.phoneLabel')}</Text>
                            <PhoneInput
                                ref={ref}
                                value={value || ''}
                                onChangePhoneNumber={(phone) => onChange(phone)}
                                defaultCountry='VE'
                                placeholder={t('step3PersonalDetails.phonePlaceholder')}
                                phoneInputStyles={{
                                    container: styles.phoneContainer,
                                    flagContainer: styles.flagContainer,
                                    flag: styles.flag,
                                    caret: styles.caret,
                                    divider: styles.divider,
                                    callingCode: styles.callingCode,
                                    input: styles.phoneInput,
                                }}
                            />
                            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                        </View>
                    )}
                />

                <Controller
                    control={control}
                    name='acceptTerms'
                    render={({ field: { onChange, value } }) => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
                            <Checkbox value={value} onValueChange={onChange} color={value ? Colors.light.tint : undefined} />
                            <Text style={{ color: '#5C5E60' }}>
                                {t('step3PersonalDetails.acceptTerms')}
                                <Text style={{ color: Colors.light.tint }}>
                                    {t('step3PersonalDetails.termsAndConditions')}
                                </Text>
                            </Text>
                        </View>
                    )}
                />

                <PrimaryButton
                    title={t('step3PersonalDetails.createAccountButton')}
                    onPress={onSubmit}
                />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: 14, fontWeight: '500', color: '#5C5E60', marginBottom: 8 },
    phoneContainer: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, height: 48 },
    flagContainer: { backgroundColor: 'transparent', justifyContent: 'center' },
    flag: {},
    caret: { color: '#5C5E60', fontSize: 16 },
    divider: { backgroundColor: '#E0E0E0' },
    callingCode: { color: '#1F2937', fontSize: 16, fontWeight: '500' },
    phoneInput: { color: '#1F2937', fontSize: 16 },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },
});