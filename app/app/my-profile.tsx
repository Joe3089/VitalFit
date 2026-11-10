import { PrimaryButton } from '@/components/PrimaryButton';
import { StyledTextInput } from '@/components/StyledTextInput';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { Colors, Fonts } from '@/constants/theme';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { isAPIError, User } from '@vitalfit/sdk';
import { format } from 'date-fns';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { ChevronLeftIcon, PencilSquareIcon } from 'react-native-heroicons/solid';
import PhoneInput, { IPhoneInputRef } from 'react-native-international-phone-number';

export default function MyProfileScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const phoneInputRef = useRef<IPhoneInputRef>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState<User | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [toast, setToast] = useState<{
		visible: boolean;
		type: 'success' | 'error';
		title: string;
		message: string;
	}>({
		visible: false,
		type: 'success',
		title: '',
		message: '',
	});

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [phone, setPhone] = useState('');

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const token = await AsyncStorage.getItem('token');
				if (!token) {
					console.error('❌ No se encontró token en AsyncStorage');
					return;
				}

				const userDataResponse = await vitalFitApi.user.WhoAmI(token);
				setUserData(userDataResponse.user);
				setFirstName(userDataResponse.user.first_name || '');
				setLastName(userDataResponse.user.last_name || '');
				setBirthDate(userDataResponse.user.birth_date || '');
				setPhone(userDataResponse.user.phone || '');
			} catch (error: unknown) {
				let errorMessage = t('common.error.unexpected');
				if (isAPIError(error)) {
					errorMessage = error.messages.join(', ');
				} else if (error instanceof Error) {
					errorMessage = error.message;
				}
				console.error('Error al obtener datos del usuario:', errorMessage);
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, [t]);

	const handleSaveChanges = async () => {
		try {
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				console.error('No se encontró token en AsyncStorage');
				return;
			}

			type UserUpdateRequest = {
				first_name?: string;
				last_name?: string;
				birth_date?: string;
				phone?: string;
			};

			const payload: UserUpdateRequest = {
				first_name: firstName,
				last_name: lastName,
				birth_date: birthDate,
				phone: phone,
			};

			/* eslint-disable @typescript-eslint/no-explicit-any */
			const updatedUserData = (await vitalFitApi.client.put({
				url: '/user/update',
				jwt: token,
				data: payload,
			})) as any;
			/* eslint-enable @typescript-eslint/no-explicit-any */

			const newUser = updatedUserData?.user || updatedUserData?.data || updatedUserData;
			setUserData(newUser);
			setIsEditing(false);

			setToast({
				visible: true,
				type: 'success',
				title: t('myProfile.toast.successTitle'),
				message: t('myProfile.toast.successMessage'),
			});
		} catch (error: unknown) {
			let errorMessage = t('common.error.unexpected');
			if (isAPIError(error)) {
				errorMessage = error.messages.join(', ');
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			console.error('Error al actualizar el perfil:', errorMessage);
			setToast({
				visible: true,
				type: 'error',
				title: t('common.error.unexpected'),
				message: errorMessage,
			});
		}
	};

	if (loading) {
		return (
			<ThemedView className='flex-1 justify-center items-center'>
				<ActivityIndicator size='large' color='#F27F2A' />
			</ThemedView>
		);
	}

	const fullName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.toUpperCase();
	const date = birthDate ? new Date(birthDate) : new Date();

	return (
		<ThemedView className='flex-1 bg-white dark:bg-neutral-950'>
			<Stack.Screen options={{ headerShown: false }} />

			<ToastNotification
				type={toast.type}
				title={toast.title}
				message={toast.message}
				visible={toast.visible}
				onClose={() => setToast({ ...toast, visible: false })}
			/>

			<View className='flex-row items-center justify-center pt-14 pb-4 px-4 bg-white dark:bg-neutral-900 relative'>
				<TouchableOpacity onPress={() => router.back()} className='absolute left-4 top-14'>
					<ChevronLeftIcon size={28} color='#F27F2A' />
				</TouchableOpacity>
				<ThemedText className='text-xl font-bold' style={{ fontFamily: Fonts.title }}>
					{t('myProfile.title')}
				</ThemedText>
			</View>

			<ScrollView className='flex-1 bg-white dark:bg-neutral-950'>
				<View className='items-center py-8 bg-white dark:bg-neutral-900'>
					<View className='relative'>
						<View className='w-32 h-32 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800'>
							<Image
								source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
								style={{ width: '100%', height: '100%' }}
								contentFit='cover'
							/>
						</View>
						{isEditing && (
							<TouchableOpacity className='absolute bottom-0 right-0 bg-orange-500 w-10 h-10 rounded-full items-center justify-center'>
								<PencilSquareIcon size={20} color='white' />
							</TouchableOpacity>
						)}
					</View>
					<ThemedText
						className='text-xl font-bold mt-4'
						style={{ fontFamily: Fonts.title }}>
						{fullName}
					</ThemedText>
					<ThemedText className='text-sm text-neutral-500 dark:text-neutral-400 mt-1'>
						{t('myProfile.personalAccount')}
					</ThemedText>
				</View>

				<View className='px-6 py-4'>
					<StyledTextInput
						label={t('myProfile.firstName')}
						value={firstName}
						onChangeText={setFirstName}
						editable={isEditing}
					/>
					<View className='mb-4' />

					<StyledTextInput
						label={t('myProfile.lastName')}
						value={lastName}
						onChangeText={setLastName}
						editable={isEditing}
					/>
					<View className='mb-4' />

					<StyledTextInput
						label={t('myProfile.email')}
						value={userData?.email || ''}
						editable={false}
					/>
					<View className='mb-4' />

					<StyledTextInput
						label={t('myProfile.identityDoc')}
						value={userData?.identity_document || ''}
						editable={false}
					/>
					<View className='mb-4' />

					<TouchableOpacity
						onPress={() => isEditing && setShowPicker(true)}
						style={{ position: 'relative' }}
						disabled={!isEditing}>
						<StyledTextInput
							label={t('myProfile.birthDate')}
							value={birthDate ? format(date, 'yyyy-MM-dd') : ''}
							editable={false}
							pointerEvents='none'
						/>
						<View
							style={{
								position: 'absolute',
								right: 12,
								bottom: 12,
							}}>
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
								if (selectedDate) {
									setBirthDate(selectedDate.toISOString());
								}
							}}
						/>
					)}
					<View className='mb-4' />

					<View>
						<Text className='font-body' style={styles.label}>{t('myProfile.phone')}</Text>
						<PhoneInput
							ref={phoneInputRef}
							value={phone || ''}
							onChangePhoneNumber={(phoneNumber) => setPhone(phoneNumber)}
							defaultCountry='VE'
							placeholder={t('myProfile.phone')}
							disabled={!isEditing}
							phoneInputStyles={{
								container: {
									...styles.phoneContainer,
									opacity: isEditing ? 1 : 0.6,
								},
								flagContainer: styles.flagContainer,
								flag: styles.flag,
								caret: styles.caret,
								divider: styles.divider,
								callingCode: styles.callingCode,
								input: styles.phoneInput,
							}}
						/>
					</View>
				</View>

				<View className='px-6 mt-2 mb-10'>
					<PrimaryButton
						title={isEditing ? t('myProfile.saveChanges') : t('myProfile.edit')}
						onPress={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
					/>
				</View>
			</ScrollView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	label: {
		fontSize: 14,
		fontWeight: '500',
		color: '#5C5E60',
		marginBottom: 8,
	},
	phoneContainer: {
		backgroundColor: '#F5F5F5',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E0E0E0',
		paddingHorizontal: 12,
		height: 48,
	},
	flagContainer: {
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	flag: {},
	caret: {
		color: '#5C5E60',
		fontSize: 16,
	},
	divider: {
		backgroundColor: '#E0E0E0',
	},
	callingCode: {
		color: '#1F2937',
		fontSize: 16,
		fontWeight: '500',
	},
	phoneInput: {
		color: '#1F2937',
		fontSize: 16,
	},
});
