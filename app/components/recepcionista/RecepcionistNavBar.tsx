import { HapticTab } from '@/components/haptic-tab';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CalendarIcon, HomeIcon, QrCodeIcon, UserIcon } from 'react-native-heroicons/solid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RecepcionistNavBar() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#a1a1aa',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#1f2937',
          borderTopWidth: 0,
          borderRadius: 0,
          marginHorizontal: 0,
          height: 60 + insets.bottom,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 8,
          overflow: 'hidden',
          elevation: 0,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 60,
          paddingVertical: 0,
          paddingTop: 0,
          paddingBottom: 0,
          margin: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarShowLabel: false,
        tabBarLabel: () => null,
      }}>
      <Tabs.Screen
        name='dashboard'
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#f97316' : 'transparent',
                borderRadius: 12,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
              }}>
              <HomeIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='check-in'
        options={{
          title: t('nav.qr'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#f97316' : 'transparent',
                borderRadius: 12,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
              }}>
              <QrCodeIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='schedule'
        options={{
          title: t('nav.schedule'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#f97316' : 'transparent',
                borderRadius: 12,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
              }}>
              <CalendarIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='class-details'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='personal-info'
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name='security'
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name='change-password'
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name='enroll-client'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='notifications'
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name='language'
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: focused ? '#f97316' : 'transparent',
                borderRadius: 12,
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
              }}>
              <UserIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
