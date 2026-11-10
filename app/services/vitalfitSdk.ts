// Re-export SDK types
import {
	AssignedClientResponse,
	BranchClassInfo,
	ClassScheduleItem,
	KPICard,
	VitalFit,
	UserRoutineResponse,
	Routine,
	RoutineExercise,
	RoutineExerciseDTO,
	Exercise,
} from '@vitalfit/sdk';
import Constants from 'expo-constants';

export {
	AssignedClientResponse,
	BranchClassInfo,
	ClassScheduleItem,
	KPICard,
	UserRoutineResponse,
	Routine,
	RoutineExercise,
	RoutineExerciseDTO,
	Exercise,
};

// EXPO_PUBLIC_API_URL must include the /v1 prefix and is embedded at build time
// (app.config.js -> extra). The SDK falls back to its built-in URL when empty.
const API_URL: string | undefined =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;

// SDK instance with built-in automatic token refresh
const vitalFitApi = VitalFit.getInstance(false, API_URL);

export default vitalFitApi;
