import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface Props {
	reserved: number;
}

export const ReservedClassesCard: React.FC<Props> = ({ reserved }) => {
	const { width } = Dimensions.get('window');
	const cardWidth = Math.min(width - 32, 382);

	return (
		<View style={[styles.card, { width: cardWidth }]}>
			<Text className='font-body' style={styles.title}>CLASES RESERVADAS</Text>
			<Text className='font-body' style={styles.value}>{reserved}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E5E5E5',
		alignSelf: 'center',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 12,
		height: 91,

		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 1,
		marginVertical: 10,
	},
	title: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 20,
		fontWeight: '400',
		color: '#171412',
		textAlign: 'center',
	},
	value: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 39,
		fontWeight: '400',
		color: '#171412',
		textAlign: 'center',
		marginTop: 4,
	},
});
