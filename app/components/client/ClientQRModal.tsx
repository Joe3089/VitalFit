import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { QrCodeIcon } from 'react-native-heroicons/outline';

interface ClientQRModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ClientQRModal({ visible, onClose }: ClientQRModalProps) {
  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}>
        <View
          style={{
            width: '100%',
            maxWidth: 360,
            borderRadius: 16,
            backgroundColor: '#1f2937',
            paddingVertical: 24,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}>
          <Text
            className='font-body'
            style={{
              color: '#F9FAFB',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
            }}>
            Código QR
          </Text>
          <Text
            className='font-body'
            style={{
              color: '#E5E7EB',
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 20,
            }}>
            Usa este código para registrar tu entrada como cliente en el gimnasio
          </Text>

          <View
            style={{
              width: 170,
              height: 170,
              borderRadius: 28,
              backgroundColor: '#1f2937',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
            <QrCodeIcon width={120} height={120} color='#F9FAFB' />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
