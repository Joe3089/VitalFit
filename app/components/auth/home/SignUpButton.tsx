import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
	label?: string;
	onPress?: () => void;
	disabled?: boolean;
	containerStyle?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
};

export function SignUpButton({
	label = 'Sign up',
	onPress,
	disabled,
	containerStyle,
	textStyle,
}: Props) {
	return (
		<TouchableOpacity
			accessibilityRole='button'
			activeOpacity={0.8}
			onPress={onPress}
			disabled={disabled}
			style={[styles.base, styles.filled, containerStyle]}>
			<Text style={[styles.text, textStyle]}>{label}</Text>
		</TouchableOpacity>
	);
}

const BUTTON_H = 46;
const PADDING_V = 8;

const styles = StyleSheet.create({
	base: {
		height: BUTTON_H,
		borderRadius: 25,
		paddingVertical: PADDING_V,
		paddingHorizontal: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	filled: {
		backgroundColor: '#F27F2A',
	},
	text: {
		color: '#FFFFFF',
		fontSize: 18,
		lineHeight: BUTTON_H - PADDING_V * 2,
		fontFamily: 'Montserrat-ExtraBold',
		textAlign: 'center',
		includeFontPadding: false,
		textAlignVertical: 'center',
	},
});
