import { UserAvatar } from '@/components/UserAvatar';
import { Award, Bell } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
	name: string;
	avatarUrl?: string;
	role?: string;
	onBadgesPress?: () => void;
	onNotificationPress?: () => void;
	hasUnreadNotifications?: boolean;
}

export const UserHeader: React.FC<Props> = ({
	name,
	avatarUrl,
	role,
	onBadgesPress,
	onNotificationPress,
	hasUnreadNotifications = false
}) => {
	const firstName = name.split(' ')[0];
	const userRole = role?.toLowerCase();

	return (
		<View className='mb-6 mt-2'>
			<View style={styles.logoContainer}>
				<Image
					source={require('@/assets/images/Frame.png')}
					style={styles.logo}
					resizeMode='contain'
				/>
			</View>

			<View className='mt-6 flex-row items-center justify-between'>
				<View className='flex-1 flex-row items-center'>
					<UserAvatar
						name={name}
						imageUrl={avatarUrl}
						size={70}
						style={{ marginRight: 12 }}
					/>
					<View>
						<Text
							className='font-heading'
							style={{
								fontFamily: 'BebasNeue-Regular',
								fontWeight: '700',
								fontSize: 31,
								color: '#000',
							}}>
							{firstName}
						</Text>
					</View>
				</View>

				<View className='flex-row items-center gap-3'>
					{onBadgesPress && (
						<TouchableOpacity onPress={onBadgesPress} activeOpacity={0.7}>
							<Award size={24} color='#333' strokeWidth={2} />
						</TouchableOpacity>
					)}

					{userRole === 'client' && (
						<TouchableOpacity
							onPress={onNotificationPress}
							className='relative'
							activeOpacity={0.7}>
							<Bell size={24} color='#333' />
							{hasUnreadNotifications && (
								<View className='absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500' />
							)}
						</TouchableOpacity>
					)}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	logoContainer: {
		alignItems: 'center',
		marginBottom: 8,
	},
	logo: {
		width: 150,
		height: 50,
	},
});
