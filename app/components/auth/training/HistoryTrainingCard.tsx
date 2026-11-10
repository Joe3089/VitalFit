import React from 'react';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type HistoryTrainingCardProps = {
  id: string;
  title: string;
  subtitle: string;
  progressPercent: number; 
  instructor?: string;
  duration?: string;
  onPress?: () => void;
  imageSource?: ImageSourcePropType;
};

export default function HistoryTrainingCard({ title, subtitle, progressPercent, instructor = 'Instructor', duration = '—', onPress, imageSource }: HistoryTrainingCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-full rounded-2xl overflow-hidden bg-white mb-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}
    >

      <View style={{ height: 160 }}>
        <Image
          source={imageSource ?? require('@/assets/images/rutin.png')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        <View style={{ position: 'absolute', left: 12, right: 72, top: 12 }}>
          <Text className='font-body' style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
            {title}
          </Text>
          <Text className='font-body' style={{ color: '#E5E7EB', fontWeight: '600', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
          <Text className='font-body' style={{ color: '#E5E7EB', fontSize: 12, marginTop: 2 }}>Instructor: {instructor}</Text>
          <Text className='font-body' style={{ color: '#E5E7EB', fontSize: 12, marginTop: 2 }}>Duración: {duration}</Text>
        </View>

        <View style={{ position: 'absolute', right: 12, top: 12, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,24,39,0.6)' }}>
          {(() => {
            const size = 40;
            const stroke = 4;
            const radius = (size - stroke) / 2;
            const circumference = 2 * Math.PI * radius;
            const progress = Math.max(0, Math.min(100, progressPercent));
            const dash = (progress / 100) * circumference;
            const gap = circumference - dash;
            return (
              <Svg width={size} height={size}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={"rgba(255,255,255,0.35)"} strokeWidth={stroke} fill="none" />
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={"#F27F2A"} strokeWidth={stroke} fill="none" strokeDasharray={`${dash},${gap}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
              </Svg>
            );
          })()}
          <Text className='font-body' style={{ position: 'absolute', color: '#F27F2A', fontWeight: '700', fontSize: 11 }}>{Math.round(progressPercent)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
