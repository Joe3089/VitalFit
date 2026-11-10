import { AntDesign } from '@expo/vector-icons';
import { Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
	title: string;
	iconName: React.ComponentProps<typeof AntDesign>['name'];
}

export function SocialButton({ title, iconName, ...props }: Props) {
	return (
		<TouchableOpacity
			className='h-12 w-full flex-row items-center justify-center rounded-md border border-gray-300 bg-white dark:bg-transparent dark:border-gray-600'
			{...props}>
			<AntDesign name={iconName} size={18} color='#1A1A1A' style={{ marginRight: 12 }} />
			<Text className='font-body text-black text-base font-bold'>{title}</Text>
		</TouchableOpacity>
	);
}
