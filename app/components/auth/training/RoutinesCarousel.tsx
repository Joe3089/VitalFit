import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageSourcePropType, ScrollView, Text, View } from 'react-native';

export type RoutineChip = {
  id: string;
  label: string;
  image: ImageSourcePropType; 
};

export type RoutinesCarouselProps = {
  items: RoutineChip[];
  showTitle?: boolean;
  titleText?: string;
  titleColor?: string;
};

export default function RoutinesCarousel({
  items,
  showTitle = true,
  titleText = 'Rutinas',
  titleColor = '#111827',
}: RoutinesCarouselProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      {showTitle && (
        <Text
          className='font-heading'
          style={{
            fontFamily: 'BebasNeue-Regular',
            fontSize: 28,
            color: titleColor,
            marginBottom: 8,
          }}
        >
          {titleText}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        {items.map((it) => (
          <LinearGradient
            key={it.id}
            colors={["#4F3521", "#F27F2A"]}
            locations={[0.2, 0.9]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              width: 110,
              height: 140,
              borderRadius: 16,
              padding: 12,
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Image source={it.image} style={{ width: 48, height: 48, tintColor: '#F27F2A', marginBottom: 10 }} resizeMode="contain" />
              <Text className='font-body' style={{ color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }}>{it.label}</Text>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
}
