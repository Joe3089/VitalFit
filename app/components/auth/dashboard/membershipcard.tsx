import React from 'react';
import { useTranslation } from 'react-i18next';
import {
	Dimensions,
	Image,
	ImageSourcePropType,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { QrCodeIcon } from 'react-native-heroicons/outline';

interface Props {
	hasMembership: boolean;
	daysRemaining?: number;
	onQRPress?: () => void;
	onGetMembershipPress?: () => void;
	gymName?: string;
	membershipStatus?: string;
	gymImage?: ImageSourcePropType;
}

export const MembershipCard: React.FC<Props> = ({
	hasMembership,
	daysRemaining = 15,
	onQRPress,
	onGetMembershipPress,
	gymName = 'VitalFit',
	membershipStatus = 'Membresía activa',
	gymImage = require('@/assets/images/Mask group.png'),
}) => {
	const { t } = useTranslation();
	const { width } = Dimensions.get('window');
	const cardWidth = Math.min(width - 32, 600);

	const effectiveStatusText = hasMembership
		? `${membershipStatus}: ${daysRemaining} ${t('dashboard.membershipCard.daysRemaining')}`
		: t('dashboard.membershipCard.noActiveMembership');

	const handlePress = () => {
		if (hasMembership) {
			if (onQRPress) onQRPress();
			return;
		}
		if (onGetMembershipPress) onGetMembershipPress();
	};

	return (
		<View
			style={[styles.card, { width: cardWidth }]}>
			<Text className='font-heading' style={styles.welcomeText}>{t('dashboard.membershipCard.welcomeTo')} {hasMembership ? gymName : 'VitalFit'}</Text>

			<Text className='font-body' style={styles.membershipText}>{effectiveStatusText}</Text>

			<View style={styles.bottomContainer}>
				{hasMembership && (
					<Image source={gymImage} style={styles.gymImage} resizeMode='cover' />
				)}

				<TouchableOpacity
					onPress={handlePress}
					style={styles.checkInButton}
					activeOpacity={0.8}>
					{hasMembership && (
						<QrCodeIcon size={24} color='#262626' style={styles.qrIcon} />
					)}
					<Text className='font-body' style={styles.checkInText}>{hasMembership ? t('dashboard.membershipCard.checkIn') : t('dashboard.membershipCard.purchase')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#262626',
		borderRadius: 24,
		paddingHorizontal: 24,
		paddingVertical: 16,
		alignSelf: 'center',
		marginVertical: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 8,
	},
	welcomeText: {
		fontFamily: 'Inter_700Bold',
		fontSize: 20,
		fontWeight: '700',
		color: '#f97316',
		marginBottom: 0,
	},
	membershipText: {
		fontFamily: 'Inter_400Regular',
		fontSize: 15,
		fontWeight: '400',
		color: '#f97316',
		marginBottom: 10,
		marginTop: 2,
	},
	bottomContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
	},
	gymImage: {
		width: 120,
		height: 80,
		borderRadius: 12,
	},
	checkInButton: {
		backgroundColor: '#f97316',
		borderRadius: 30,
		paddingHorizontal: 18,
		paddingVertical: 10,
		flexDirection: 'row',
		alignItems: 'center',
	},
	qrIcon: {
		marginRight: 8,
	},
	checkInText: {
		fontFamily: 'Inter_700Bold',
		fontSize: 16,
		fontWeight: '600',
		color: '#262626',
	},
});
