import { ToastNotification } from '@/components/ToastNotification';
import { useAuth } from '@/contexts/AuthContext';
import type { Routine } from '@/services/vitalfitSdk';
import vitalFitApi from '@/services/vitalfitSdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircleIcon, MinusIcon, PlusIcon, XMarkIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

export const options = {
  headerShown: false,
  title: '',
};

type ExerciseProgress = {
  routine_exercise_id: string;
  completedSets: number;
  isCompleted: boolean;
};

export default function RoutineDetailsScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const { id, userRoutineId } = useLocalSearchParams<{ id: string; userRoutineId?: string }>();
  const { t } = useTranslation();
  const { token } = useAuth();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('error');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
  };

  const fetchRoutineDetails = React.useCallback(async () => {
    if (!id || !token) {
      showToast('error', t('routine.error') || 'Error', t('routine.errorLoadingDetails') || 'Could not load routine details');
      setTimeout(() => router.back(), 1500);
      return;
    }

    try {
      setLoading(true);
      const routineData = await vitalFitApi.routine.getRoutineById(id, token);
      if (!routineData) {
        showToast('error', t('routine.error') || 'Error', t('routine.errorLoadingDetails') || 'Could not load routine details');
        setTimeout(() => router.back(), 1500);
        return;
      }
      setRoutine(routineData);
      await loadProgressFromCache(id, routineData);
    } catch (error) {
      console.error('Error fetching routine details:', error);
      showToast('error', t('routine.error') || 'Error', t('routine.errorLoadingDetails') || 'Could not load routine details');
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  }, [id, token, t, router]);

  useEffect(() => {
    if (id && token) {
      fetchRoutineDetails();
    }
  }, [fetchRoutineDetails, id, token]);

  const loadProgressFromCache = async (routineId: string, routineData: Routine) => {
    try {
      const cachedProgress = await AsyncStorage.getItem(`routine_progress_${routineId}`);

      // Create initial progress array based on current routine exercises
      const initialProgress: ExerciseProgress[] = (routineData.exercises || []).map(ex => ({
        routine_exercise_id: ex.routine_exercise_id,
        completedSets: 0,
        isCompleted: false,
      }));

      if (cachedProgress) {
        const cached: ExerciseProgress[] = JSON.parse(cachedProgress);
        // Merge cached progress with initial progress by matching routine_exercise_id
        const mergedProgress = initialProgress.map(initial => {
          const cachedItem = cached.find(c => c.routine_exercise_id === initial.routine_exercise_id);
          return cachedItem || initial;
        });
        setExerciseProgress(mergedProgress);
      } else {
        setExerciseProgress(initialProgress);
      }
    } catch (error) {
      console.error('Error loading progress from cache:', error);
      // Set initial progress as fallback
      const initialProgress: ExerciseProgress[] = (routineData.exercises || []).map(ex => ({
        routine_exercise_id: ex.routine_exercise_id,
        completedSets: 0,
        isCompleted: false,
      }));
      setExerciseProgress(initialProgress);
    }
  };

  const saveProgressToCache = async (updatedProgress: ExerciseProgress[]) => {
    try {
      if (id) {
        await AsyncStorage.setItem(`routine_progress_${id}`, JSON.stringify(updatedProgress));
        console.log('Saved to cache:', updatedProgress);
      }
    } catch (error) {
      console.error('Error saving progress to cache:', error);
    }
  };

  const incrementSets = (exerciseIndex: number) => {
    console.log('incrementSets called with index:', exerciseIndex);
    setExerciseProgress(prevProgress => {
      console.log('prevProgress:', prevProgress);
      const updated = [...prevProgress];
      if (updated[exerciseIndex]) {
        const exercise = routine?.exercises?.[exerciseIndex];
        const maxSets = exercise?.sets || 0;
        const currentSets = updated[exerciseIndex].completedSets;
        const newCompletedSets = Math.min(currentSets + 1, maxSets);
        console.log(`Index ${exerciseIndex}: ${currentSets} -> ${newCompletedSets}, max: ${maxSets}`);
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          completedSets: newCompletedSets,
          isCompleted: newCompletedSets === maxSets,
        };
        console.log('Updated state:', updated);
        saveProgressToCache(updated);
        return updated;
      }
      console.log('No update - index not found');
      return prevProgress;
    });
  };

  const decrementSets = (exerciseIndex: number) => {
    console.log('decrementSets called with index:', exerciseIndex);
    setExerciseProgress(prevProgress => {
      const updated = [...prevProgress];
      if (updated[exerciseIndex]) {
        const currentSets = updated[exerciseIndex].completedSets;
        const newCompletedSets = Math.max(currentSets - 1, 0);
        console.log(`Index ${exerciseIndex}: ${currentSets} -> ${newCompletedSets}`);
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          completedSets: newCompletedSets,
          isCompleted: false,
        };
        console.log('Updated state:', updated);
        saveProgressToCache(updated);
        return updated;
      }
      console.log('No update - index not found');
      return prevProgress;
    });
  };

  const markExerciseCompleted = (exerciseIndex: number) => {
    console.log('markExerciseCompleted called with index:', exerciseIndex);
    setExerciseProgress(prevProgress => {
      const updated = [...prevProgress];
      if (updated[exerciseIndex]) {
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          isCompleted: !updated[exerciseIndex].isCompleted,
        };
        saveProgressToCache(updated);
      }
      return updated;
    });
  };

  const handleCompleteRoutine = async () => {
    if (!token) return;

    // Use userRoutineId if available, otherwise fallback to id
    const completionId = userRoutineId || id;
    if (!completionId) return;

    try {
      await vitalFitApi.routine.markRoutineCompletion(completionId, token);
      showToast('success', t('routine.success') || 'Success', t('routine.markedComplete') || 'Routine marked as completed!');
      await AsyncStorage.removeItem(`routine_progress_${id}`);
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      console.error('Error marking routine as completed:', error);
      showToast('error', t('routine.error') || 'Error', t('routine.errorMarkingComplete') || 'Could not mark routine as completed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F27F2A" />
          <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
            {t('routine.loadingDetails') || 'Loading routine details...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
            {t('routine.errorLoadingDetails') || 'Could not load routine details'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const exercises = routine.exercises || [];
  const completedExercises = exerciseProgress.filter(ex => ex.isCompleted).length;
  const progressPercent = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ width: '100%', height: 220 }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            { [require('@/assets/images/rutin.png')].map((src, idx) => (
              <Image key={idx} source={src} style={{ width, height: 220 }} resizeMode="cover" />
            )) }
          </ScrollView>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(17,24,39,0.85)', alignItems: 'center', justifyContent: 'center' }}
          >
            <XMarkIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text className='font-heading' style={{ color: '#111827', fontWeight: '700', fontSize: 20, marginBottom: 4 }}>
            {routine.name}
          </Text>
          <Text className='font-body' style={{ color: '#6B7280', fontSize: 14, marginBottom: 12 }}>
            {routine.description}
          </Text>
          <Text className='font-heading' style={{ color: '#111827', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
            {t('routine.exerciseList') || 'LISTA DE EJERCICIOS'}
          </Text>
          <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#F27F2A' }} />
          </View>

          {exercises.length > 0 ? (
            <View>
              {exercises.map((ex, index) => {
                const progress = exerciseProgress[index];
                const completedSets = progress?.completedSets || 0;
                const isCompleted = progress?.isCompleted || false;

                return (
                  <LinearGradient
                    key={ex.routine_exercise_id}
                    colors={isCompleted ? ["#10B981", "#34D399", "#10B981"] : ["#3A2618", "#F27F2A", "#3A2618"]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ borderRadius: 16, padding: 14, marginBottom: 12, opacity: isCompleted ? 0.7 : 1 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text className='font-body' style={{ color: '#FFFFFF', fontWeight: '500', fontSize: 16, flex: 1 }}>
                        {ex.exercise_details?.name || 'Exercise'}
                      </Text>
                      <TouchableOpacity onPress={() => markExerciseCompleted(index)} style={{ marginLeft: 8 }}>
                        <CheckCircleIcon size={24} color={isCompleted ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text className='font-body' style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '400' }}>
                          {t('routine.sets') || 'Sets'}
                        </Text>
                        <Text className='font-body' style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                          {completedSets}/{ex.sets}
                        </Text>
                        <View style={{ flexDirection: 'row', marginTop: 6, gap: 4 }}>
                          <TouchableOpacity
                            onPress={() => {
                              if (completedSets > 0) {
                                decrementSets(index);
                              }
                            }}
                            activeOpacity={completedSets === 0 ? 1 : 0.7}
                            style={{ 
                              flex: 1, 
                              backgroundColor: completedSets === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', 
                              borderRadius: 6, 
                              padding: 8, 
                              alignItems: 'center',
                              opacity: completedSets === 0 ? 0.5 : 1,
                            }}
                          >
                            <MinusIcon size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              if (completedSets < ex.sets) {
                                incrementSets(index);
                              }
                            }}
                            activeOpacity={completedSets >= ex.sets ? 1 : 0.7}
                            style={{ 
                              flex: 1, 
                              backgroundColor: completedSets >= ex.sets ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', 
                              borderRadius: 6, 
                              padding: 8, 
                              alignItems: 'center',
                              opacity: completedSets >= ex.sets ? 0.5 : 1,
                            }}
                          >
                            <PlusIcon size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text className='font-body' style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '400' }}>
                          {t('routine.reps') || 'Reps'}
                        </Text>
                        <Text className='font-body' style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{ex.reps}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text className='font-body' style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '400' }}>
                          {t('routine.rest') || 'Rest'}
                        </Text>
                        <Text className='font-body' style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{ex.rest_time}s</Text>
                      </View>
                    </View>

                    {ex.notes && (
                      <Text className='font-body' style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>
                        {ex.notes}
                      </Text>
                    )}
                  </LinearGradient>
                );
              })}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCompleteRoutine}
                disabled={completedExercises !== exercises.length}
                style={{
                  backgroundColor: completedExercises !== exercises.length ? '#9CA3AF' : '#F27F2A',
                  borderRadius: 16,
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 16,
                }}
              >
                <Text className='font-body' style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>
                  {t('routine.markAsComplete') || 'Mark as Completed'} ({completedExercises}/{exercises.length})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text className='font-body' style={{ color: '#6B7280', textAlign: 'center' }}>
                {t('routine.noExercises') || 'No exercises in this routine'}
              </Text>
            </View>
          )}
        </View>
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