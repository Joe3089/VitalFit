import { ActivityIndicator, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
	title: string;
	isLoading?: boolean;
}

export function PrimaryButton({ title, style, isLoading, ...props }: Props) {
	return (
		<TouchableOpacity
			className='h-12 w-full items-center justify-center rounded-full'
			style={[{ backgroundColor: '#f97316' }, style]}
			disabled={isLoading}
			{...props}>
			{isLoading ? (
				<ActivityIndicator color="white" />
			) : (
				<Text className='font-body text-white text-base font-bold'>{title}</Text>
			)}
		</TouchableOpacity>
	);
}
