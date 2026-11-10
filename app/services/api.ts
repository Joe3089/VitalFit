import Constants from 'expo-constants';
import { Alert } from 'react-native';

const API_URL: string | undefined =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
	process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
	console.warn('EXPO_PUBLIC_API_URL no encontrada en runtime');
	Alert.alert(
		'Error de configuración',
		'La variable EXPO_PUBLIC_API_URL no está configurada en el APK.\n\nRevisa el archivo app.config.js o EAS Secrets.',
	);

} else {
	console.log('API_URL detectada:', API_URL);
}
