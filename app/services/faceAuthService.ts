import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;

export interface FaceEnrollmentResponse {
	success: boolean;
	message: string;
}

export interface FaceCheckInResponse {
	access_type: string;
	check_in_time: string;
	message: string;
	service_name: string;
	user_id?: string;
	user?: {
		first_name: string;
		last_name: string;
	};
}

export async function enrollFace(imageUri: string): Promise<FaceEnrollmentResponse> {
	const token = await AsyncStorage.getItem('token');
	if (!token) {
		throw new Error('No authentication token found');
	}

	// Compress and resize image
	const manipulatedImage = await manipulateAsync(
		imageUri,
		[{ resize: { width: 800 } }],
		{ compress: 0.7, format: SaveFormat.JPEG }
	);

	// Create FormData with file
	const formData = new FormData();
	formData.append('selfie', {
		uri: manipulatedImage.uri,
		type: 'image/jpeg',
		name: 'selfie.jpg',
	} as unknown as Blob);

	const response = await fetch(`${API_URL}/face-auth/enroll`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || 'Failed to enroll face');
	}

	return response.json();
}

export async function checkInWithFace(imageUri: string, branchId: string): Promise<FaceCheckInResponse> {
	const token = await AsyncStorage.getItem('token');
	if (!token) {
		throw new Error('No authentication token found');
	}

	// Compress and resize image
	const manipulatedImage = await manipulateAsync(
		imageUri,
		[{ resize: { width: 800 } }],
		{ compress: 0.7, format: SaveFormat.JPEG }
	);

	// Create FormData with file and branch_id
	const formData = new FormData();
	formData.append('checkin_photo', {
		uri: manipulatedImage.uri,
		type: 'image/jpeg',
		name: 'checkin.jpg',
	} as unknown as Blob);
	formData.append('branch_id', branchId);

	const response = await fetch(`${API_URL}/access/check-in/face`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || 'Failed to check-in with face');
	}

	return response.json();
}
