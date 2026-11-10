import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserAvatar } from '@/components/UserAvatar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	BackHandler,
	Image,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TFunction } from 'i18next';

// Format date helper
const formatFullDate = (
	dateString: string | undefined,
	t: TFunction,
	i18n: { language: string },
) => {
	if (!dateString) return t('common.dateUndefined');

	// Handle if dateString is full ISO or just YYYY-MM-DD
	const cleanDate = dateString.split('T')[0];
	const [year, monthIndex, dayNumber] = cleanDate.split('-').map(Number);
	const date = new Date(year, (monthIndex || 1) - 1, dayNumber || 1);

	const day = date.getDate();
	const month = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(date);
	const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(date);

	const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

	return `${capitalizedWeekday}, ${day} ${t('common.of')} ${month} ${t('common.of')} ${year}`;
};

export default function ClassDetailsScreen() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const params = useLocalSearchParams<{
		id?: string;
		name?: string;
		date?: string;
		time?: string;
		capacity?: string;
		enrolled?: string;
		status?: string;
		instructor?: string;
		description?: string;
		instructorImage?: string;
		serviceImage?: string;
		notes?: string;
	}>();

	const [searchText, setSearchText] = useState('');
	// Client List State
	interface Client {
		name: string;
		email: string;
		image: string;
		id: string;
	}
	const [clients, setClients] = useState<Client[]>([]);
	const [loadingClients, setLoadingClients] = useState(false);

	const [currentEnrolled, setCurrentEnrolled] = useState(Number(params.enrolled || 0));
	const [imageError, setImageError] = useState(false);

	useFocusEffect(
		useCallback(() => {
			const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
				router.replace('/(recepcionist)/schedule');
				return true;
			});

			// Fetch latest booking count & Client List
			if (params.id) {
				(async () => {
					try {
						const token = await AsyncStorage.getItem('token');
						if (!token) return;

						// 1. Fetch Booking Count
						try {
							const res = await vitalFitApi.booking.getClassBookingCount(
								params.id!,
								token,
							);
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const data = res as any;
							const val =
								data.count ?? data.total ?? (typeof res === 'number' ? res : 0);
							setCurrentEnrolled(Number(val));
						} catch (e) {
							console.error('Failed to fetch booking count:', e);
						}

						// 2. Fetch Client List
						setLoadingClients(true);
						try {
							// Fetch bookings for this class
							// Pagination params: page 1, limit 100 (assuming reasonable class size)
							const bookingsRes = await vitalFitApi.booking.getBookingClass(
								params.id!,
								token,
								{ page: 1, limit: 100 },
							);

							const bookingItems = bookingsRes?.data || []; // Adjust based on actual response structure: PaginatedTotal has .data

							// Fetch profile pics in parallel (or optimize if bulk endpoint exists - standard is GetUserByID)
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const promises = bookingItems.map(async (booking: any) => {
								const userId = booking.user_id;
								let profilePic = '';

								// Try to fetch user profile for image
								if (userId) {
									try {
										const userRes = await vitalFitApi.user.GetUserByID(
											userId,
											token,
										);
										profilePic = userRes?.data?.profile_picture_url || '';
									} catch {
										// Ignore individual user fetch error, just show default avatar
									}
								}

								return {
									name:
										`${booking.first_name || ''} ${booking.last_name || ''}`.trim() ||
										t('common.unknown'),
									email: booking.email || '',
									image: profilePic,
									id: booking.booking_id || Math.random().toString(),
								};
							});

							const results = await Promise.all(promises);
							setClients(results);
						} catch (e) {
							console.error('Failed to fetch client list:', e);
						} finally {
							setLoadingClients(false);
						}
					} catch (e) {
						console.error('General error in fetch:', e);
					}
				})();
			}

			return () => backHandler.remove();
		}, [router, params.id, t]), // added t to deps
	);

	const name = params.name || t('classDetails.defaultName');
	const date = params.date || '';
	const time = params.time || '';
	const capacity = Number(params.capacity || 0);
	const enrolled = currentEnrolled; // Use state
	const status = params.status || 'available';
	const instructorName = params.instructor || t('classDetails.defaultInstructor');

	const formattedDate = formatFullDate(date, t, i18n);
	const description = params.description || t('classes.description.default');

	// Images
	const heroImageSource = params.serviceImage ? { uri: params.serviceImage } : null;

	const instructorImageSource = params.instructorImage
		? { uri: params.instructorImage }
		: undefined;

	const notes = params.notes || '';

	const isFull = status === 'full' || (capacity > 0 && enrolled >= capacity);

	const filteredClients = clients.filter((client) =>
		client.name.toLowerCase().includes(searchText.toLowerCase()),
	);

	const [showAllClients, setShowAllClients] = useState(false);
	const displayedClients = showAllClients ? filteredClients : filteredClients.slice(0, 5);

	return (
		<ThemedView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.imageWrapper}>
					{heroImageSource && !imageError ? (
						<Image
							source={heroImageSource}
							style={styles.heroImage}
							resizeMode='cover'
							onError={() => setImageError(true)}
						/>
					) : (
						<View
							style={[
								styles.heroImage,
								{
									backgroundColor: '#000000',
									justifyContent: 'center',
									alignItems: 'center',
								},
							]}>
							<Image
								source={require('@/assets/images/isotipo.png')}
								style={{ width: 160, height: 160 }}
								resizeMode='contain'
							/>
						</View>
					)}
				</View>

				<View style={styles.content}>
					<ThemedText className='font-heading' style={styles.className}>
						{name}
					</ThemedText>

					<View style={styles.metaBlock}>
						<ThemedText className='font-body' style={styles.dateText}>
							{formattedDate}
						</ThemedText>
						<ThemedText className='font-body' style={styles.capacityText}>
							{currentEnrolled}/{capacity} {t('schedule.spotsOccupied')}
						</ThemedText>
						<ThemedText className='font-body' style={styles.timeText}>
							{time}
						</ThemedText>
						<ThemedText className='font-body' style={styles.durationText}>
							{t('classDetails.duration')}
						</ThemedText>
					</View>

					<View style={styles.instructorCard}>
						{instructorImageSource ? (
							<Image source={instructorImageSource} style={styles.instructorPhoto} />
						) : (
							<UserAvatar
								name={instructorName}
								size={32}
								style={{ marginRight: 8 }}
							/>
						)}

						<View style={styles.instructorInfo}>
							<ThemedText className='font-body' style={styles.instructorName}>
								{instructorName}
							</ThemedText>
						</View>
					</View>

					{/* Client List Section */}
					<View style={styles.clientSection}>
						<View style={styles.clientHeader}>
							<ThemedText className='font-heading' style={styles.sectionTitle}>
								{t('classDetails.clientList')} ({clients.length})
							</ThemedText>
						</View>

						<View style={styles.searchBar}>
							<TextInput
								style={styles.searchInput}
								placeholder={t('classDetails.searchPlaceholder')}
								placeholderTextColor='#9CA3AF'
								value={searchText}
								onChangeText={setSearchText}
							/>
						</View>

						{loadingClients ? (
							<ActivityIndicator
								size='small'
								color='#F97316'
								style={{ marginTop: 20 }}
							/>
						) : (
							<View style={styles.clientsList}>
								{displayedClients.length > 0 ? (
									displayedClients.map((client) => (
										<View key={client.id} style={styles.clientRow}>
											<View style={styles.clientAvatarContainer}>
												<UserAvatar
													name={client.name}
													imageUrl={client.image}
													size={40}
												/>
											</View>
											<View style={styles.clientInfo}>
												<ThemedText
													className='font-body'
													style={styles.clientName}>
													{client.name}
												</ThemedText>
												<ThemedText
													className='font-body'
													style={styles.clientEmail}>
													{client.email}
												</ThemedText>
											</View>
										</View>
									))
								) : (
									<ThemedText
										style={{
											color: '#6B7280',
											textAlign: 'center',
											marginTop: 10,
										}}>
										{t('classDetails.noClientsFound')}
									</ThemedText>
								)}
							</View>
						)}

						{!loadingClients && filteredClients.length > 5 && (
							<TouchableOpacity
								style={styles.viewAllButton}
								onPress={() => setShowAllClients(!showAllClients)}
								activeOpacity={0.8}>
								<ThemedText style={styles.viewAllButtonText}>
									{showAllClients
										? t('classDetails.showLess')
										: t('classDetails.viewAllRegistered')}
								</ThemedText>
							</TouchableOpacity>
						)}
					</View>

					<View style={styles.section}>
						<ThemedText className='font-heading' style={styles.sectionTitle}>
							{t('classDetails.descriptionTitle')}
						</ThemedText>
						<ThemedText className='font-body' style={styles.sectionBody}>
							{description}
						</ThemedText>
					</View>

					{notes ? (
						<View style={[styles.section, { marginTop: 8 }]}>
							<ThemedText className='font-heading' style={styles.sectionTitle}>
								{t('common.notes')}
							</ThemedText>
							<ThemedText className='font-body' style={styles.sectionBody}>
								{notes}
							</ThemedText>
						</View>
					) : null}

					{isFull ? (
						<TouchableOpacity style={styles.fullButton} activeOpacity={0.8}>
							<ThemedText className='font-body' style={styles.fullButtonText}>
								{t('classDetails.classFull')}
							</ThemedText>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={styles.primaryButton}
							activeOpacity={0.8}
							onPress={() => {
								const queryParams = new URLSearchParams({
									id: params.id || '',
									name: name,
									date: date,
									time: time,
									capacity: capacity.toString(),
									enrolled: enrolled.toString(),
									status: status,
									instructor: instructorName,
									instructorImage: params.instructorImage || '',
									serviceImage: params.serviceImage || '',
									description: description,
									notes: notes,
								});
								router.push(
									`/(recepcionist)/enroll-client?${queryParams.toString()}`,
								);
							}}>
							<ThemedText className='font-body' style={styles.primaryButtonText}>
								{t('classDetails.enrollClient')}
							</ThemedText>
						</TouchableOpacity>
					)}
				</View>
			</ScrollView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
	},
	scrollContent: {
		paddingBottom: 32,
	},
	imageWrapper: {
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	heroImage: {
		width: '100%',
		height: 180,
		borderRadius: 16,
	},
	content: {
		padding: 20,
	},
	className: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#1F2937',
	},
	metaBlock: {
		marginBottom: 24,
	},
	dateText: {
		fontSize: 16,
		color: '#4B5563',
		marginBottom: 4,
	},
	capacityText: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 4,
	},
	timeText: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 4,
	},
	durationText: {
		fontSize: 14,
		color: '#9CA3AF',
	},
	instructorCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F97316', // Orange background
		padding: 8,
		borderRadius: 999, // Pill shape
		marginBottom: 24,
		paddingRight: 16,
		alignSelf: 'flex-start',
	},
	instructorPhoto: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 8,
	},
	instructorAvatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255,255,255,0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	instructorInfo: {
		justifyContent: 'center',
	},
	instructorName: {
		fontSize: 14,
		fontWeight: '500',
		color: '#FFFFFF', // White text
		marginBottom: 0,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 4,
	},
	sectionBody: {
		fontSize: 13,
		color: '#4B5563',
		lineHeight: 18,
	},
	searchWrapper: {
		marginBottom: 16,
	},
	searchInput: {
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 14,
		backgroundColor: '#FFFFFF',
	},
	clientsHeader: {
		marginBottom: 8,
	},
	clientsTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	clientsTitle: {
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
	},
	clientsList: {
		marginBottom: 12,
	},
	clientCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	clientAvatar: {
		width: 32,
		height: 32,
		borderRadius: 999,
	},
	// New Styles for Dynamic List
	clientSection: {
		marginTop: 20,
		marginBottom: 30,
	},
	clientHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	searchBar: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	clientRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	clientAvatarContainer: {
		marginRight: 12,
	},
	clientAvatarImg: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	clientAvatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#E5E7EB',
		justifyContent: 'center',
		alignItems: 'center',
	},
	clientEmail: {
		fontSize: 13,
		color: '#6B7280',
	},
	clientInfo: {
		flex: 1,
	},
	clientName: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1F2937',
	},
	section: {
		marginBottom: 16,
	},

	viewAllButton: {
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#F97316',
		paddingVertical: 10,
		alignItems: 'center',
		marginTop: 4,
		marginBottom: 12,
	},
	viewAllButtonText: {
		fontSize: 14,
		color: '#F97316',
		fontWeight: '500',
	},
	primaryButton: {
		borderRadius: 999,
		backgroundColor: '#F97316',
		paddingVertical: 12,
		alignItems: 'center',
		marginBottom: 48,
	},
	primaryButtonText: {
		fontSize: 14,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	fullButton: {
		borderRadius: 999,
		backgroundColor: '#EF4444',
		paddingVertical: 12,
		alignItems: 'center',
		marginBottom: 24,
	},
	fullButtonText: {
		fontSize: 14,
		color: '#FFFFFF',
		fontWeight: '600',
	},
});
