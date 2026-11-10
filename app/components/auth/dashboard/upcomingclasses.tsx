import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ClientBookingResponse } from '@vitalfit/sdk';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { CalendarIcon, ClockIcon, MapPinIcon, TagIcon, UserIcon } from 'react-native-heroicons/solid';

// Removed DefaultClassImage constant

interface ClassItem {
	id: string;
	title: string; // Service Name
	time: string;
	instructor: string;
	branch: string;
	imageUrl: ImageSourcePropType | null;
	rawDate: string;
}

export const UpcomingClassesCarousel: React.FC = () => {
	const { t } = useTranslation();
	const { width } = Dimensions.get('window');
	const cardWidth = width * 0.75;

	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchUpcomingClasses = async () => {
		try {
			setLoading(true);
			const token = await AsyncStorage.getItem('token');
			if (!token) {
				setClasses([]);
				return;
			}

			// 1. Get User ID
			const whoAmI = (await vitalFitApi.user.WhoAmI(token)) as unknown as { user?: { id?: string; user_id?: string } };
			const userId = whoAmI?.user?.id || whoAmI?.user?.user_id;

			if (!userId) {
				setClasses([]);
				return;
			}

			// 2. Get Bookings
			const bookingsResp = await vitalFitApi.booking.getClientBooking(userId, token);
			const bookingsData = ((bookingsResp as unknown as { data: ClientBookingResponse[] }).data || []) as (ClientBookingResponse & { status?: string })[];

			// Filter future bookings and sort
			const now = new Date();
			const upcomingBookings = bookingsData
				.filter((b) => new Date(b.starts_at!) > now && b.status !== 'cancelled' && b.status !== 'absent')
				.sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
				.slice(0, 3); // Top 3

			if (upcomingBookings.length === 0) {
				setClasses([]);
				return;
			}

			// 3. Enrich with Class and Service Details
			const enrichedClasses: ClassItem[] = await Promise.all(
				upcomingBookings.map(async (booking) => {
					let serviceName = booking.service_name || 'Clase';
					let imageUrl: ImageSourcePropType | null = null;
					const instructorName = booking.instructor || 'Instructor';
					const branchName = booking.branch_name || 'Sucursal';
					const startTime = new Date(booking.starts_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
					const endTime = new Date(booking.ends_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

					try {
						// Get Class Details to ensure we have the correct service_id
						if (booking.class_id) {
							const classResp = await vitalFitApi.schedule.GetClassByID(booking.class_id, token);
							const classData = (classResp as unknown as { data: { service_id?: string } }).data;

							if (classData) {
								// Get Service Details for Image
								if (classData.service_id) {
									const serviceResp = await vitalFitApi.products.getServiceByID(classData.service_id, token);
									const serviceData = (serviceResp as unknown as { data: { name?: string; images?: { is_primary?: boolean; image_url?: string }[] } }).data;
									
									if (serviceData) {
										serviceName = serviceData.name || serviceName;
										if (serviceData.images && serviceData.images.length > 0) {
											const primary = serviceData.images.find((img) => img.is_primary) || serviceData.images[0];
											if (primary?.image_url) {
												imageUrl = { uri: primary.image_url };
											}
										}
									}
								}
							}
						}
					} catch (err) {
						console.log('Error fetching details for booking', booking.booking_id, err);
					}

					return {
						id: booking.booking_id!,
						title: serviceName,
						time: `${startTime} - ${endTime}`,
						instructor: instructorName,
						branch: branchName,
						imageUrl: imageUrl,
						rawDate: booking.starts_at!,
					};
				})
			);

			setClasses(enrichedClasses);

		} catch (error) {
			console.error('Error fetching upcoming classes', error);
			setClasses([]);
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			fetchUpcomingClasses();
		}, [])
	);

	const renderEmptyState = () => (
		<View style={[styles.emptyCard, { width: '100%', backgroundColor: '#262626' }]}>
			<View style={styles.emptyContent}>
				<CalendarIcon size={80} color='#FF6B2C' />
				<Text className='text-center mt-6 font-heading text-2xl' style={{ color: '#FF6B2C' }}>
					{t('schedule.noBookings')}
				</Text>
				<Text className='text-center mt-2 font-body text-base' style={{ color: '#FF6B2C' }}>
					{t('dashboard.upcomingClasses.bookNow')}
				</Text>
			</View>
		</View>
	);

	if (loading && classes.length === 0) {
		// Optional: Show loading skeleton or keep empty
		return <View style={styles.container} />;
	}

	return (
		<View style={styles.container}>
			<Text className='font-heading' style={styles.carouselTitle}>{t('dashboard.upcomingClasses.title')}</Text>

			{classes.length > 0 ? (
				<FlatList
					data={classes}
					renderItem={({ item }) => <ClassCard item={item} cardWidth={cardWidth} />}
					keyExtractor={(item) => item.id}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.listContainer}
					snapToInterval={cardWidth + 16}
					decelerationRate='fast'
				/>
			) : (
				<View style={{ paddingHorizontal: 16 }}>
					{renderEmptyState()}
				</View>
			)}
		</View>
	);
};

