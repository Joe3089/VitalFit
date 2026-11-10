import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import { useAuth } from '@/contexts/AuthContext';
import vitalFitApi from '@/services/vitalfitSdk';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = {
	id: string;
	text: string;
	isBot: boolean;
	timestamp: Date;
};

export default function ChatbotScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { token } = useAuth();
	const scrollViewRef = useRef<ScrollView>(null);

	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			text: t('chatbot.welcomeMessage'),
			isBot: true,
			timestamp: new Date(),
		},
	]);
	const [inputText, setInputText] = useState('');
	const [loading, setLoading] = useState(false);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [resetting, setResetting] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('error');
	const [toastTitle, setToastTitle] = useState('');
	const [toastMessage, setToastMessage] = useState('');

	const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
		setToastType(type);
		setToastTitle(title);
		setToastMessage(message);
		setToastVisible(true);
	};

	// Load chat history on mount
	useEffect(() => {
		const loadHistory = async () => {
			if (!token) {
				setLoadingHistory(false);
				return;
			}

			try {
				const response = await vitalFitApi.llm.getHistory(token, {
					page: 1,
					limit: 50,
					sort: 'asc',
				});

				if (response.data && response.data.length > 0) {
					const historyMessages: Message[] = response.data.map((msg) => ({
						id: msg.message_id,
						text: msg.content,
						isBot: msg.sender_role === 'assistant',
						timestamp: new Date(msg.created_at),
					}));

					// Keep welcome message if no history, otherwise use history
					setMessages(historyMessages);
				}
			} catch (error) {
				console.error('Error loading chat history:', error);
				// Keep welcome message on error
			} finally {
				setLoadingHistory(false);
			}
		};

		loadHistory();
	}, [token]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		setTimeout(() => {
			scrollViewRef.current?.scrollToEnd({ animated: true });
		}, 100);
	}, [messages]);

	const handleSend = async () => {
		if (!inputText.trim() || !token || loading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			text: inputText.trim(),
			isBot: false,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		const messageText = inputText.trim();
		setInputText('');
		setLoading(true);

		try {
			const response = await vitalFitApi.llm.chat(
				{
					message: messageText,
				},
				token
			);

			const botResponse: Message = {
				id: (Date.now() + 1).toString(),
				text: response.response,
				isBot: true,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, botResponse]);
		} catch (error) {
			console.error('Error sending message:', error);
			showToast('error', t('chatbot.error') || 'Error', t('chatbot.errorSending') || 'Failed to send message');

			// Optionally add error message to chat
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: t('chatbot.errorResponse') || 'Sorry, I encountered an error. Please try again.',
				isBot: true,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
		}
	};

	const handleResetChat = async () => {
		if (!token || resetting) return;

		try {
			setResetting(true);
			await vitalFitApi.llm.resetChat(token);

			// Clear messages and reset to welcome message
			setMessages([
				{
					id: '1',
					text: t('chatbot.welcomeMessage'),
					isBot: true,
					timestamp: new Date(),
				},
			]);

			showToast(
				'success',
				t('chatbot.resetSuccess') || 'Success',
				t('chatbot.resetMessage') || 'Chat conversation has been reset'
			);
		} catch (error) {
			console.error('Error resetting chat:', error);
			showToast(
				'error',
				t('chatbot.error') || 'Error',
				t('chatbot.resetError') || 'Failed to reset conversation'
			);
		} finally {
			setResetting(false);
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	return (
		<ThemedView lightColor='#FFFFFF' darkColor='#050816' style={{ flex: 1 }}>
			<SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					keyboardVerticalOffset={0}>
					{/* Header */}
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: 16,
							paddingVertical: 16,
							backgroundColor: '#1f2937',
						}}>
						<TouchableOpacity
							onPress={() => router.back()}
							style={{
								width: 44,
								height: 44,
								borderRadius: 22,
								backgroundColor: 'rgba(255,255,255,0.1)',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							<Ionicons name='chevron-back' size={24} color='#ffffff' />
						</TouchableOpacity>

						<View
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: '#f97316',
								alignItems: 'center',
								justifyContent: 'center',
								marginLeft: 12,
							}}>
							<Ionicons name='fitness' size={26} color='#ffffff' />
						</View>

						<View style={{ flex: 1, marginLeft: 12 }}>
							<ThemedText
								style={{
									color: '#ffffff',
									fontFamily: 'BebasNeue-Regular',
									fontSize: 22,
									letterSpacing: 0.5,
								}}>
								{t('chatbot.title')}
							</ThemedText>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
								<View
									style={{
										width: 8,
										height: 8,
										borderRadius: 4,
										backgroundColor: '#22c55e',
										marginRight: 6,
									}}
								/>
								<ThemedText
									style={{
										color: '#9ca3af',
										fontSize: 13,
									}}>
									{t('chatbot.online')}
								</ThemedText>
							</View>
						</View>

						<TouchableOpacity
							onPress={handleResetChat}
							disabled={resetting}
							style={{
								width: 44,
								height: 44,
								borderRadius: 22,
								backgroundColor: 'rgba(255,255,255,0.1)',
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: 8,
							}}>
							{resetting ? (
								<ActivityIndicator size="small" color="#ffffff" />
							) : (
								<Ionicons name='refresh' size={20} color='#ffffff' />
							)}
						</TouchableOpacity>

						<Image
							source={require('@/assets/images/Frame.png')}
							style={{ width: 44, height: 44, resizeMode: 'contain' }}
						/>
					</View>

					{/* Messages */}
					<ScrollView
						ref={scrollViewRef}
						style={{ flex: 1 }}
						contentContainerStyle={{
							paddingHorizontal: 16,
							paddingVertical: 16,
						}}
						showsVerticalScrollIndicator={false}>
						{loadingHistory ? (
							<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
								<ActivityIndicator size="large" color="#f97316" />
								<ThemedText style={{ color: '#9ca3af', marginTop: 12, fontSize: 14 }}>
									{t('chatbot.loadingHistory') || 'Loading chat history...'}
								</ThemedText>
							</View>
						) : (
							messages.map((message) => (
							<View
								key={message.id}
								style={{
									flexDirection: 'row',
									justifyContent: message.isBot ? 'flex-start' : 'flex-end',
									marginBottom: 12,
								}}>
								{message.isBot && (
									<View
										style={{
											width: 32,
											height: 32,
											borderRadius: 16,
											backgroundColor: '#f97316',
											alignItems: 'center',
											justifyContent: 'center',
											marginRight: 8,
										}}>
										<Ionicons name='fitness' size={18} color='#ffffff' />
									</View>
								)}
								<View
									style={{
										maxWidth: '75%',
										backgroundColor: message.isBot ? '#f97316' : '#1f2937',
										borderRadius: 16,
										borderTopLeftRadius: message.isBot ? 4 : 16,
										borderTopRightRadius: message.isBot ? 16 : 4,
										paddingHorizontal: 14,
										paddingVertical: 10,
									}}>
									<ThemedText
										style={{
											color: '#ffffff',
											fontSize: 14,
											lineHeight: 20,
										}}>
										{message.text}
									</ThemedText>
									<ThemedText
										style={{
											color: message.isBot ? 'rgba(255,255,255,0.7)' : '#9ca3af',
											fontSize: 10,
											marginTop: 4,
											textAlign: message.isBot ? 'left' : 'right',
										}}>
										{formatTime(message.timestamp)}
									</ThemedText>
								</View>
							</View>
						))
						)}

						{/* Loading indicator while waiting for AI response */}
						{loading && (
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'flex-start',
									marginBottom: 12,
								}}>
								<View
									style={{
										width: 32,
										height: 32,
										borderRadius: 16,
										backgroundColor: '#f97316',
										alignItems: 'center',
										justifyContent: 'center',
										marginRight: 8,
									}}>
									<Ionicons name='fitness' size={18} color='#ffffff' />
								</View>
								<View
									style={{
										backgroundColor: '#f97316',
										borderRadius: 16,
										borderTopLeftRadius: 4,
										paddingHorizontal: 14,
										paddingVertical: 10,
										flexDirection: 'row',
										alignItems: 'center',
										gap: 8,
									}}>
									<ActivityIndicator size="small" color="#ffffff" />
									<ThemedText style={{ color: '#ffffff', fontSize: 14 }}>
										{t('chatbot.typing') || 'AI is typing...'}
									</ThemedText>
								</View>
							</View>
						)}
					</ScrollView>

					{/* Quick Actions */}
					<View
						style={{
							paddingHorizontal: 16,
							paddingVertical: 8,
						}}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 8 }}>
							{[
								{ key: 'classSchedules', label: t('chatbot.quickActions.classSchedules') },
								{ key: 'myMembership', label: t('chatbot.quickActions.myMembership') },
								{ key: 'bookClass', label: t('chatbot.quickActions.bookClass') },
								{ key: 'contactSupport', label: t('chatbot.quickActions.contactSupport') },
							].map((action) => (
								<TouchableOpacity
									key={action.key}
									onPress={() => setInputText(action.label)}
									style={{
										backgroundColor: '#f97316',
										borderRadius: 20,
										paddingHorizontal: 14,
										paddingVertical: 8,
									}}>
									<ThemedText
										style={{
											color: '#ffffff',
											fontSize: 13,
											fontWeight: '500',
										}}>
										{action.label}
									</ThemedText>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>

					{/* Input */}
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							paddingHorizontal: 16,
							paddingVertical: 12,
							paddingBottom: Platform.OS === 'ios' ? 12 : 16,
							borderTopWidth: 1,
							borderTopColor: '#27272a',
							gap: 12,
						}}>
						<View
							style={{
								flex: 1,
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: '#1f2937',
								borderRadius: 24,
								paddingHorizontal: 16,
							}}>
							<TextInput
								value={inputText}
								onChangeText={setInputText}
								placeholder={t('chatbot.inputPlaceholder')}
								placeholderTextColor='#71717a'
								style={{
									flex: 1,
									color: '#ffffff',
									fontSize: 14,
									paddingVertical: 12,
								}}
								multiline
								maxLength={500}
								onSubmitEditing={handleSend}
							/>
						</View>
						<TouchableOpacity
							onPress={handleSend}
							disabled={!inputText.trim() || loading}
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								backgroundColor: '#1f2937',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							{loading ? (
								<ActivityIndicator size="small" color="#f97316" />
							) : (
								<Ionicons
									name='send'
									size={20}
									color={inputText.trim() ? '#f97316' : '#71717a'}
								/>
							)}
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>

			<ToastNotification
				visible={toastVisible}
				type={toastType}
				title={toastTitle}
				message={toastMessage}
				onClose={() => setToastVisible(false)}
			/>
		</ThemedView>
	);
}
