import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, View } from 'react-native';

interface Props {
	title: string;
	time: string;
	date: string;
}

export const TodayRoutineCard: React.FC<Props> = ({ title, time, date }) => {
	const { width } = Dimensions.get('window');
	const cardWidth = Math.min(width - 32, 372);

	return (
		<View style={[styles.container, { width: cardWidth }]}>
			<View style={styles.header}>
				<Text className='font-body' style={styles.title}>Mi rutina de hoy</Text>
				<Text className='font-body' style={styles.date}>{date}</Text>
			</View>

			<ImageBackground
				source={require('@/assets/images/rutina.png')}
				style={styles.image}
				imageStyle={styles.imageRadius}>
				<LinearGradient
					colors={['rgba(17,17,18,0.2)', 'rgba(17,17,18,0.6)']}
					start={{ x: 0, y: 0.2 }}
					end={{ x: 0, y: 1 }}
					style={styles.overlay}
				/>

				<View style={styles.textContainer}>
					<Text className='font-body' style={styles.imageTitle}>{title}</Text>
					<Text className='font-body' style={styles.imageSubtitle}>{time}</Text>
				</View>
			</ImageBackground>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginVertical: 10,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
		paddingHorizontal: 2,
	},
	title: {
		fontFamily: 'Montserrat_700Bold',
		fontSize: 20,
		color: '#333333',
	},
	date: {
		fontFamily: 'Montserrat_500Medium',
		fontSize: 16,
		color: '#F27F2A',
	},
	image: {
		height: 162,
		borderRadius: 16,
		overflow: 'hidden',
		justifyContent: 'flex-end',
	},
	imageRadius: {
		borderRadius: 16,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 16,
	},
	textContainer: {
		position: 'absolute',
		bottom: 16,
		left: 16,
	},
	imageTitle: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 25,
		color: '#FFFFFF',
		marginBottom: 4,
	},
	imageSubtitle: {
		fontFamily: 'Montserrat_500Medium',
		fontSize: 16,
		color: '#F27F2A',
	},
});
