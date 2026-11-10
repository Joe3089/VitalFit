import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import vitalFitApi from '@/services/vitalfitSdk';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, ImageSourcePropType, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { TrophyIcon as TrophyOutlineIcon } from 'react-native-heroicons/outline';
import { ChevronLeftIcon, GiftIcon, LockClosedIcon, StarIcon } from 'react-native-heroicons/solid';

// Definición de medallas con sus requisitos de puntos
interface Badge {
  id: string;
  titleKey: string;
  rarityKey: 'common' | 'rare' | 'epic' | 'legendary';
  pointsRequired: number;
  medal: ImageSourcePropType;
  requirementKey: string;
}

export default function InsigniasScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [score, setScore] = React.useState(0);
  const [attendanceCount, setAttendanceCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [router]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBack])
  );

  // Cargar datos del backend usando el SDK de VitalFit
  React.useEffect(() => {
    const loadUserData = async () => {
      if (!token) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Obtener datos del usuario (incluye ClientProfile con scoring)
        const userData = await vitalFitApi.user.WhoAmI(token);
        const userScore = userData?.user?.ClientProfile?.scoring ?? 0;
        setScore(userScore);

        // Calcular attendance_count estimado basado en el score
        // Asumiendo que cada asistencia da aproximadamente 10 puntos
        const estimatedAttendance = Math.floor(userScore / 10);
        setAttendanceCount(estimatedAttendance);

        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del usuario:', err);
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [token]);

  // Configuración de las 9 medallas (3 filas x 3 columnas)
  const badges: Badge[] = [
    { id: 'b1', titleKey: 'firstClass', rarityKey: 'common', pointsRequired: 0, medal: require('@/assets/images/medal1.png'), requirementKey: 'firstClass' },
    { id: 'b2', titleKey: 'beginner', rarityKey: 'common', pointsRequired: 100, medal: require('@/assets/images/medal1.png'), requirementKey: 'beginner' },
    { id: 'b3', titleKey: 'dedicated', rarityKey: 'common', pointsRequired: 250, medal: require('@/assets/images/medal1.png'), requirementKey: 'dedicated' },
    { id: 'b4', titleKey: 'ironWarrior', rarityKey: 'rare', pointsRequired: 600, medal: require('@/assets/images/medal3.png'), requirementKey: 'ironWarrior' },
    { id: 'b5', titleKey: 'athlete', rarityKey: 'epic', pointsRequired: 1000, medal: require('@/assets/images/medal2.png'), requirementKey: 'athlete' },
    { id: 'b6', titleKey: 'disciplined', rarityKey: 'epic', pointsRequired: 1500, medal: require('@/assets/images/medal2.png'), requirementKey: 'disciplined' },
    { id: 'b7', titleKey: 'champion', rarityKey: 'legendary', pointsRequired: 2100, medal: require('@/assets/images/medal4.png'), requirementKey: 'champion' },
    { id: 'b8', titleKey: 'master', rarityKey: 'legendary', pointsRequired: 3000, medal: require('@/assets/images/medal4.png'), requirementKey: 'master' },
    { id: 'b9', titleKey: 'fitnessGod', rarityKey: 'legendary', pointsRequired: 6000, medal: require('@/assets/images/medal4.png'), requirementKey: 'fitnessGod' },
  ];

  // Calcular medallas desbloqueadas
  const unlockedBadges = badges.filter(badge => score >= badge.pointsRequired);
  const unlockedCount = unlockedBadges.length;
  const totalBadges = badges.length;
  const progressPercentage = Math.round((unlockedCount / totalBadges) * 100);

  // Calcular nivel actual (basado en medallas desbloqueadas)
  const currentLevel = unlockedCount;
  const nextLevel = currentLevel + 1;

  if (loading) {
    return (
      <ThemedView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="font-body mt-4" style={{ color: '#6B7280' }}>
          {t('insignias.loading')}
        </Text>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 bg-white items-center justify-center px-4">
        <Text className="font-heading" style={{ color: '#EF4444', fontSize: 16, marginBottom: 8 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-orange-500 px-6 py-3 rounded-lg"
        >
          <Text className="font-body text-white">{t('insignias.backButton')}</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 40, paddingBottom: 96 }}
      >
        <View
          className="w-full bg-[#F3F4F6] rounded-2xl py-2 mb-3 items-center justify-center"
          style={{ position: 'relative' }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={{ position: 'absolute', left: 12, top: 8, bottom: 8, justifyContent: 'center' }}
          >
            <ChevronLeftIcon width={20} height={20} color="#f97316" />
          </TouchableOpacity>

          <Text className="font-heading" style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
            {t('insignias.title')}
          </Text>
        </View>

        <LinearGradient
          colors={['#FBBF24', '#F97316']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16 }}
        >
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="font-body" style={{ color: '#FFFFFF', fontSize: 12 }}>
                {t('insignias.currentLevel')}
              </Text>
              <Text className="font-heading" style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 4 }}>
                {currentLevel} / {totalBadges}
              </Text>
              <Text className="font-body" style={{ color: '#FDE68A', fontSize: 11, marginTop: 2 }}>
                {t('insignias.progressToLevel', { level: nextLevel })}
              </Text>
            </View>
            <View className="items-center justify-center">
              <Image
                source={require('@/assets/images/medal2.png')}
                style={{ width: 40, height: 40 }}
                contentFit="contain"
              />
            </View>
          </View>

          <View
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          >
            <View className="h-full" style={{ width: `${progressPercentage}%`, backgroundColor: '#FDBA74' }} />
          </View>
        </LinearGradient>

        <View className="flex-row mb-4">
          <View
            className="flex-1 items-center py-3 rounded-2xl"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1, marginRight: 6 }}
          >
            <GiftIcon width={20} height={20} color="#F97316" />
            <Text className="font-heading" style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginTop: 4 }}>
              {score}
            </Text>
            <Text className="font-body" style={{ color: '#6B7280', fontSize: 11 }}>
              {t('insignias.stats.points')}
            </Text>
          </View>
          <View
            className="flex-1 items-center py-3 rounded-2xl"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1, marginHorizontal: 3 }}
          >
            <StarIcon width={20} height={20} color="#FACC15" />
            <Text className="font-heading" style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginTop: 4 }}>
              {unlockedCount}
            </Text>
            <Text className="font-body" style={{ color: '#6B7280', fontSize: 11 }}>
              {t('insignias.stats.badges')}
            </Text>
          </View>
          <View
            className="flex-1 items-center py-3 rounded-2xl"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1, marginLeft: 6 }}
          >
            <TrophyOutlineIcon width={20} height={20} color="#22C55E" />
            <Text className="font-heading" style={{ color: '#111827', fontSize: 18, fontWeight: '600', marginTop: 4 }}>
              {attendanceCount}
            </Text>
            <Text className="font-body" style={{ color: '#6B7280', fontSize: 11 }}>
              {t('insignias.stats.attendance')}
            </Text>
          </View>
        </View>

        <View
          className="rounded-2xl mb-4 flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}
        >
          <View>
            <Text className="font-heading" style={{ color: '#F97316', fontSize: 12, fontWeight: '600' }}>
              {t('insignias.badgesObtained')}
            </Text>
            <Text className="font-body" style={{ color: '#6B7280', fontSize: 11 }}>
              {unlockedCount} / {totalBadges}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-body" style={{ color: '#6B7280', fontSize: 11 }}>
              {t('insignias.progress')}
            </Text>
            <Text className="font-heading" style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>
              {progressPercentage}%
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row flex-wrap justify-between">
            {badges.map(badge => {
              const isUnlocked = score >= badge.pointsRequired;

              return (
                <View
                  key={badge.id}
                  className="mb-3 rounded-2xl px-3 py-4 items-center"
                  style={{
                    width: '31%',
                    height: 140,
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    opacity: isUnlocked ? 1 : 0.4,
                    position: 'relative',
                  }}
                >
                  <View className="items-center mb-2">
                    {!isUnlocked ? (
                      <LockClosedIcon width={32} height={32} color="#9CA3AF" />
                    ) : (
                      <Image
                        source={badge.medal}
                        style={{ width: 48, height: 48 }}
                        contentFit="contain"
                      />
                    )}
                  </View>
                  <Text
                    className="font-heading"
                    style={{ color: '#111827', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {t(`insignias.badgeNames.${badge.titleKey}`)}
                  </Text>

                  <View
                    className="rounded-full px-2 py-1"
                    style={{
                      backgroundColor: '#F9FAFB',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      position: 'absolute',
                      bottom: 8,
                    }}
                  >
                    <Text className="font-body" style={{ color: '#6B7280', fontSize: 9, textAlign: 'center' }}>
                      {t(`insignias.rarity.${badge.rarityKey}`)}
                    </Text>
                  </View>

                  {!isUnlocked && (
                    <Text
                      className="font-body"
                      style={{
                        marginTop: 4,
                        color: '#9CA3AF',
                        fontSize: 8,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {t(`insignias.requirements.${badge.requirementKey}`)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
