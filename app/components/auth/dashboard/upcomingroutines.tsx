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

interface Routine {
	id: string;
	title: string;
	subtitle: string;
	duration: string;
	image: ImageSourcePropType;
}

interface Props {
	routines: Routine[];
	mode?: 'member' | 'guest';
	onPrimaryActionPress?: (id: string) => void;
}

export const UpcomingRoutinesSection: React.FC<Props> = ({ routines, mode = 'member', onPrimaryActionPress }) => {
	const { t } = useTranslation();
	const { width } = Dimensions.get('window');
	const cardWidth = Math.min(width - 32, 600);
	const sectionTitle = mode === 'member' ? t('dashboard.upcomingRoutines.title') : t('dashboard.upcomingRoutines.services');
	const buttonLabel = mode === 'member' ? t('dashboard.upcomingRoutines.start') : t('dashboard.upcomingRoutines.purchase');

	return (
		<View style={styles.container}>
			<Text className='font-heading' style={styles.sectionTitle}>{sectionTitle}</Text>
			{routines.map((routine) => (
				<View
					key={routine.id}
					style={[styles.card, { width: cardWidth }]}>
					<Image
						source={require('@/assets/images/Male.png')}
						style={styles.manImage}
						resizeMode='contain'
					/>

					<View style={styles.content}>
						<View style={styles.textContainer}>
							<Text className='font-body' style={styles.subtitle}>{routine.subtitle}</Text>
							<Text className='font-body' style={styles.duration}>{routine.duration}</Text>
							<Text className='font-heading' style={styles.title}>{routine.title}</Text>
						</View>
						<TouchableOpacity
							style={styles.button}
							activeOpacity={0.8}
							onPress={() => onPrimaryActionPress && onPrimaryActionPress(routine.id)}>
							<Text className='font-body' style={styles.buttonText}>{buttonLabel}</Text>
						</TouchableOpacity>
					</View>
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginVertical: 16,
	},
	sectionTitle: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 28,
		color: '#000000',
		marginBottom: 12,
		textAlign: 'center',
	},
	card: {
		backgroundColor: '#262626',
		alignSelf: 'center',
		marginBottom: 16,
		borderRadius: 16,
		overflow: 'hidden',
		height: 160,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 5,
		elevation: 10,
		padding: 16,
		justifyContent: 'space-between',
		flexDirection: 'column',
	},
	manImage: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		height: '100%',
		width: '50%',
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingRight: '45%',
	},
	textContainer: {
		alignItems: 'flex-start',
		justifyContent: 'center',
	},
	subtitle: {
		fontFamily: 'Montserrat_500Medium',
		fontSize: 18,
		color: '#f97316',
		marginBottom: 2,
	},
	duration: {
		fontFamily: 'Montserrat_400Regular',
		fontSize: 15,
		color: '#f97316',
		marginBottom: 6,
	},
	title: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 25,
		color: '#f97316',
		fontWeight: '700',
		textAlign: 'left',
		marginBottom: 4,
	},
	button: {
		backgroundColor: '#f97316',
		paddingHorizontal: 25,
		paddingVertical: 8,
		borderRadius: 11,
		alignSelf: 'flex-start',
		width: 'auto',
	},
	buttonText: {
		fontFamily: 'Montserrat_600SemiBold',
		fontSize: 18,
		color: '#262626',
		textAlign: 'center',
		fontWeight: '600',
	},
});
