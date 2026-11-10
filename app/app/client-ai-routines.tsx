import { ThemedText } from '@/components/themed-text';
import { ToastNotification } from '@/components/ToastNotification';
import type { UserRoutineResponse } from '@/services/vitalfitSdk';
import vitalFitApi from '@/services/vitalfitSdk';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, TrashIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientAIRoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();

  const [routines, setRoutines] = useState<UserRoutineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<UserRoutineResponse | null>(null);
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

  const fetchRoutines = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      // Fetch user's routines
      const response = await vitalFitApi.routine.getMyRoutines(token, {
        page: 1,
        limit: 100,
        sort: 'desc'
      });

      // Filter to show only AI-created routines
      // Check the instructor field to identify AI-created routines
      const aiRoutines = (response.data || []).filter(routine => {
        const instructor = routine.instructor?.toLowerCase() || '';
        // AI-created routines have instructor as "Unknown", "AI", "Chatbot", or contain "ai"
        return instructor === 'unknown' ||
               instructor.includes('ai') ||
               instructor.includes('chatbot') ||
               instructor === 'ai' ||
               instructor === 'vitalfit ai';
      });

      setRoutines(aiRoutines);
    } catch (error) {
      console.error('Error fetching AI routines:', error);
      showToast(
        'error',
        t('client.aiRoutines.error') || 'Error',
        t('client.aiRoutines.errorLoadingRoutines') || 'Could not load your AI-assigned routines'
      );
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchRoutines();
      }
    }, [token, fetchRoutines])
  );

  const handleDeleteRoutine = (routine: UserRoutineResponse) => {
    setRoutineToDelete(routine);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!routineToDelete || !token) return;

    setDeleteModalVisible(false);
    try {
      setDeleting(true);
      await vitalFitApi.routine.deleteRoutine(routineToDelete.routine_id, token);

      showToast(
        'success',
        t('client.aiRoutines.deleteSuccess') || 'Success',
        t('client.aiRoutines.routineDeleted') || 'Routine deleted successfully!'
      );

      // Refresh the data
      await fetchRoutines();
    } catch (error) {
      console.error('Error deleting routine:', error);
      showToast(
        'error',
        t('client.aiRoutines.error') || 'Error',
        t('client.aiRoutines.errorDeleting') || 'Could not delete routine'
      );
    } finally {
      setDeleting(false);
      setRoutineToDelete(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F27F2A" />
          <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
            {t('client.aiRoutines.loading') || 'Loading your AI-assigned routines...'}
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
            <ChevronLeftIcon width={20} height={20} color='#F27F2A' />
          </TouchableOpacity>

          <ThemedText
            lightColor='#111827'
            style={{ fontFamily: 'System', fontSize: 16, fontWeight: '600' }}
          >
            {t('client.aiRoutines.title') || 'AI-Assigned Routines'}
          </ThemedText>
        </View>

        {/* Routines List */}
        {routines.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '700', marginBottom: 12 }} className="font-heading">
              {t('client.aiRoutines.yourRoutines') || 'Your AI Routines'} ({routines.length})
            </Text>

            {routines.map((routine) => (
              <View
                key={routine.routine_id}
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: '#FFFFFF',
                  marginBottom: 12,
                }}
              >
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#111827', fontSize: 14, fontWeight: '600', marginBottom: 4 }} className="font-body">
                    {routine.routine_name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#6b7280', fontSize: 12 }} className="font-body">
                      {routine.level}
                    </Text>
                    <Text style={{ color: '#F27F2A', fontSize: 12, fontWeight: '600' }} className="font-body">
                      • AI Generated
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }} className="font-body">
                      • {routine.instructor}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDeleteRoutine(routine)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrashIcon width={16} height={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 4 }} className="font-body">
              {t('client.aiRoutines.noRoutines') || 'No AI-assigned routines yet.'}
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }} className="font-body">
              {t('client.aiRoutines.startChat') || 'Chat with our AI to get personalized routines!'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            width: '100%',
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: '#4b5563',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }} className="font-body">
            {t('common.back') || 'Back'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirmation Modal */}
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
              {t('client.aiRoutines.deleteTitle') || 'Delete AI Routine'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#4b5563',
                marginBottom: 4,
              }}>
              {t('client.aiRoutines.deleteMessage') || 'Are you sure you want to delete this AI-assigned routine?'}
            </Text>
            {routineToDelete && (
              <Text
                style={{
                  fontSize: 13,
                  color: '#111827',
                  fontWeight: '600',
                  marginBottom: 16,
                }}>
                &ldquo;{routineToDelete.routine_name}&rdquo;
              </Text>
            )}
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
