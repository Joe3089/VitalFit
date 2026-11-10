import { Dumbbell } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlagIcon, TrophyIcon } from 'react-native-heroicons/outline';

interface Challenge {
	id: string;
	title: string;
	current: number;
	total: number;
	iconType: 'trophy' | 'dumbbell' | 'target';
}

interface Props {
	challenges: Challenge[];
}

export const ChallengesSection: React.FC<Props> = ({ challenges }) => {
	const renderIcon = (iconType: string) => {
		switch (iconType) {
			case 'trophy':
				return <TrophyIcon size={32} color='#F27F2A' />;
			case 'dumbbell':
				return <Dumbbell size={32} color='#F27F2A' strokeWidth={2} />;
			case 'target':
				return <FlagIcon size={32} color='#F27F2A' />;
			default:
				return <FlagIcon size={32} color='#F27F2A' />;
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.cardsContainer}>
				{challenges.map((challenge) => (
					<View key={challenge.id} style={styles.card}>
						<View style={styles.iconContainer}>{renderIcon(challenge.iconType)}</View>
						<Text className='font-heading' style={styles.value}>
							{challenge.current}/{challenge.total}
						</Text>
						<Text className='font-body' style={styles.label} numberOfLines={2}>
							{challenge.title.replace(' ', '\n')}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginVertical: 10,
	},
	cardsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10,
	},
	card: {
		flex: 1,
		aspectRatio: 1,
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#F27F2A',
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	iconContainer: {
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	value: {
		fontFamily: 'BebasNeue-Regular',
		fontSize: 28,
		color: '#000000',
		lineHeight: 32,
	},
	label: {
		fontFamily: 'Montserrat_500Medium',
		fontSize: 11,
		color: '#333333',
		textAlign: 'center',
		lineHeight: 14,
		height: 28,
	},
});

export default ChallengesSection;
