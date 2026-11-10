import { ThemedText } from '@/components/themed-text';
import { ToastNotification } from '@/components/ToastNotification';
import { useAuth } from '@/contexts/AuthContext';
import type { Routine, UserRoutineResponse } from '@/services/vitalfitSdk';
import vitalFitApi from '@/services/vitalfitSdk';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, PlusIcon, TrashIcon, UserIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstructorAssignRoutineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    clientId?: string;
    name?: string;
  }>();

  const clientName = params.name ?? t('instructor.assignRoutine.defaultClient');
  const clientId = params.clientId;

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [clientRoutines, setClientRoutines] = useState<UserRoutineResponse[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const fetchData = useCallback(async () => {
    if (!token || !clientId) return;

    try {
      setLoading(true);
      const [routinesResponse, clientRoutinesResponse] = await Promise.all([
        vitalFitApi.routine.getInstructorRoutines(token, { page: 1, limit: 50 }),
        vitalFitApi.routine.getClientRoutines(clientId, token, { page: 1, limit: 10 }),
      ]);

      setRoutines(routinesResponse.data || []);
      setClientRoutines(clientRoutinesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', t('instructor.assignRoutine.error') || 'Error', t('instructor.assignRoutine.errorLoadingData') || 'Could not load routines');
    } finally {
      setLoading(false);
    }
  }, [token, clientId, t]);

  useEffect(() => {
    if (clientId && token) {
      fetchData();
    }
  }, [fetchData, clientId, token]);

  // Refresh data when screen comes into focus (after creating/assigning a routine)
  useFocusEffect(
    useCallback(() => {
      if (clientId && token) {
        fetchData();
      }
    }, [fetchData, clientId, token])
  );

  const handleAssignRoutine = async () => {
    if (!selectedRoutine || !clientId || !token) {
      showToast('warning', t('instructor.assignRoutine.error') || 'Error', t('instructor.assignRoutine.selectRoutineFirst') || 'Please select a routine first');
      return;
    }

    setConfirmModalVisible(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedRoutine || !clientId || !token) return;

    setConfirmModalVisible(false);
    try {
      setAssigning(true);
      await vitalFitApi.routine.assignRoutine(
        {
          client_id: clientId,
          routine_id: selectedRoutine.routine_id,
        },
        token
      );

      showToast('success', t('instructor.assignRoutine.success') || 'Success', t('instructor.assignRoutine.routineAssigned') || 'Routine assigned successfully!');

      setTimeout(() => router.back(), 1500);
    } catch (error) {
      console.error('Error assigning routine:', error);
      showToast('error', t('instructor.assignRoutine.error') || 'Error', t('instructor.assignRoutine.errorAssigning') || 'Could not assign routine');
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateNewRoutine = () => {
    router.push({
      pathname: '/instructor-create-routine',
      params: {
        clientId: clientId,
        clientName: clientName,
      },
    });
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutineToDelete(routineId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!routineToDelete || !token) return;

    setDeleteModalVisible(false);
    try {
      setDeleting(true);
      await vitalFitApi.routine.deleteRoutine(routineToDelete, token);

      showToast('success', t('instructor.assignRoutine.deleteSuccess') || 'Success', t('instructor.assignRoutine.routineDeleted') || 'Routine deleted successfully!');

      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error deleting routine:', error);
      showToast('error', t('instructor.assignRoutine.error') || 'Error', t('instructor.assignRoutine.errorDeleting') || 'Could not delete routine');
    } finally {
      setDeleting(false);
      setRoutineToDelete(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
            {t('instructor.assignRoutine.loading') || 'Loading routines...'}
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
            {t('instructor.assignRoutine.title')}
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
          <Text style={{ color: '#6b7280', fontSize: 14 }} className="font-body">
            {t('instructor.assignRoutine.client')}
          </Text>
        </View>

        {/* Current Routines */}
        {clientRoutines.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 }} className="font-heading">
              {t('instructor.assignRoutine.currentRoutines') || 'Current Routines'}
            </Text>
            {clientRoutines.map((routine) => (
              <View
                key={routine.user_routine_id}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: '#F9FAFB',
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#111827', fontSize: 14, fontWeight: '600' }} className="font-body">
                    {routine.routine_name}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }} className="font-body">
                    {routine.level} • {t('instructor.assignRoutine.completions')}: {routine.completion_count}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDeleteRoutine(routine.routine_id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrashIcon width={18} height={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Select Routine */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 }} className="font-heading">
            {t('instructor.assignRoutine.selectRoutine')}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCreateNewRoutine}
            style={{
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#f97316',
              borderStyle: 'dashed',
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: '#FFF7ED',
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlusIcon width={20} height={20} color='#f97316' />
            <Text style={{ color: '#f97316', fontSize: 14, fontWeight: '700', marginLeft: 8 }} className="font-body">
              {t('instructor.assignRoutine.createNew') || 'Create New Routine'}
            </Text>
          </TouchableOpacity>

          {routines.length > 0 ? (
            routines.map((routine) => (
              <TouchableOpacity
                key={routine.routine_id}
                activeOpacity={0.8}
                onPress={() => setSelectedRoutine(routine)}
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: selectedRoutine?.routine_id === routine.routine_id ? '#f97316' : '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: selectedRoutine?.routine_id === routine.routine_id ? '#FFF7ED' : '#FFFFFF',
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: '#111827', fontSize: 14, fontWeight: '600', marginBottom: 4 }} className="font-body">
                  {routine.name}
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }} className="font-body">
                  {routine.description}
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 12 }} className="font-body">
                  {routine.level} • {routine.exercises?.length || 0} {t('instructor.assignRoutine.exercisesLabel')}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }} className="font-body">
                {t('instructor.assignRoutine.noRoutines') || 'No routines available. Create one first.'}
              </Text>
            </View>
          )}
        </View>

        {/* Selected Routine Details */}
        {selectedRoutine && selectedRoutine.exercises && selectedRoutine.exercises.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 8 }} className="font-heading">
              {t('instructor.assignRoutine.routineDetails')}
            </Text>

            {selectedRoutine.exercises.map((ex) => (
              <LinearGradient
                key={ex.routine_exercise_id}
                colors={['#3A2618', '#F27F2A', '#3A2618']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ borderRadius: 16, padding: 14, marginBottom: 12 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '500', fontSize: 16, marginBottom: 10 }} className="font-body">
                  {ex.exercise_details?.name || 'Exercise'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }} className="font-body">
                      {t('routine.sets') || 'Sets'}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} className="font-body">{ex.sets}</Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }} className="font-body">
                      {t('routine.reps') || 'Reps'}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} className="font-body">{ex.reps}</Text>
                  </View>
                  <View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }} className="font-body">
                      {t('routine.rest') || 'Rest'}
                    </Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} className="font-body">{ex.rest_time}s</Text>
                  </View>
                </View>
                {ex.notes && (
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6 }} className="font-body">
                    {ex.notes}
                  </Text>
                )}
              </LinearGradient>
            ))}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!selectedRoutine || assigning}
          style={{
            width: '100%',
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: !selectedRoutine || assigning ? '#9CA3AF' : '#f97316',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
          onPress={handleAssignRoutine}
        >
          {assigning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} className="font-body">
              {t('instructor.assignRoutine.assignButton')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={{ width: '100%', paddingVertical: 14, borderRadius: 16, backgroundColor: '#4b5563', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} className="font-body">
            {t('instructor.assignRoutine.backToClients')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={confirmModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setConfirmModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
              }}>
              {t('instructor.assignRoutine.confirmTitle') || 'Assign Routine'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#4b5563',
                marginBottom: 16,
              }}>
              {t('instructor.assignRoutine.confirmMessage') || `Assign "${selectedRoutine?.name}" to ${clientName}?`}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setConfirmModalVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }}>
                <Text style={{ fontSize: 13, color: '#4b5563' }}>{t('common.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleConfirmAssign}
                disabled={assigning}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: assigning ? '#9CA3AF' : '#f97316',
                }}>
                {assigning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>{t('common.confirm') || 'Confirm'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 20,
              paddingVertical: 20,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#DC2626',
                marginBottom: 8,
              }}>
              {t('instructor.assignRoutine.deleteTitle') || 'Delete Routine'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#4b5563',
                marginBottom: 16,
              }}>
              {t('instructor.assignRoutine.deleteMessage') || 'Are you sure you want to delete this routine? This action cannot be undone.'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setDeleteModalVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }}>
                <Text style={{ fontSize: 13, color: '#4b5563' }}>{t('common.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleConfirmDelete}
                disabled={deleting}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: deleting ? '#9CA3AF' : '#DC2626',
                }}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>{t('common.delete') || 'Delete'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
