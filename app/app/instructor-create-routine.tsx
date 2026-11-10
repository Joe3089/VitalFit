import { ThemedText } from '@/components/themed-text';
import { ToastNotification } from '@/components/ToastNotification';
import { useAuth } from '@/contexts/AuthContext';
import type { Exercise, RoutineExerciseDTO } from '@/services/vitalfitSdk';
import vitalFitApi from '@/services/vitalfitSdk';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, PlusIcon, TrashIcon, XMarkIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

type RoutineExerciseInput = {
  tempId: string;
  exercise?: Exercise;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_time: number;
  order: number;
  notes: string;
};

export default function InstructorCreateRoutineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    clientId?: string;
    clientName?: string;
  }>();

  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineLevel, setRoutineLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [exercises, setExercises] = useState<RoutineExerciseInput[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exercisePage, setExercisePage] = useState(1);
  const [hasMoreExercises, setHasMoreExercises] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
  };

  const fetchExercises = React.useCallback(async (page: number = 1, reset: boolean = false) => {
    if (!token || (!reset && !hasMoreExercises)) return;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await vitalFitApi.routine.getExercises(token, { page, limit: 20 });
      const newExercises = response.data || [];

      if (reset) {
        setAvailableExercises(newExercises);
      } else {
        setAvailableExercises((prev) => [...prev, ...newExercises]);
      }

      setHasMoreExercises(newExercises.length === 20);
      setExercisePage(page);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      showToast('error', t('instructor.createRoutine.error') || 'Error', t('instructor.createRoutine.errorLoadingExercises') || 'Could not load exercises');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token, hasMoreExercises, t]);

  useEffect(() => {
    if (token) {
      fetchExercises(1, true);
    }
  }, [token, fetchExercises]);

  const loadMoreExercises = () => {
    if (!loadingMore && hasMoreExercises) {
      fetchExercises(exercisePage + 1, false);
    }
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise: RoutineExerciseInput = {
      tempId: `temp-${Date.now()}`,
      exercise: exercise,
      exercise_id: exercise.exercise_id,
      sets: 3,
      reps: '10',
      rest_time: 60,
      order: exercises.length + 1,
      notes: '',
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseSelector(false);
  };

  const removeExercise = (tempId: string) => {
    setExercises(exercises.filter((ex) => ex.tempId !== tempId));
  };

  const updateExercise = (tempId: string, field: keyof RoutineExerciseInput, value: string | number) => {
    setExercises(
      exercises.map((ex) => (ex.tempId === tempId ? { ...ex, [field]: value } : ex))
    );
  };

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      showToast('error', t('instructor.createRoutine.error') || 'Error', t('instructor.createRoutine.nameRequired') || 'Please enter a routine name');
      return;
    }

    if (exercises.length === 0) {
      showToast('error', t('instructor.createRoutine.error') || 'Error', t('instructor.createRoutine.exercisesRequired') || 'Please add at least one exercise');
      return;
    }

    if (!token) return;

    try {
      setCreating(true);

      const exercisesPayload: RoutineExerciseDTO[] = exercises.map((ex, index) => ({
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        rest_time: ex.rest_time,
        order: index + 1,
        notes: ex.notes,
      }));

      const routine = await vitalFitApi.routine.createRoutine(
        {
          name: routineName,
          description: routineDescription,
          level: routineLevel,
          exercises: exercisesPayload,
        },
        token
      );

      // If we have a clientId, assign the routine immediately
      if (params.clientId && routine.routine_id) {
        await vitalFitApi.routine.assignRoutine(
          {
            client_id: params.clientId,
            routine_id: routine.routine_id,
          },
          token
        );

        showToast('success', t('instructor.createRoutine.success') || 'Success', t('instructor.createRoutine.routineCreatedAndAssigned') || 'Routine created and assigned successfully!');

        setTimeout(() => router.back(), 1500);
      } else {
        showToast('success', t('instructor.createRoutine.success') || 'Success', t('instructor.createRoutine.routineCreated') || 'Routine created successfully!');

        setTimeout(() => router.back(), 1500);
      }
    } catch (error) {
      console.error('Error creating routine:', error);
      showToast('error', t('instructor.createRoutine.error') || 'Error', t('instructor.createRoutine.errorCreating') || 'Could not create routine');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
            {t('instructor.createRoutine.loading') || 'Loading exercises...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 96 }}
      >
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={require('@/assets/images/Frame.png')}
            style={{ width: 150, height: 50, resizeMode: 'contain' }}
          />
        </View>

        <View
          style={{
            width: '100%',
            backgroundColor: '#F3F4F6',
            borderRadius: 16,
            paddingVertical: 8,
            marginBottom: 12,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}
          >
            <ChevronLeftIcon width={20} height={20} color='#f97316' />
          </TouchableOpacity>

          <ThemedText
            lightColor='#111827'
            style={{ fontFamily: 'System', fontSize: 16, fontWeight: '600' }}
          >
            {t('instructor.createRoutine.title')}
          </ThemedText>
        </View>

        {params.clientName && (
          <View style={{ marginBottom: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF7ED', borderRadius: 12 }}>
            <Text style={{ color: '#111827', fontSize: 14, fontWeight: '600' }} className="font-body">
              {t('instructor.createRoutine.assigningTo') || 'Assigning to'}: {params.clientName}
            </Text>
          </View>
        )}

        {/* Routine Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4, fontWeight: '600' }} className="font-body">
            {t('instructor.createRoutine.routineName')}
          </Text>
          <TextInput
            placeholder={t('instructor.createRoutine.routineNamePlaceholder') || 'Enter routine name'}
            placeholderTextColor='#9CA3AF'
            value={routineName}
            onChangeText={setRoutineName}
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: '#111827',
            }}
            className="font-body"
          />
        </View>

        {/* Routine Description */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4, fontWeight: '600' }} className="font-body">
            {t('instructor.createRoutine.routineDescription')}
          </Text>
          <TextInput
            placeholder={t('instructor.createRoutine.routineDescriptionPlaceholder') || 'Enter routine description'}
            placeholderTextColor='#9CA3AF'
            value={routineDescription}
            onChangeText={setRoutineDescription}
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#d1d5db',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              minHeight: 80,
              textAlignVertical: 'top',
              fontSize: 14,
              color: '#111827',
            }}
            className="font-body"
          />
        </View>

        {/* Routine Level */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4, fontWeight: '600' }} className="font-body">
            {t('instructor.createRoutine.routineLevel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                activeOpacity={0.8}
                onPress={() => setRoutineLevel(level)}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: routineLevel === level ? '#f97316' : '#e5e7eb',
                  backgroundColor: routineLevel === level ? '#FFF7ED' : '#FFFFFF',
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: routineLevel === level ? '#f97316' : '#6b7280',
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                  className="font-body"
                >
                  {t(`instructor.createRoutine.levels.${level.toLowerCase()}`) || level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercises */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 }} className="font-heading">
            {t('instructor.createRoutine.exercises')}
          </Text>

          {exercises.length > 0 ? (
            exercises.map((ex) => (
              <LinearGradient
                key={ex.tempId}
                colors={['#3A2618', '#F27F2A', '#3A2618']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ borderRadius: 16, padding: 14, marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16, flex: 1 }} className="font-body">
                    {ex.exercise?.name || 'Exercise'}
                  </Text>
                  <TouchableOpacity onPress={() => removeExercise(ex.tempId)}>
                    <TrashIcon size={20} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginBottom: 4 }} className="font-body">
                      {t('routine.sets') || 'Sets'}
                    </Text>
                    <TextInput
                      value={ex.sets.toString()}
                      onChangeText={(text) => updateExercise(ex.tempId, 'sets', parseInt(text) || 0)}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                      className="font-body"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginBottom: 4 }} className="font-body">
                      {t('routine.reps') || 'Reps'}
                    </Text>
                    <TextInput
                      value={ex.reps}
                      onChangeText={(text) => updateExercise(ex.tempId, 'reps', text)}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                      className="font-body"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginBottom: 4 }} className="font-body">
                      {t('routine.rest') || 'Rest (s)'}
                    </Text>
                    <TextInput
                      value={ex.rest_time.toString()}
                      onChangeText={(text) => updateExercise(ex.tempId, 'rest_time', parseInt(text) || 0)}
                      keyboardType="number-pad"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                      className="font-body"
                    />
                  </View>
                </View>

                <TextInput
                  placeholder={t('instructor.createRoutine.notesPlaceholder') || 'Notes (optional)'}
                  placeholderTextColor='rgba(255,255,255,0.5)'
                  value={ex.notes}
                  onChangeText={(text) => updateExercise(ex.tempId, 'notes', text)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    color: '#FFFFFF',
                    fontSize: 12,
                  }}
                  className="font-body"
                />
              </LinearGradient>
            ))
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }} className="font-body">
                {t('instructor.createRoutine.noExercisesYet') || 'No exercises added yet'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowExerciseSelector(!showExerciseSelector)}
            style={{
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#f97316',
              borderStyle: 'dashed',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#FFF7ED',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showExerciseSelector ? (
              <XMarkIcon width={20} height={20} color='#f97316' />
            ) : (
              <PlusIcon width={20} height={20} color='#f97316' />
            )}
            <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '700', marginLeft: 8 }} className="font-body">
              {showExerciseSelector
                ? t('instructor.createRoutine.closeExerciseList') || 'Close'
                : t('instructor.createRoutine.addExercise') || 'Add Exercise'}
            </Text>
          </TouchableOpacity>

          {/* Exercise Selector */}
          {showExerciseSelector && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: '#111827', fontSize: 14, fontWeight: '700', marginBottom: 8 }} className="font-heading">
                {t('instructor.createRoutine.selectExercise')}
              </Text>
              {availableExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.exercise_id}
                  activeOpacity={0.8}
                  onPress={() => addExercise(exercise)}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: '#FFFFFF',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: '#111827', fontSize: 14, fontWeight: '600', marginBottom: 2 }} className="font-body">
                    {exercise.name}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }} className="font-body">
                    {exercise.muscle_group}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Load More Button */}
              {hasMoreExercises && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={loadMoreExercises}
                  disabled={loadingMore}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#f97316',
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: '#FFF7ED',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#f97316" />
                  ) : (
                    <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '600' }} className="font-body">
                      {t('instructor.createRoutine.loadMore') || 'Load More Exercises'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {!hasMoreExercises && availableExercises.length > 0 && (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#6b7280', fontSize: 12 }} className="font-body">
                    {t('instructor.createRoutine.allExercisesLoaded') || 'All exercises loaded'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={creating}
          style={{
            width: '100%',
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: creating ? '#9CA3AF' : '#f97316',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
          onPress={handleCreateRoutine}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} className="font-body">
              {params.clientId
                ? t('instructor.createRoutine.createAndAssign') || 'Create & Assign Routine'
                : t('instructor.createRoutine.createRoutine') || 'Create Routine'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            width: '100%',
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: '#4b5563',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} className="font-body">
            {t('common.cancel') || 'Cancel'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <ToastNotification
        visible={toastVisible}
        type={toastType}
        title={toastTitle}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}