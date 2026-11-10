import 'dotenv/config';

export default {
	expo: {
		name: 'VitalFit',
		slug: 'VitalFit',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/isotipo_apk.png',
		scheme: 'vitalfit',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.mrwisz.VitalFit',
		},
		android: {
			adaptiveIcon: {
				backgroundColor: '#E6F4FE',
				foregroundImage: './assets/images/isotipo_apk.png',
				backgroundImage: './assets/images/android-icon-background.png',
				monochromeImage: './assets/images/android-icon-monochrome.png',
			},
			edgeToEdgeEnabled: true,
			predictiveBackGestureEnabled: false,
			package: 'com.mrwisz.VitalFit',
			googleServicesFile: './google-services.json',
		},
		web: {
			output: 'static',
			favicon: './assets/images/favicon.png',
		},
		plugins: [
			'expo-router',
			'expo-secure-store',
			[
				'expo-splash-screen',
				{
					image: './assets/images/isotipo_apk.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#ffffff',
					dark: {
						backgroundColor: '#000000',
					},
				},
			],
			[
				'expo-camera',
				{
					cameraPermission: 'Permite a VitalFit acceder a tu cámara para escanear códigos QR de miembros.',
				},
			],
			[
				'expo-notifications',
				{
					icon: './assets/images/isotipo_apk.png',
					color: '#0891B2',
					mode: 'production',
				},
			],
			'expo-font',
			'expo-localization',
			'expo-web-browser',
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			router: {},
			eas: {
				projectId: "3d30457b-07b3-4a1a-9700-dc7fc3df59f2"
			},
			EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
		},
		owner: 'mrwisz',
	},
};