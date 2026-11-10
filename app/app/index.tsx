// app/index.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Montserrat_500Medium, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Global, Location } from 'iconsax-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackgroundCarousel, SignInButton, SignUpButton } from '../components/auth/home';

export default function HomeScreen() {
	const [index, setIndex] = useState(0);
	const [fontsLoaded] = useFonts({
		Montserrat_500Medium,
		Montserrat_700Bold,
	});
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { t } = useTranslation();

	const slideTexts = [t('slide1'), t('slide2'), t('slide3')];

	const { isAuthenticated, isLoading, role } = useAuth();

	React.useEffect(() => {
		if (!isLoading && isAuthenticated) {
			if (role === 'instructor') {
				router.replace('/(instructor)/dashboard');
			} else if (role === 'recepcionist' || role === 'receptionist') {
				router.replace('/(recepcionist)/dashboard');
			} else {
				// Default to client dashboard
				router.replace('/(tabs)/dashboard');
			}
		}
	}, [isLoading, isAuthenticated, role, router]);

	if (!fontsLoaded || isLoading) {
		return (
			<View className='flex-1 items-center justify-center bg-black'>
				<StatusBar barStyle='light-content' backgroundColor='#000' />
				<ActivityIndicator size='large' color='#f97316' />
			</View>
		);
	}

	return (
		<View className='flex-1 bg-black'>
			<StatusBar barStyle='light-content' backgroundColor='#000' />

			<BackgroundCarousel
				images={[
					require('../assets/images/slide1.jpg'),
					require('../assets/images/slide2.jpg'),
					require('../assets/images/slide3.jpg'),
				]}
				onIndexChange={setIndex}
			/>

			<View
				className='absolute inset-0 items-center justify-center'
				style={{ top: '-10%' }}
				pointerEvents='none'>
				<Image
					source={require('../assets/images/isotipo.png')}
					className='w-80 h-80'
					resizeMode='contain'
				/>
			</View>

			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.7)', '#000000']}
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					paddingBottom: insets.bottom + 20,
					paddingHorizontal: 24,
					paddingTop: 48,
				}}>
				<Text className='mb-6 text-center font-heading text-[30px] leading-[36px] text-white'>
					{slideTexts[index]}
				</Text>

				<View className='mb-6 flex-row justify-center'>
					{[0, 1, 2].map((i) => (
						<View
							key={i}
							className={`mx-2 h-1.5 rounded-full ${
								i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
							}`}
						/>
					))}
				</View>

				<View className='mb-4 flex-row justify-center gap-6'>
					<Link href='/language' asChild>
						<TouchableOpacity className='flex-row items-center justify-center py-2'>
							<Global color='white' size={16} variant='Outline' />
							<Text className='ml-2 font-body text-sm text-white'>
								{t('languageLabel')}
							</Text>
						</TouchableOpacity>
					</Link>

					<TouchableOpacity
						onPress={() => router.push('/branches-map')}
						className='flex-row items-center justify-center py-2'>
						<Location color='#f97316' size={16} variant='Outline' />
						<Text className='ml-2 font-body text-sm text-orange-500'>
							{t('dashboard.findBranches')}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Test Notifications Button - For Development 
				<TouchableOpacity
					onPress={() => router.push('/test-notifications')}
					className='mb-4 flex-row items-center justify-center rounded-lg border border-orange-500/50 bg-orange-500/20 py-2'>
					<Text className='font-body text-sm text-orange-400'>
						Test Notifications
					</Text>
				</TouchableOpacity>*/}

				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						width: '100%',
						paddingHorizontal: 10,
						marginTop: 16,
					}}>
					<View style={{ flex: 1, marginRight: 8 }}>
						<SignInButton
							label={t('signIn')}
							onPress={() => router.replace('/(auth)/login')}
						/>
					</View>

					<View style={{ flex: 1, marginLeft: 8 }}>
						<SignUpButton
							label={t('signUp')}
							onPress={() => router.replace('/(auth)/register')}
						/>
					</View>
				</View>
			</LinearGradient>
		</View>
	);
}
