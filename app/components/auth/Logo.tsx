import { Image } from 'expo-image';

export function Logo() {
	return (
		<Image
			source={require('@/assets/images/Component 1.svg')}
			style={{ width: 150, height: 150, marginBottom: 24 }}
			contentFit='contain'
		/>
	);
}

export function LogoSimple({ size = 200 }: { size?: number }) {
	return (
		<Image
			source={require('@/assets/images/isotipo.png')}
			style={{ width: size, height: size, marginBottom: 16 }}
			contentFit='contain'
		/>
	);
}
