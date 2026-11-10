import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CheckCircleIcon } from 'react-native-heroicons/solid';

type MembershipCardProps = {
	title: string;
	price: string;
	features: string[];
	period?: string; 
	isFree?: boolean; 
	badgeLabel?: string; 
	isSelected?: boolean;
	onPress?: () => void;
};

export default function MembershipCard({
	title,
	price,
	features,
	period = '/mes',
	isFree = false,
	badgeLabel,
	isSelected = false,
	onPress,
}: MembershipCardProps) {
	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={onPress}
			style={[
				styles.card,
				isSelected ? styles.cardSelected : styles.cardDefault,
			]}
		>
			<View className='flex-1 mr-4'>
				<View className='flex-row items-center justify-between mb-1'>
					<ThemedText
						lightColor={isSelected ? '#ffffff' : '#f97316'}
						darkColor={isSelected ? '#ffffff' : '#f97316'}
						className='text-base'
						style={{ fontFamily: 'BebasNeue-Regular' }}
					>
						{title}
					</ThemedText>
				</View>
				{features.length > 0 && (
					<ThemedText
						lightColor='#e5e7eb'
						darkColor='#e5e7eb'
						className='text-xs mb-2'
						style={{ fontFamily: 'Montserrat_400Regular' }}
						numberOfLines={2}
					>
						{features[0]}
					</ThemedText>
				)}

			</View>
			<View className='items-end justify-center'>
				{isFree ? (
					badgeLabel ? (
						<View className='flex-row items-center mb-1'>
							<View className='px-3 py-1 rounded-full bg-orange-500 mr-2'>
								<ThemedText
									lightColor='#ffffff'
									darkColor='#ffffff'
									className='text-[10px]'
									style={{ fontFamily: 'Montserrat_600SemiBold' }}>
										{badgeLabel}
									</ThemedText>
								</View>

							<View
								style={{
									width: 22,
									height: 22,
									borderRadius: 999,
									borderWidth: isSelected ? 0 : 2,
									borderColor: '#E5E7EB',
									alignItems: 'center',
									justifyContent: 'center',
								}}>
								{isSelected && (
									<CheckCircleIcon size={22} color='#F97316' />
								)}
							</View>
						</View>
					) : null
				) : (
					<View className='flex-row items-center mb-1'>
						<View className='flex-row items-baseline mr-2'>
							<ThemedText
								lightColor='#ffffff'
								darkColor='#ffffff'
								className='text-sm mr-1'
								style={{ fontFamily: 'Montserrat_700Bold' }}>
									${price}
								</ThemedText>
							<ThemedText
								lightColor='#e5e7eb'
								darkColor='#e5e7eb'
								className='text-xs'
								style={{ fontFamily: 'Montserrat_500Medium' }}>
									{period}
								</ThemedText>
						</View>
						<View
							style={{
								width: 22,
								height: 22,
								borderRadius: 999,
								borderWidth: isSelected ? 0 : 2,
								borderColor: '#E5E7EB',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							{isSelected && (
								<CheckCircleIcon size={22} color='#F97316' />
							)}
						</View>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderRadius: 24,
		paddingHorizontal: 20,
		paddingVertical: 12,
		marginBottom: 16,
	},
	cardDefault: {
		backgroundColor: 'transparent',
		borderColor: '#f97316',
	},
	cardSelected: {
		backgroundColor: 'transparent',
		borderColor: '#f97316',
		shadowColor: 'transparent',
		shadowOpacity: 0,
		shadowRadius: 0,
		shadowOffset: { width: 0, height: 0 },
		elevation: 0,
	},
});
