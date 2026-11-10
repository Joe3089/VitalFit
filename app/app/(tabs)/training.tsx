import TrainingCard from '@/components/auth/training/TrainingCard';
import { ThemedView } from '@/components/themed-view';
import { ToastNotification } from '@/components/ToastNotification';
import type { UserRoutineResponse } from '@/services/vitalfitSdk';
import vitalFitApi from '@/services/vitalfitSdk';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SparklesIcon } from 'react-native-heroicons/solid';

export default function EntrenamientoScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [routines, setRoutines] = useState<UserRoutineResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('error');
    const [toastTitle, setToastTitle] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
        setToastType(type);
        setToastTitle(title);
        setToastMessage(message);
        setToastVisible(true);
    };

    const fetchMyRoutines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await vitalFitApi.routine.getMyRoutines('', {
                page: 1,
                limit: 10,
            });
            // Filter to show only active routines (not completed)
            const activeRoutines = (response.data || []).filter(routine => routine.status !== 'completed');
            setRoutines(activeRoutines);
            console.log('Fetched routines:', response.data);
            console.log('Active routines:', activeRoutines);
        } catch (err) {
            console.error('Error fetching routines:', err);
            showToast('error', t('training.error') || 'Error', t('training.errorLoadingRoutines') || 'Error loading routines');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchMyRoutines();
    }, [fetchMyRoutines]);

    // Debounce search query with 500ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Refresh routines and cards when screen comes into focus (after completing exercises)
    useFocusEffect(
        useCallback(() => {
            fetchMyRoutines();
            setRefreshKey(prev => prev + 1);
        }, [fetchMyRoutines])
    );

    // Filter routines based on debounced search query
    const filteredRoutines = routines.filter(routine =>
        routine.routine_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    return (
        <ThemedView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}>
                    {/* Logo */}
                    <View className='items-center mb-6'>
                        <Image
                            source={require('@/assets/images/Frame.png')}
                            style={{ width: 150, height: 50, resizeMode: 'contain' }}
                        />
                    </View>

                    {/* Routines Title */}
                    <View className='mb-4'>
                        <Text className='font-heading' style={{ color: '#111827', fontWeight: '800', fontSize: 24 }}>
                            {t('training.title')}
                        </Text>
                    </View>

                    {/* Search Bar */}
                    <View className='mb-6'>
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={t('training.searchRoutines')}
                            placeholderTextColor="#9CA3AF"
                            className='font-body'
                            style={{
                                backgroundColor: '#F3F4F6',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                fontSize: 16,
                                color: '#111827',
                            }}
                        />
                    </View>

                    {/* AI Routines Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/client-ai-routines')}
                        style={{
                            borderRadius: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            backgroundColor: '#F27F2A',
                            marginBottom: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <SparklesIcon width={20} height={20} color='#FFFFFF' />
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8 }} className="font-body">
                            {t('training.viewAiRoutines') || 'View AI-Assigned Routines'}
                        </Text>
                    </TouchableOpacity>

                    {/* Loading state */}
                    {loading && (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#F27F2A" />
                            <Text className='font-body' style={{ color: '#6B7280', marginTop: 12 }}>
                                {t('training.loadingRoutines') || 'Loading routines...'}
                            </Text>
                        </View>
                    )}

                    {/* Routines list */}
                    {!loading && filteredRoutines.length > 0 && filteredRoutines.map((routine) => (
                        <TrainingCard
                            key={`${routine.user_routine_id}-${refreshKey}`}
                            id={routine.user_routine_id}
                            routineId={routine.routine_id}
                            title={routine.routine_name}
                            subtitle={routine.level}
                            progressPercent={0}
                            instructor={routine.instructor}
                            completionCount={routine.completion_count}
                            totalExercises={0}
                            refreshKey={refreshKey}
                        />
                    ))}

                    {/* No search results */}
                    {!loading && filteredRoutines.length === 0 && routines.length > 0 && (
                        <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 20 }}>
                            <Text className='font-heading' style={{ color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                                {t('training.noSearchResults') || 'No routines found'}
                            </Text>
                            <Text className='font-body' style={{ color: '#6B7280', textAlign: 'center' }}>
                                {t('training.noSearchResultsDescription') || 'Try searching with a different term.'}
                            </Text>
                        </View>
                    )}

                    {/* Empty state */}
                    {!loading && filteredRoutines.length === 0 && routines.length === 0 && (
                        <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 20 }}>
                            <Text className='font-heading' style={{ color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                                {t('training.noRoutines') || 'No routines assigned'}
                            </Text>
                            <Text className='font-body' style={{ color: '#6B7280', textAlign: 'center' }}>
                                {t('training.noRoutinesDescription') || 'Your instructor will assign routines for you to follow.'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            <ToastNotification
                visible={toastVisible}
                type={toastType}
                title={toastTitle}
                message={toastMessage}
                onClose={() => setToastVisible(false)}
            />
        </ThemedView>
    );
}
