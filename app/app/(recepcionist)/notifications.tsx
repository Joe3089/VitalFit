import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BellIcon, Cog6ToothIcon } from 'react-native-heroicons/outline';
import { ChevronLeftIcon } from 'react-native-heroicons/solid';

const mockNotifications = [
  {
    id: '1',
    title: 'Nueva clase disponible',
    description: 'Se ha agregado una nueva clase de Yoga para mañana a las 7 AM.',
  },
  {
    id: '2',
    title: 'Recordatorio de clase',
    description: 'Tu clase de Spinning comienza en 30 minutos.',
  },
  {
    id: '3',
    title: 'Pago procesado',
    description: 'Tu mensualidad ha sido renovada exitosamente.',
  },
  {
    id: '4',
    title: 'Clase cancelada',
    description: 'La clase de CrossFit de hoy ha sido cancelada por mantenimiento.',
  },
  {
    id: '5',
    title: 'Nuevo miembro',
    description: 'Bienvenido al equipo! Tu acceso ha sido activado.',
  },
];

const NotificationItem = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.notificationItem}>
    <View style={styles.notificationIcon}>
      <BellIcon size={24} color='#F97316' />
    </View>
    <View style={styles.notificationContent}>
      <Text className='font-body' style={styles.notificationTitle}>{title}</Text>
      <Text className='font-body' style={styles.notificationDescription}>{description}</Text>
    </View>
  </View>
);

export default function RecepcionistNotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleBackPress = useCallback(() => {
    router.replace('/(recepcionist)/profile');
    return true;
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );

  return (
    <ThemedView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(recepcionist)/profile')} style={styles.backButton}>
          <ChevronLeftIcon size={28} color='#F97316' />
        </TouchableOpacity>
        <ThemedText className='font-heading' style={styles.headerTitle}>{t('dashboard.notifications.title')}</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/notification-settings')}
          style={styles.settingsButton}>
          <Cog6ToothIcon size={24} color='#111827' />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {mockNotifications.map((item) => (
          <NotificationItem
            key={item.id}
            title={item.title}
            description={item.description}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});
