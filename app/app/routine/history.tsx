import { useRouter } from 'expo-router';
import React from 'react';
import { ImageSourcePropType, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';
import HistoryTrainingCard from '../../components/auth/training/HistoryTrainingCard';

export const options = {
  headerShown: false,
  title: '',
};

export default function RoutineHistoryScreen() {
  const router = useRouter();
  const imgA: ImageSourcePropType = require('@/assets/images/rutin.png');
  const imgB: ImageSourcePropType = require('@/assets/images/rutina.png');
  const items = [
    { id: 'h1', title: 'Fuerza Total – Semana 3', subtitle: 'Full Body - Medium', progressPercent: 75, instructor: 'Instructor A', duration: '35 min', imageSource: imgA },
    { id: 'h2', title: 'Fuerza Total – Semana 2', subtitle: 'Full Body - Medium', progressPercent: 40, instructor: 'Instructor B', duration: '28 min', imageSource: imgB },
    { id: 'h3', title: 'HIIT Express', subtitle: 'Cardio - High', progressPercent: 90, instructor: 'Instructor C', duration: '20 min', imageSource: imgA },
    { id: 'h4', title: 'Pilates Core', subtitle: 'Core - Medium', progressPercent: 55, instructor: 'Instructor D', duration: '30 min', imageSource: imgB },
    { id: 'h5', title: 'Kick Boxing Intro', subtitle: 'Power - Low', progressPercent: 10, instructor: 'Instructor E', duration: '15 min', imageSource: imgA },
    { id: 'h6', title: 'Yoga Flow', subtitle: 'Mobility - Medium', progressPercent: 65, instructor: 'Instructor F', duration: '25 min', imageSource: imgB },
    { id: 'h7', title: 'Fuerza Total – Semana 1', subtitle: 'Full Body - Medium', progressPercent: 30, instructor: 'Instructor G', duration: '33 min', imageSource: imgA },
    { id: 'h8', title: 'Cardio Burn', subtitle: 'Cardio - High', progressPercent: 85, instructor: 'Instructor H', duration: '22 min', imageSource: imgB },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ position: 'absolute', left: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeftIcon size={22} color={'#111827'} />
        </TouchableOpacity>
        <Text className='font-heading' style={{ color: '#111827', fontWeight: '700', fontSize: 18 }}>Historial</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 }}>
        {items.map((it) => (
          <HistoryTrainingCard key={it.id} {...it} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