const ClassCard: React.FC<{ item: ClassItem; cardWidth: number }> = ({ item, cardWidth }) => {
	const { t } = useTranslation();
	// Local state for cycling details: 0=Time, 1=Instructor, 2=Branch
	const [activeDetailIndex, setActiveDetailIndex] = useState(0);
	const [imageError, setImageError] = useState(false);

	React.useEffect(() => {
		const interval = setInterval(() => {
			setActiveDetailIndex((prev) => (prev + 1) % 4);
		}, 3000); // Cycle every 3 seconds
		return () => clearInterval(interval);
	}, []);

	const renderActiveDetail = () => {
		switch (activeDetailIndex) {
			case 0: // Class Name (New)
				return (
					<View style={styles.detailBlock}>
						<View style={styles.iconCircle}>
							<TagIcon size={14} color='#000000' />
						</View>
						<View style={styles.textGroup}>
							<Text style={styles.detailTitle}>{t('common.category') || 'CLASE'}</Text>
							<Text style={styles.detailValue} numberOfLines={1}>{item.title}</Text>
						</View>
					</View>
				);
			case 1: // Time
				return (
					<View style={styles.detailBlock}>
						<View style={styles.iconCircle}>
							<ClockIcon size={14} color='#000000' />
						</View>
						<View style={styles.textGroup}>
							<Text style={styles.detailTitle}>{t('dashboard.upcomingClasses.time')}</Text>
							<Text style={styles.detailValue}>{item.time}</Text>
						</View>
					</View>
				);
			case 2: // Instructor
				return (
					<View style={styles.detailBlock}>
						<View style={[styles.iconCircle, styles.orangeIconCircle]}>
							<UserIcon size={14} color='#000000' />
						</View>
						<View style={styles.textGroup}>
							<Text style={styles.detailTitle}>{t('common.instructor')}</Text>
							<Text style={styles.detailValue} numberOfLines={1}>{item.instructor}</Text>
						</View>
					</View>
				);
			case 3: // Branch
				return (
					<View style={styles.detailBlock}>
						<View style={[styles.iconCircle, styles.orangeIconCircle]}>
							<MapPinIcon size={14} color='#000000' />
						</View>
						<View style={styles.textGroup}>
							<Text style={styles.detailTitle}>{t('dashboard.upcomingClasses.branch', 'SUCURSAL')}</Text>
							<Text style={styles.detailValue} numberOfLines={1}>{item.branch}</Text>
						</View>
					</View>
				);
			default:
				return null;
		}
	};

	return (
		<View style={[styles.card, { width: cardWidth }]}>
			<View style={styles.imageWrapper}>
				{item.imageUrl && !imageError ? (
					<Image 
						source={item.imageUrl} 
						style={styles.image} 
						onError={() => setImageError(true)}
					/>
				) : (
					<View style={styles.fallbackContainer}>
						<Image source={require('@/assets/images/isotipo.png')} style={styles.fallbackImage} resizeMode='contain' />
					</View>
				)}
			</View>

			<View style={styles.detailsPill}>
				{renderActiveDetail()}
			</View>
		</View>
	);
};

const ORANGE_COLOR = '#FF6B2C';

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'transparent',
		marginBottom: 20,
	},
	carouselTitle: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 28,
		color: '#000000',
		marginBottom: 12,
		textAlign: 'center',
	},
	listContainer: {
		paddingHorizontal: 16,
	},
	card: {
		backgroundColor: 'transparent',
		borderRadius: 18,
		marginRight: 16,
		overflow: 'visible',
		height: 200,
		position: 'relative',
	},
	emptyCard: {
		backgroundColor: '#171717', // Neutral 900
		borderRadius: 18,
		height: 180,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#262626',
	},
	emptyContent: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	imageWrapper: {
		width: '100%',
		height: '100%',
		borderRadius: 18,
		overflow: 'hidden',
		right: 15,
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	detailsPill: {
		position: 'absolute',
		bottom: 10,
		left: 0,
		right: 30,
		backgroundColor: 'rgba(20, 20, 20, 0.85)',
		borderRadius: 12,
		borderWidth: 0.5,
		borderColor: 'rgba(166, 226, 46, 0.3)',
		padding: 12,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	detailBlock: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	separator: {
		width: 1,
		height: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		marginHorizontal: 8,
	},
	iconCircle: {
		backgroundColor: ORANGE_COLOR,
		borderRadius: 8,
		padding: 4,
		marginRight: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	orangeIconCircle: {
		backgroundColor: ORANGE_COLOR,
	},
	textGroup: {
		justifyContent: 'center',
		flex: 1,
	},
	detailTitle: {
		fontFamily: 'Montserrat_500Medium',
		fontSize: 9,
		color: '#FFFFFF',
		textTransform: 'uppercase',
		marginBottom: 2,
		opacity: 0.7,
	},
	detailValue: {
		fontFamily: 'Montserrat_700Bold',
		fontSize: 11,
		color: '#FFFFFF',
	},
	fallbackContainer: {
		width: '100%',
		height: '100%',
		backgroundColor: '#000000',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fallbackImage: {
		width: 160,
		height: 160,
	},
});

