import AsyncStorage from '@react-native-async-storage/async-storage';
import vitalFitApi from '@/services/vitalfitSdk';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type TrainingCardProps = {
  id: string;
  routineId?: string;
  title: string;
  subtitle: string;
  progressPercent: number;
  instructor?: string;
  completionCount?: number;
  totalExercises?: number;
  refreshKey?: number;
  onPress?: () => void;
};

type ProgressExercise = {
  isCompleted: boolean;
};

export default function TrainingCard({ id, routineId, title, subtitle, instructor = 'Instructor', completionCount = 0, refreshKey = 0, onPress }: TrainingCardProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [cachedProgress, setCachedProgress] = useState(0);

  const loadCachedProgress = React.useCallback(async () => {
    try {
      if (!routineId || !token) return;

      // Fetch routine details to get total exercises
      const routineData = await vitalFitApi.routine.getRoutineById(routineId, token);
      const totalExercisesCount = routineData?.exercises?.length || 0;

      // Load cached progress
      const cachedData = await AsyncStorage.getItem(`routine_progress_${routineId}`);
      if (cachedData && totalExercisesCount > 0) {
        const progressArray: ProgressExercise[] = JSON.parse(cachedData);
        const completedExercises = progressArray.filter((ex) => ex.isCompleted).length;
        const percentage = (completedExercises / totalExercisesCount) * 100;
        setCachedProgress(Math.round(percentage));
      } else {
        setCachedProgress(0);
      }
    } catch (error) {
      console.error('Error loading cached progress:', error);
      setCachedProgress(0);
    }
  }, [routineId, token]);

  useEffect(() => {
    loadCachedProgress();
  }, [loadCachedProgress, refreshKey]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/routine/details',
        params: {
          id: routineId || id,
          userRoutineId: id
        }
      });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      className="w-full rounded-2xl overflow-hidden bg-white mb-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
    >
      <View style={{ height: 180 }}>
        <Image
          source={require('@/assets/images/rutin.png')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
          <Text className='font-heading' style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
            {title}
          </Text>
        </View>

        <View style={{ position: 'absolute', right: 12, bottom: 12, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }}>
          {(() => {
            const size = 40;
            const stroke = 4;
            const radius = (size - stroke) / 2;
            const circumference = 2 * Math.PI * radius;
            const progress = Math.max(0, Math.min(100, cachedProgress));
            const dash = (progress / 100) * circumference;
            const gap = circumference - dash;
            return (
              <Svg width={size} height={size}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={"rgba(255,255,255,0.25)"}
                  strokeWidth={stroke}
                  fill="none"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={"#F27F2A"}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${dash},${gap}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </Svg>
            );
          })()}
          <Text className='font-body' style={{ position: 'absolute', color: '#F27F2A', fontWeight: '700', fontSize: 11 }}>{cachedProgress}%</Text>
        </View>
      </View>

      <View className="px-4 py-3" style={{ backgroundColor: '#111827' }}>
        <View className="flex-row items-start justify-between">
          <View style={{ flexShrink: 1, paddingRight: 12 }}>
            <Text className='font-body' style={{ color: '#D1D5DB', fontSize: 12, marginBottom: 2 }}>{subtitle}</Text>
            <Text className='font-body' style={{ color: '#9CA3AF', fontSize: 12 }}>
              {instructor === 'Unknown' ? 'AI Generated' : instructor}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ flexShrink: 0 }}>
            <Text className='font-body' style={{ color: '#FFFFFF', fontSize: 10 }}>Completions: {completionCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
