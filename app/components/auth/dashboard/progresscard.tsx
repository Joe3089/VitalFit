import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { CalendarDaysIcon } from 'react-native-heroicons/mini';

interface Props {
	weekProgress: number;
	calories: number;
	completed: string;
}

export const ProgressCard: React.FC<Props> = ({ weekProgress, calories, completed }) => {
	const { width } = Dimensions.get('window');
	const cardWidth = Math.min(width - 32, 380);

	return (
		<View style={[styles.container, { width: cardWidth }]}>
			<View style={styles.header}>
				<Text className='font-body' style={styles.title}>TU PROGRESO</Text>
				<Text className='font-body' style={styles.link}>VER MÁS</Text>
			</View>

			<View style={styles.cardsContainer}>
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<Text className='font-body' style={styles.cardTitle}>ESTA SEMANA</Text>
						<CalendarDaysIcon size={19} color='#0F172A' />
					</View>
					<Text className='font-body' style={styles.cardValue}>{completed}</Text>
					<View style={styles.progressBarBackground}>
						<View
							style={[styles.progressBarFill, { width: `${weekProgress * 100}%` }]}
						/>
					</View>
				</View>

				<View style={styles.card}>
					<Text className='font-body' style={styles.cardTitle}>CALORÍAS ESTIMADAS</Text>
					<Text className='font-body' style={styles.cardValue}>{calories}</Text>
					<View style={styles.progressBarBackground}>
						<View style={[styles.progressBarFill, { width: '90%' }]} />
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 14,
		marginVertical: 10,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
	},
	title: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 20,
		color: '#1F2024',
	},
	link: {
		fontFamily: 'Inter_600SemiBold',
		fontSize: 13,
		color: '#F27F2A',
	},
	cardsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
	},
	card: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#E5E5E5',
		borderRadius: 8,
		padding: 12,
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 1,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cardTitle: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 20,
		color: '#171412',
	},
	cardValue: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 39,
		color: '#000000',
		marginBottom: 6,
	},
	progressBarBackground: {
		height: 8,
		borderRadius: 4,
		backgroundColor: '#E5E7EB',
	},
	progressBarFill: {
		height: 8,
		borderRadius: 4,
		backgroundColor: '#F27F2A',
	},
});
