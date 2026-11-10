import type { PaginationRequest } from './utils';
import type { User } from './user';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Cardio'
  | 'FullBody'
  | 'Other';

export type RoutineLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type RoutineStatus = 'Active' | 'Completed' | 'Archived';

export type RoutineExerciseDTO = {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_time: number;
  order: number;
  notes: string;
};

export type CreateRoutineRequest = {
  name: string;
  description: string;
  level: RoutineLevel | string;
  service_id?: string;
  exercises: RoutineExerciseDTO[];
};

export type UpdateRoutineRequest = CreateRoutineRequest;

export type AssignRoutineRequest = {
  client_id: string;
  routine_id: string;
  due_date?: string;
};

export type CreateExerciseRequest = {
  name: string;
  description: string;
  video_url: string;
  muscle_group: MuscleGroup | string;
};

export type UserRoutineResponse = {
  user_routine_id: string;
  routine_id: string;
  service_id?: string;
  routine_name: string;
  level: string;
  instructor: string;
  assigned_date: string;
  due_date?: string;
  status: string;
  completion_count: number;
  last_completed_at?: string;
};

export type Exercise = {
  exercise_id: string;
  name: string;
  description: string;
  video_url: string;
  muscle_group: MuscleGroup | string;
  created_at: string;
  updated_at: string;
};

export type RoutineExercise = {
  routine_exercise_id: string;
  routine_id: string;
  exercise_id: string;
  exercise_details?: Exercise;
  sets: number;
  reps: string;
  rest_time: number;
  order: number;
  notes: string;
};

export type Routine = {
  routine_id: string;
  service_id?: string;
  name: string;
  description: string;
  creator_id?: string;
  creator?: User;
  level: RoutineLevel | string;
  exercises?: RoutineExercise[];
  created_at: string;
  updated_at: string;
};
