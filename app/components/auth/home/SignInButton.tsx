import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
	label?: string;
	onPress?: () => void;
	disabled?: boolean;
	containerStyle?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
};

export function SignInButton({
	label = 'Sign in',
	onPress,
	disabled,
	containerStyle,
	textStyle,
}: Props) {
	const [pressed, setPressed] = useState(false);

	return (
		<TouchableOpacity
			accessibilityRole='button'
			activeOpacity={0.8}
			onPress={onPress}
			disabled={disabled}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			style={[styles.base, styles.outline, containerStyle, pressed && styles.pressed]}>
			<Text style={[styles.text, styles.textOutline, textStyle]}>{label}</Text>
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
		backgroundColor: 'transparent',
	},
	outline: {
		borderWidth: 2,
		borderColor: '#D2D2D2',
	},
	pressed: {
		backgroundColor: 'rgba(255,255,255,0.2)',
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
	textOutline: {
		color: '#FFFFFF',
	},
});
