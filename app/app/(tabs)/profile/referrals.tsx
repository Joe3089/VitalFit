import { ThemedView } from '@/components/themed-view';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAPIError } from '@vitalfit/sdk';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  ChatBubbleBottomCenterTextIcon,
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  GiftIcon,
  QrCodeIcon,
  ShareIcon,
  UserCircleIcon,
  UserGroupIcon
} from 'react-native-heroicons/solid';

const referralsHistory = [
  { id: 'r1', name: 'Juan Perez', points: 500 },
  { id: 'r2', name: 'Juan Perez', points: 500 },
  { id: 'r3', name: 'Juan Perez', points: 500 },
  { id: 'r4', name: 'Juan Perez', points: 500 },
];

export default function ReferralsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  const referralCode = 'CARLOS2024';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No se encontró token en AsyncStorage (Referrals)');
          return;
        }

        const userData = await vitalFitApi.user.WhoAmI(token);
        setFirstName(userData?.user?.first_name || 'Cliente');
        setLastName(userData?.user?.last_name || '');
      } catch (error: unknown) {
        let errorMessage = 'Ocurrió un error inesperado al obtener los datos del usuario (Referrals).';
        if (isAPIError(error)) {
          errorMessage = error.messages.join(', ');
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Error en whoami (Referrals):', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const displayName = lastName ? `${firstName ?? 'Cliente'} ${lastName}` : firstName ?? 'Cliente';

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
    } catch (error) {
      console.error('Error al copiar código de referido:', error);
    }
  };

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center bg-white'>
        <ActivityIndicator size='large' color='#F27F2A' />
      </View>
    );
  }

  return (
    <ThemedView className='flex-1 bg-white'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 96 }}>
        <View
          className='w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center'
          style={{ position: 'relative' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}>
            <ChevronLeftIcon width={20} height={20} color='#f97316' />
          </TouchableOpacity>

          <Text className='font-heading' style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>Programa de referidos</Text>
        </View>

        <View className='flex-row mb-4'>
          <View
            className='flex-1 items-center py-3 rounded-2xl mr-2'
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}>
            <UserGroupIcon width={20} height={20} color='#F97316' />
            <Text className='font-heading' style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginTop: 4 }}>5</Text>
            <Text className='font-body' style={{ color: '#6B7280', fontSize: 11 }}>Referidos activos</Text>
          </View>

          <View
            className='flex-1 items-center py-3 rounded-2xl ml-2'
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}>
            <GiftIcon width={20} height={20} color='#F97316' />
            <Text className='font-heading' style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginTop: 4 }}>2,500</Text>
            <Text className='font-body' style={{ color: '#6B7280', fontSize: 11 }}>Puntos ganados</Text>
          </View>
        </View>

        <View className='items-center mb-4'>
          <Text className='font-body' style={{ color: '#6B7280', fontSize: 12, letterSpacing: 1 }}>TU CÓDIGO DE REFERIDO</Text>

          <View className='items-center justify-center mt-6 mb-4'>
            <QrCodeIcon width={80} height={80} color='#111827' />
          </View>

          <View className='flex-row items-center justify-center mb-2'>
            <Text className='font-body' style={{ color: '#111827', fontSize: 14, fontWeight: '600', marginRight: 8 }}>
              {displayName}
            </Text>
            <TouchableOpacity activeOpacity={0.8} onPress={handleCopyCode}>
              <ClipboardDocumentCheckIcon width={20} height={20} color='#111827' />
            </TouchableOpacity>
          </View>

          <Text
            className='font-body'
            style={{
              color: '#4B5563',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 8,
            }}>
            Comparte tu código y gana 500 puntos por cada amigo que se una.
          </Text>
        </View>

        <View className='flex-row justify-between mb-4'>
          <TouchableOpacity
            activeOpacity={0.8}
            className='flex-1 items-center py-2 rounded-2xl mr-2'
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}>
            <ShareIcon width={18} height={18} color='#111827' />
            <Text className='font-body' style={{ color: '#111827', fontSize: 11, marginTop: 4 }}>Compartir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className='flex-1 items-center py-2 rounded-2xl mx-1'
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}>
            <ChatBubbleBottomCenterTextIcon width={18} height={18} color='#22C55E' />
            <Text className='font-body' style={{ color: '#111827', fontSize: 11, marginTop: 4 }}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className='flex-1 items-center py-2 rounded-2xl ml-2'
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}>
            <EnvelopeIcon width={18} height={18} color='#111827' />
            <Text className='font-body' style={{ color: '#111827', fontSize: 11, marginTop: 4 }}>Email</Text>
          </TouchableOpacity>
        </View>

        <View
          className='rounded-2xl mb-4 px-4 py-3'
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}>
          <Text className='font-heading' style={{ color: '#111827', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            Beneficios
          </Text>

          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <UserCircleIcon width={18} height={18} color='#F97316' />
            </View>
            <View style={{ flex: 1 }}>
              <Text className='font-heading' style={{ color: '#111827', fontSize: 13, fontWeight: '600' }}>Tu amigo recibe</Text>
              <Text className='font-body' style={{ color: '#6B7280', fontSize: 12 }}>1 semana gratis + 500 puntos</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <GiftIcon width={18} height={18} color='#F97316' />
            </View>
            <View style={{ flex: 1 }}>
              <Text className='font-heading' style={{ color: '#111827', fontSize: 13, fontWeight: '600' }}>Tú recibes</Text>
              <Text className='font-body' style={{ color: '#6B7280', fontSize: 12 }}>500 puntos por cada amigo que se una</Text>
            </View>
          </View>
        </View>

        <View className='mb-2'>
          <Text className='font-heading text-[14px] font-semibold text-[#111827] mb-2'>Historial de referidos</Text>
        </View>

        <View>
          {referralsHistory.map(item => (
            <View
              key={item.id}
              className='w-full flex-row items-center justify-between rounded-2xl bg-white border px-4 py-3 mb-3'
              style={{ borderColor: '#F97316' }}>
              <View className='flex-row items-center'>
                <View className='w-8 h-8 rounded-full bg-[#F3F4F6] items-center justify-center mr-3'>
                  <UserCircleIcon width={18} height={18} color='#F97316' />
                </View>
                <Text className='font-body text-[13px] text-[#111827]'>{item.name}</Text>
              </View>
              <Text className='font-body' style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>+{item.points} PTS</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
