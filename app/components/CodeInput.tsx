import { useRef, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputKeyPressEventData, View } from 'react-native';

interface Props {
	onComplete: (code: string) => void;
	hasError?: boolean;
}

const CODE_LENGTH = 6;

export function CodeInput({ onComplete, hasError }: Props) {
	const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
	const inputs = useRef<(TextInput | null)[]>([]);

	const handleTextChange = (text: string, index: number) => {
		const newCode = [...code];
		newCode[index] = text;
		setCode(newCode);

		if (text && index < CODE_LENGTH - 1) {
			inputs.current[index + 1]?.focus();
		}

		if (newCode.every((char) => char !== '')) {
			onComplete(newCode.join(''));
		}
	};

	const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
		if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
			inputs.current[index - 1]?.focus();
		}
	};

	return (
		<View className='flex-row justify-between w-full my-4'>
			{Array(CODE_LENGTH)
				.fill(0)
				.map((_, index) => (
					<TextInput
						key={index}
						ref={(el) => {
							inputs.current[index] = el;
						}}
						className={`
              w-12 h-14 border rounded-lg text-center text-2xl font-bold text-black dark:text-white
              ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            `}
						keyboardType='default'
						maxLength={1}
						value={code[index]}
						onChangeText={(text) => handleTextChange(text, index)}
						onKeyPress={(e) => handleKeyPress(e, index)}
						autoCapitalize='characters'
					/>
				))}
		</View>
	);
}
