import { Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
	title: string;
}

export function SecondaryButton({ title, ...props }: Props) {
	return (
		<TouchableOpacity
			className='h-12 w-full items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700'
			{...props}>
			<Text className='font-body text-gray-700 dark:text-gray-200 text-base font-bold'>{title}</Text>
		</TouchableOpacity>
	);
}
