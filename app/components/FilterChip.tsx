import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/solid';

type FilterChipProps = {
	label: string;
	isSelected: boolean;
	onPress: () => void;
};

export default function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			className={`rounded-full px-4 py-2 mr-2 flex-row items-center ${
				isSelected ? 'bg-orange-500' : 'bg-neutral-100 dark:bg-neutral-800'
			}`}>
			<ThemedText
				className={`font-semibold ${
					isSelected ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
				}`}>
				{label}
			</ThemedText>
			{isSelected && <XMarkIcon size={16} color='white' className='ml-2' />}
		</TouchableOpacity>
	);
}
