import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { FloatingChatButton } from '@/components/FloatingChatButton';
import { HapticTab } from '@/components/haptic-tab';

import { Dumbbell } from 'lucide-react-native';
import { View } from 'react-native';
import { CalendarIcon, HomeIcon, UserIcon, UsersIcon } from 'react-native-heroicons/solid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const tabBarHeight = 60 + insets.bottom;

    return (
        <>
            <FloatingChatButton bottomOffset={tabBarHeight + 16} />
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
                name='training'
                options={{
                    title: t('nav.training'),
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
                            <Dumbbell
                                color={focused ? '#fff' : '#a1a1aa'}
                                size={24}
                                strokeWidth={1.5}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name='community'
                options={{
                    href: null,
                    title: t('nav.community'),
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
                            <UsersIcon color={focused ? '#fff' : '#a1a1aa'} size={24} />
                        </View>
                    ),
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
        </>
    );
}