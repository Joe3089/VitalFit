import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { ChevronDownIcon } from 'react-native-heroicons/solid';

type DropdownProps = {
	label: string;
	onPress: () => void;
};

export default function Dropdown({ label, onPress }: DropdownProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			className='bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2 flex-row items-center justify-between'>
			<ThemedText className='font-semibold text-neutral-500 dark:text-neutral-400'>
				{label}
			</ThemedText>
			<ChevronDownIcon size={16} color='#9ca3af' className='ml-2' />
		</TouchableOpacity>
	);
}
