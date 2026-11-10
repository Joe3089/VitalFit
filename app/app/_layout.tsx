import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ReservationsProvider } from '@/contexts/reservations';
import { UserProvider } from '@/contexts/UserContext';
import { ClerkProvider } from '@clerk/clerk-expo';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import '../global.css';
import '../services/i18n';

SplashScreen.preventAutoHideAsync();

const tokenCache = {
    async getToken(key: string) {
        try {
            return SecureStore.getItemAsync(key);
        } catch {
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch {
            return;
        }
    },
};

export default function RootLayout() {
    const { t } = useTranslation();
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    const [loaded] = useFonts({
        'BebasNeue-Regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
        'Montserrat-ExtraBold': require('../assets/fonts/Montserrat-ExtraBold.ttf'),
    });

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) return null;

    if (!publishableKey) {
        throw new Error(
            'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
        );
    }

    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <AuthProvider>
                <UserProvider>
                    <NotificationProvider>
                        <ReservationsProvider>
                            <ThemeProvider value={DefaultTheme}>
                                <Stack>
                                    <Stack.Screen name='index' options={{ headerShown: false }} />
                                    <Stack.Screen name='(auth)' options={{ headerShown: false }} />
                                    <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
                                    <Stack.Screen
                                        name='instructor-security'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-change-password'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-notifications'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-notifications-settings'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen name='(instructor)' options={{ headerShown: false }} />
                                    <Stack.Screen name='(recepcionist)' options={{ headerShown: false }} />

                                    <Stack.Screen name='language' options={{ headerShown: false }} />

                                    <Stack.Screen
                                        name='cancel-membership'
                                        options={{
                                            title: t('nav.membership'),
                                            headerShown: true,
                                            headerBackTitle: t('nav.back'),
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-confirm'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-payment-transfer'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-payment-pagomovil'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-methods'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-payment'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                            headerBackTitle: '',
                                            headerStyle: { backgroundColor: '#000000' },
                                            headerTintColor: '#ffffff',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-entry'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='memberships'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-checkout'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='membership-extra'
                                        options={{
                                            title: '',
                                            headerShown: false,
                                        }}
                                    />
                                    <Stack.Screen
                                        name='class-details'
                                        options={{
                                            title: t('nav.classDetails'),
                                            headerShown: false,
                                            headerBackTitle: t('nav.back'),
                                        }}
                                    />
                                    <Stack.Screen
                                        name='routine/details'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='routine/history'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-assign-routine'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-create-routine'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-my-routines'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-edit-routine'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-client-progress'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name='instructor-profile-personal'
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="services"
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="chatbot"
                                        options={{
                                            headerShown: false,
                                            title: '',
                                            presentation: 'modal',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="branches-map"
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="notifications"
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="badges"
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="client-ai-routines"
                                        options={{
                                            headerShown: false,
                                            title: '',
                                        }}
                                    />
                                </Stack>
                                <StatusBar style='auto' />
                                <Toast />
                            </ThemeProvider>
                        </ReservationsProvider>
                    </NotificationProvider>
                </UserProvider>
            </AuthProvider>
        </ClerkProvider>
    );
}