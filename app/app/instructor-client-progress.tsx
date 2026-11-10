import { ThemedText } from '@/components/themed-text';
import { ToastNotification } from '@/components/ToastNotification';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRoutineResponse } from '@/services/vitalfitSdk';
import vitalFitApi from '@/services/vitalfitSdk';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, UserIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstructorClientProgressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    clientId?: string;
    name?: string;
    level?: string;
    program?: string;
  }>();

  const clientId = params.clientId;
  const clientName = params.name ?? t('instructor.assignRoutine.defaultClient');

  const [routines, setRoutines] = useState<UserRoutineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('error');
  const [toastTitle, setToastTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMessage(message);
    setToastVisible(true);
  };

  const fetchClientRoutines = React.useCallback(async () => {
    if (!token || !clientId) return;

    try {
      setLoading(true);
      const response = await vitalFitApi.routine.getClientRoutines(clientId, token, {
        page: 1,
        limit: 10,
      });
      setRoutines(response.data || []);
    } catch (error) {
      console.error('Error fetching client routines:', error);
      showToast('error', t('instructor.assignRoutine.error') || 'Error', t('instructor.assignRoutine.errorLoadingData') || 'Could not load routines');
    } finally {
      setLoading(false);
    }
  }, [token, clientId, t]);

  useEffect(() => {
    if (clientId && token) {
      fetchClientRoutines();
    }
  }, [fetchClientRoutines, clientId, token]);

  const currentRoutine = routines[0]; // Show the first active routine
  const totalRoutines = routines.length;
  const completedRoutines = routines.filter(r => r.status === 'completed').length;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
            {t('instructor.assignRoutine.loading') || 'Loading...'}
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
            {t('instructor.clientProgress.title')}
          </ThemedText>
        </View>
        <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#FED7AA',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <UserIcon width={40} height={40} color='#f97316' />
          </View>

          <Text style={{ color: '#111827', fontSize: 20, fontWeight: '700', marginBottom: 2 }} className="font-body">
            {clientName}
          </Text>
        </View>
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#F3F4F6',
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 20,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 2 }} className="font-body">{totalRoutines}</Text>
              <Text style={{ color: '#4B5563', fontSize: 12 }} className="font-body">{t('instructor.assignRoutine.currentRoutines')}</Text>
            </View>
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              borderRadius: 20,
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 16,
              paddingVertical: 16,
            }}
          >
            <Text style={{ color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 8 }} className="font-heading">
              {t('instructor.clientProgress.currentRoutine')}
            </Text>
            {currentRoutine ? (
              <>
                <Text style={{ color: '#111827', fontSize: 15, fontWeight: '600', marginBottom: 2 }} className="font-body">
                  {currentRoutine.routine_name}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 10 }} className="font-body">
                  {currentRoutine.level} {currentRoutine.instructor && `• ${currentRoutine.instructor}`}
                </Text>
                <Text style={{ color: '#4B5563', fontSize: 13, lineHeight: 18 }} className="font-body">
                  {t('instructor.assignRoutine.completions')}: {currentRoutine.completion_count}
                  {currentRoutine.last_completed_at && (
                    <Text style={{ color: '#6B7280' }}> • Last: {new Date(currentRoutine.last_completed_at).toLocaleDateString()}</Text>
                  )}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#6B7280', fontSize: 13 }} className="font-body">
                {t('instructor.assignRoutine.noRoutines') || 'No active routines'}
              </Text>
            )}
          </View>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16, marginBottom: 8 }} className="font-heading">
            {t('instructor.assignRoutine.currentRoutines')}
          </Text>

          <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ width: `${totalRoutines > 0 ? (completedRoutines / totalRoutines) * 100 : 0}%`, height: '100%', backgroundColor: '#F27F2A' }} />
          </View>

          {routines.length > 0 ? (
            routines.map((routine) => (
              <LinearGradient
                key={routine.user_routine_id}
                colors={routine.status === 'completed' ? ['#10B981', '#34D399', '#10B981'] : ['#3A2618', '#F27F2A', '#3A2618']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ borderRadius: 16, padding: 14, marginBottom: 12, opacity: routine.status === 'completed' ? 0.7 : 1 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '500', fontSize: 16, flex: 1 }} className="font-body">
                    {routine.routine_name}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }} className="font-body">{t('instructor.assignRoutine.level')}</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} className="font-body">{routine.level}</Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }} className="font-body">{t('instructor.assignRoutine.completions')}</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} className="font-body">{routine.completion_count}</Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }} className="font-body">Assigned</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} className="font-body">
                      {new Date(routine.assigned_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ))
          ) : (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text className='font-body' style={{ color: '#6B7280', textAlign: 'center' }}>
                {t('instructor.assignRoutine.noRoutines') || 'No routines assigned'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{ width: '100%', paddingVertical: 14, borderRadius: 16, backgroundColor: '#4b5563', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} className="font-body">{t('instructor.clientProgress.backToClients')}</Text>
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
