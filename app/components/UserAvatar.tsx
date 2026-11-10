import { Fonts } from '@/constants/theme';
import React, { useMemo } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface UserAvatarProps {
	name: string;
	imageUrl?: string | null;
	size?: number;
	style?: StyleProp<ViewStyle>;
	imageStyle?: StyleProp<ImageStyle>;
}

const AVATAR_COLORS = [
	'#F27F2A', // naranjaVital
	'#42672D', // verdeVital
	'#EA232D', // rojoIntenso
	'#5C5E60', // grisOscuro
	'#2E86C1', // Azul fuerte
	'#8E44AD', // Púrpura
	'#16A085', // Verde azulado
	'#F39C12', // Naranja amarillento
	'#D35400', // Calabaza
	'#2C3E50', // Azul medianoche
];

const getInitials = (name: string): string => {
	if (!name) return '';
	const words = name.trim().split(/\s+/);
	if (words.length === 1) {
		return words[0].charAt(0).toUpperCase();
	}
	return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

const getBackgroundColor = (name: string): string => {
	let hash = 0;
	if (name.length === 0) return AVATAR_COLORS[0];
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const index = Math.abs(hash) % AVATAR_COLORS.length;
	return AVATAR_COLORS[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
	name,
	imageUrl,
	size = 40,
	style,
	imageStyle,
}) => {
	const containerStyle = {
		width: size,
		height: size,
		borderRadius: size / 2,
	};

	const [imageError, setImageError] = React.useState(false);
	const initials = useMemo(() => getInitials(name), [name]);
	const backgroundColor = useMemo(() => getBackgroundColor(name), [name]);

	if (imageUrl && !imageError) {
		return (
			<Image
				source={{ uri: imageUrl }}
				style={[styles.image, containerStyle, imageStyle, style as StyleProp<ImageStyle>]}
				resizeMode="cover"
				onError={() => setImageError(true)}
			/>
		);
	}

	return (
		<View style={[styles.container, containerStyle, { backgroundColor }, style]}>
			<Text
				style={[
					styles.text,
					{ fontSize: size * 0.4 }, // Ajusta el tamaño de la fuente dinámicamente
				]}
				allowFontScaling={false}>
				{initials}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	image: {
		overflow: 'hidden',
	},
	text: {
		color: '#FFFFFF',
		fontFamily: Fonts.medium,
		textAlign: 'center',
	},
});
