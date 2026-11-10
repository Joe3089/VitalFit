import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraIcon, CheckCircleIcon, MagnifyingGlassIcon, QrCodeIcon } from 'react-native-heroicons/mini';

interface ValidateCheckInCardProps {
	onScanPress?: () => void;
	onFaceScanPress?: () => void;
	onEmailCheckIn?: (userId: string, userName: string) => void;
	onEmailCheckInError?: (errorMessage: string) => void;
	branchId?: string;
}

export function ValidateCheckInCard({
	onScanPress,
	onFaceScanPress,
	onEmailCheckIn,
	onEmailCheckInError,
	branchId
}: ValidateCheckInCardProps) {
	const { t } = useTranslation();
	const [email, setEmail] = useState('');
	const [isSearching, setIsSearching] = useState(false);

	const handleEmailCheckIn = useCallback(async () => {
		if (!email.trim()) {
			onEmailCheckInError?.(t('dashboard.validateCheckIn.emailRequired'));
			return;
		}

		if (!branchId) {
			onEmailCheckInError?.(t('checkIn.error.selectBranch'));
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			onEmailCheckInError?.(t('dashboard.validateCheckIn.invalidEmail'));
			return;
		}

		setIsSearching(true);

		try {
			const vitalFitApi = (await import('@/services')).default;
			const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

			const token = await AsyncStorage.getItem('token');
			if (!token) {
				onEmailCheckInError?.(t('common.error.sessionExpired'));
				setIsSearching(false);
				return;
			}

			console.log('[ValidateCheckInCard] Searching for user with email:', email.trim());

			// Step 1: Get user by email
			let userResponse;
			try {
				userResponse = await vitalFitApi.user.getUserByEmail(email.trim(), token);
				console.log('[ValidateCheckInCard] User API raw response:', JSON.stringify(userResponse, null, 2));
			} catch (apiError) {
				console.error('[ValidateCheckInCard] API call failed:', apiError);
				throw apiError; // Re-throw to be caught by outer catch
			}

			// Wait a small moment to ensure response is fully processed
			await new Promise(resolve => setTimeout(resolve, 100));

			// Handle different response structures
			const user = userResponse?.data || userResponse;

			console.log('[ValidateCheckInCard] Extracted user data:', JSON.stringify(user, null, 2));

			if (!user) {
				console.error('[ValidateCheckInCard] No user data in response');
				onEmailCheckInError?.(t('dashboard.validateCheckIn.userNotFound'));
				setIsSearching(false);
				return;
			}

			// Check for user_id in different possible locations
			const userAny = user as Record<string, unknown>;
			const userId = (user.user_id || userAny.id || userAny.userId) as string;

			console.log('[ValidateCheckInCard] User found:', {
				userId: userId,
				user_id: user.user_id,
				id: userAny.id,
				first_name: user.first_name,
				last_name: user.last_name,
				email: user.email,
				fullUserObject: user
			});

			if (!userId) {
				console.error('[ValidateCheckInCard] User data missing user_id. Available keys:', Object.keys(user));
				onEmailCheckInError?.(t('dashboard.validateCheckIn.userNotFound'));
				setIsSearching(false);
				return;
			}

			const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || email;

			// Step 2: Process check-in if callback is provided
			if (onEmailCheckIn) {
				console.log('[ValidateCheckInCard] Calling onEmailCheckIn callback with:', {
					userId: userId,
					userName: userName
				});

				// Small delay before calling callback to ensure state is ready
				await new Promise(resolve => setTimeout(resolve, 50));

				onEmailCheckIn(userId, userName);
				setEmail(''); // Clear input on success
			}
		} catch (error) {
			console.error('[ValidateCheckInCard] Error in email check-in:', error);
			const errorObj = error as { message?: string; status?: number; response?: unknown; stack?: string };
			console.error('[ValidateCheckInCard] Error details:', {
				message: errorObj.message,
				status: errorObj.status,
				response: errorObj.response,
				stack: errorObj.stack
			});

			try {
				const { isAPIError } = await import('@vitalfit/sdk');

				if (isAPIError(error)) {
					console.log('[ValidateCheckInCard] API Error - Status:', errorObj.status);
					if (errorObj.status === 404) {
						onEmailCheckInError?.(t('dashboard.validateCheckIn.userNotFound'));
					} else if (errorObj.status === 401) {
						onEmailCheckInError?.(t('common.error.sessionExpired'));
					} else {
						// Check for specific error messages
						const apiError = error as { messages?: string[]; message?: string };
						const errorMsg = apiError.messages?.[0] || apiError.message || t('common.error.default');
						onEmailCheckInError?.(errorMsg);
					}
				} else if (errorObj.message) {
					onEmailCheckInError?.(errorObj.message);
				} else {
					onEmailCheckInError?.(t('common.error.connection'));
				}
			} catch (importError) {
				console.error('[ValidateCheckInCard] Error importing isAPIError:', importError);
				onEmailCheckInError?.(errorObj.message || t('common.error.default'));
			}
		} finally {
			setIsSearching(false);
		}
	}, [email, branchId, onEmailCheckIn, onEmailCheckInError, t]);

	// Handle Enter key press on input
	const handleSubmitEditing = () => {
		handleEmailCheckIn();
	};

	return (
		<View className='bg-white dark:bg-neutral-900 rounded-2xl p-4 mt-4 shadow-sm border border-[#f97316]'>
			<View className='flex-row items-center mb-3'>
				<CheckCircleIcon width={20} height={20} color='#0F172A' />
				<Text className='ml-2 text-[16px] font-semibold text-neutral-900 dark:text-white'>
					{t('dashboard.validateCheckIn.title')}
				</Text>
			</View>

			<View className='flex-row items-center border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 mb-2'>
				<MagnifyingGlassIcon width={18} height={18} color='#71727A' />
				<TextInput
					value={email}
					onChangeText={setEmail}
					onSubmitEditing={handleSubmitEditing}
					placeholder={t('dashboard.validateCheckIn.searchPlaceholder')}
					placeholderTextColor='#71727A'
					className='ml-2 flex-1 text-[15px] text-neutral-900 dark:text-white'
					keyboardType='email-address'
					autoCapitalize='none'
					autoCorrect={false}
					editable={!isSearching}
					returnKeyType='search'
				/>
				{isSearching && (
					<ActivityIndicator size='small' color='#f97316' />
				)}
			</View>

			<TouchableOpacity
				onPress={handleEmailCheckIn}
				activeOpacity={0.8}
				disabled={isSearching || !email.trim()}
				className={`flex-row items-center justify-center rounded-xl px-3 py-2 mb-2 ${
					isSearching || !email.trim()
						? 'bg-neutral-200 dark:bg-neutral-800'
						: 'bg-[#f97316]'
				}`}>
				<CheckCircleIcon
					width={16}
					height={16}
					color={isSearching || !email.trim() ? '#71727A' : '#FFFFFF'}
				/>
				<Text className={`ml-2 text-[15px] font-medium ${
					isSearching || !email.trim()
						? 'text-neutral-500 dark:text-neutral-600'
						: 'text-white'
				}`}>
					{isSearching
						? t('dashboard.validateCheckIn.searching')
						: t('dashboard.validateCheckIn.checkInByEmail')}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				onPress={onScanPress}
				activeOpacity={0.8}
				className='flex-row items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 mb-2'>
				<QrCodeIcon width={16} height={16} color='#0F172A' />
				<Text className='ml-2 text-[15px] font-medium text-neutral-900 dark:text-white'>
					{t('dashboard.validateCheckIn.scanQr')}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				onPress={onFaceScanPress}
				activeOpacity={0.8}
				className='flex-row items-center justify-center border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2'>
				<CameraIcon width={16} height={16} color='#0F172A' />
				<Text className='ml-2 text-[15px] font-medium text-neutral-900 dark:text-white'>
					{t('dashboard.validateCheckIn.scanFace')}
				</Text>
			</TouchableOpacity>
		</View>
	);
}
