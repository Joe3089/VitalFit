import { Colors } from '@/constants/theme';
import { Eye, EyeOff } from 'lucide-react-native'; // Importa los íconos
import { forwardRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, type TextInputProps } from 'react-native';

interface Props extends TextInputProps {
	label?: string;
	error?: string;
	helperText?: string;
	isPasswordInput?: boolean;
	icon?: React.ReactNode;
}

export const StyledTextInput = forwardRef<TextInput, Props>(
	({ label, error, helperText, isPasswordInput, icon, ...props }, ref) => {
		const isError = Boolean(error);
		const [isPasswordVisible, setIsPasswordVisible] = useState(false);
		const togglePasswordVisibility = () => {
			setIsPasswordVisible(!isPasswordVisible);
		};

		return (
			<View className='w-full'>
				{label && (
					<View className='flex-row items-center mb-1'>
						{icon}
						<Text className='text-sm text-gray-500 dark:text-gray-400 font-semibold ml-2'>
							{label}
						</Text>
					</View>
				)}
				<View className='relative flex-row items-center'>
					<TextInput
						ref={ref}
						className={`
              flex-1 border h-14 px-4 rounded-lg text-base
              text-black dark:text-white
              bg-white dark:bg-gray-800
              ${isError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              ${isPasswordInput ? 'pr-10' : ''} // Añade padding a la derecha si es campo de contraseña
            `}
						placeholderTextColor={Colors.light.icon}
						secureTextEntry={isPasswordInput ? !isPasswordVisible : false}
						{...props}
					/>
					{isPasswordInput && (
						<TouchableOpacity
							onPress={togglePasswordVisibility}
							className='absolute right-3 p-2'
							activeOpacity={0.7}>
							{isPasswordVisible ? (
								<Eye size={20} color={Colors.light.icon} />
							) : (
								<EyeOff size={20} color={Colors.light.icon} />
							)}
						</TouchableOpacity>
					)}
				</View>
				{(helperText || error) && (
					<Text className={`mt-1 text-xs ${isError ? 'text-red-500' : 'text-gray-500'}`}>
						{isError ? error : helperText}
					</Text>
				)}
			</View>
		);
	},
);

StyledTextInput.displayName = 'StyledTextInput';
