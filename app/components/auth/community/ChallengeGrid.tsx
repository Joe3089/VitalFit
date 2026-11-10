import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export type ChallengeGridProps = {
	onPlankPress?: () => void;
	onSprintPress?: () => void;
	onSquatPress?: () => void;
};

export default function ChallengeGrid({
	onPlankPress,
	onSprintPress,
	onSquatPress,
}: ChallengeGridProps) {
	return (
		<View className='mt-6'>
			<Text className='text-neutral-500 font-semibold mb-3'>Challenge</Text>

			<View className='flex-row justify-between'>
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={onPlankPress}
					className='flex-1 aspect-square rounded-2xl mr-3 relative overflow-hidden'
					style={{ backgroundColor: '#F27F2A', padding: 12 }}>
					<Image
						source={require('@/assets/images/flame.png')}
						style={{
							width: 72,
							height: 72,
							position: 'absolute',
							right: 12,
							bottom: 12,
						}}
						resizeMode='contain'
					/>
					<View style={{ position: 'absolute', left: 12, bottom: 12 }}>
						<Text className='font-body' style={{ color: '#111827', fontWeight: '600', fontSize: 16 }}>
							Plank{'\n'}Challenge
						</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={onSprintPress}
					className='flex-1 aspect-square bg-neutral-800 rounded-2xl mr-3 relative overflow-hidden'
					style={{ padding: 12 }}>
					<Image
						source={require('@/assets/images/run.png')}
						style={{
							width: 72,
							height: 72,
							position: 'absolute',
							right: 12,
							bottom: 12,
						}}
						resizeMode='contain'
					/>
					<View style={{ position: 'absolute', left: 12, bottom: 12 }}>
						<Text className='font-body' style={{ color: '#e5e7eb', fontWeight: '600', fontSize: 16 }}>
							Sprint{'\n'}Challenge
						</Text>
					</View>
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.85}
					onPress={onSquatPress}
					className='flex-1 aspect-square bg-white rounded-2xl border border-neutral-200 relative overflow-hidden'
					style={{ padding: 12 }}>
					<Image
						source={require('@/assets/images/water.png')}
						style={{
							width: 72,
							height: 72,
							position: 'absolute',
							right: 12,
							bottom: 12,
						}}
						resizeMode='contain'
					/>
					<View style={{ position: 'absolute', left: 12, bottom: 12 }}>
						<Text className='font-body' style={{ color: '#111827', fontWeight: '600', fontSize: 16 }}>
							Squat{'\n'}Challenge
						</Text>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
