import ClassCard from '@/components/ClassCard';
import { MonthCalendar } from '@/components/auth/dashboard/monthcalendar';
import { WeekCalendar } from '@/components/auth/dashboard/weekcalendar';
import { BranchSelector } from '@/components/recepcionista/BranchSelector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBranch } from '@/contexts/BranchContext';
import vitalFitApi from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BranchClassInfo, isAPIError } from '@vitalfit/sdk';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FunnelIcon } from 'react-native-heroicons/outline';

export default function ReceptionistScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedBranch } = useBranch();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Data States
  const [rawClasses, setRawClasses] = useState<BranchClassInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cache for enriched data
  interface ServiceData {
      name: string;
      image?: string;
      description?: string;
  }
  interface InstructorData {
        name: string;
        image?: string;
  }

  const [serviceData, setServiceData] = useState<Record<string, ServiceData>>({});
  const [instructorData, setInstructorData] = useState<Record<string, InstructorData>>({});
  // Booking count removed from schedule view for optimization

  // Back handler
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(recepcionist)/dashboard');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  const handleDateSelect = (date: { dateString: string }) => {
     if (date?.dateString) {
         setSelectedDateStr(date.dateString);
     }
  };

  // 1. Fetch Raw Schedule for Branch
  useEffect(() => {
      const fetchScheduleRaw = async () => {
          if (!selectedBranch?.branch_id) return;
          
          setLoading(true);
          setErrorMessage(null);
          setRawClasses([]); // Clear previous to avoid mixups

          try {
              const token = await AsyncStorage.getItem('token');
              const response = await vitalFitApi.schedule.ListBranchesClass(
                  selectedBranch.branch_id,
                  token || '',
              );

              const items = Array.isArray(response) 
                  ? response 
                  : (response?.data ? response.data : []);
              
              setRawClasses(items as BranchClassInfo[]);

          } catch (error) {
              if (isAPIError(error)) {
                  setErrorMessage(error.message || t('common.errorLoading'));
              } else {
                  setErrorMessage(t('common.errorLoading'));
              }
          } finally {
              setLoading(false);
          }
      };

      fetchScheduleRaw();
  }, [selectedBranch, t]);


  // 2. Strict Date Filtering (Memoized)
  const filteredRawClasses = useMemo(() => {
     if (!selectedDateStr) return [];
     
     // Ensure we compare strictly by local YYYY-MM-DD
     // The raw data from SDK usually has starts_at as ISO string.
     return rawClasses.filter(item => {
         if (!item.starts_at) return false;
         const itemDatePart = String(item.starts_at).split('T')[0];
         return itemDatePart === selectedDateStr;
     });
  }, [rawClasses, selectedDateStr]);


  // 3. Lazy Data Enrichment (Instructors/Services)
  // We only fetch for the *visible* filtered classes to save bandwidth
  useEffect(() => {
      if (filteredRawClasses.length === 0) return;

      const enrich = async () => {
          setEnrichmentLoading(true);
          const token = await AsyncStorage.getItem('token');

          // Dedup IDs to fetch
          const uniqueServiceIds = [...new Set(filteredRawClasses.map(c => c.service_id).filter(Boolean).map(String))];
          const uniqueInstructorIds = [...new Set(filteredRawClasses.map(c => c.instructor_id).filter(Boolean).map(String))];

          // Optimization: We introduced a simple `serviceCache` object outside of state if we wanted, 
          // but here we will just fetch what is needed.
          
          // Services
          for (const sid of uniqueServiceIds) {
              const sIdStr = String(sid);
              
              try {
                  const sResp = await vitalFitApi.products.getServiceByID(sIdStr, token || '');
                  const s = sResp.data;
                  const name = s?.name || t('common.unknown');
                  let image = undefined;
                   const images = Array.isArray(s?.images) ? s.images : [];
                    if (Array.isArray(images) && images.length > 0) {
                        const primary = images.find((img) => img.is_primary) ?? images[0];
                        if (primary?.image_url) image = primary.image_url;
                    }
                  
                  const data = { name, image, description: s?.description };
                  setServiceData(prev => ({ ...prev, [sIdStr]: data }));
              } catch {
                  // ignore
              }
          }

          // Instructors
          for (const iid of uniqueInstructorIds) {
               const iIdStr = String(iid);
               
               try {
                  const instResp = await vitalFitApi.instructor.getInstructorById(iIdStr, token || '');
                  const inst = instResp.data;
                  const name = [inst?.first_name, inst?.last_name].filter(Boolean).join(' ');
                  const data = { name, image: inst?.profile_picture_url };
                  setInstructorData(prev => ({ ...prev, [iIdStr]: data }));
               } catch {
                   // Fallback for forbidden or error
                   const fallback = { name: 'Instructor', image: undefined };
                   setInstructorData(prev => ({ ...prev, [iIdStr]: fallback }));
               }
          }

          setEnrichmentLoading(false);
      };

      enrich();

  }, [filteredRawClasses, t]); // Removed state deps (instructorData, serviceData) to prevent loops. Relying on strict filteredClasses trigger.


  // Sort and Map for Display
  const finalClasses = useMemo(() => {
      const mapped = filteredRawClasses.map(item => {
          const startsAt = item.starts_at || '';
            const endsAt = item.ends_at || '';

            const extractTime = (value: string) => {
                if (!value) return '';
                try {
                    const date = new Date(value);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                } catch {
                    return '';
                }
            };

            const startTime = extractTime(String(startsAt));
            const endTime = extractTime(String(endsAt));
            const time = endTime ? `${startTime} - ${endTime}` : startTime;
            
            const sid = String(item.service_id || '');
            const iid = String(item.instructor_id || '');
            const cid = String(item.class_id || '');

            const sInfo = serviceData[sid] || { name: t('common.unknown') };
            const iInfo = instructorData[iid] || { name: t('common.unknown') }; // Will default to unknown until loaded

            return {
                classId: cid,
                serviceId: sid,
                instructorId: iid,
                startsAt: String(startsAt || ''),
                endsAt: String(endsAt || ''),
                time,
                title: sInfo.name,
                instructor: iInfo.name !== 'Instructor' ? `${t('common.with')} ${iInfo.name}` : t('common.unknown'),
                branch: selectedBranch?.name || '',
                imageUrl: sInfo.image || require('@/assets/images/rutina.png'),
                capacity: item.max_capacity || 0,
                occupied: 0, // Placeholder, fetched in details
                rawDate: String(startsAt).split('T')[0] || '',
                description: sInfo.description,
                instructorImage: iInfo.image,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                notes: (item as any).notes
            };
      });
      return mapped.sort((a,b) => a.time.localeCompare(b.time));

  }, [filteredRawClasses, serviceData, instructorData, selectedBranch, t]);


  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/Frame.png')}
              style={styles.logo}
              resizeMode='contain'
            />
          </View>

          <View style={styles.viewSelectorContainer}>
            <View style={styles.viewSelector}>
              <TouchableOpacity
                style={[styles.viewOption, viewMode === 'week' && styles.activeViewOption]}
                onPress={() => setViewMode('week')}
              >
                <ThemedText style={[styles.viewOptionText, viewMode === 'week' && styles.activeViewText]}>
                  {t('schedule.week')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewOption, viewMode === 'month' && styles.activeViewOption]}
                onPress={() => setViewMode('month')}
              >
                <ThemedText style={[styles.viewOptionText, viewMode === 'month' && styles.activeViewText]}>
                  {t('schedule.month')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

         {/* Calendar View */}
        <View style={{ marginBottom: 20 }}>
            {viewMode === 'month' ? (
                <MonthCalendar
                    initialDate={selectedDateStr}
                    onDateSelect={handleDateSelect}
                />
            ) : (
                <WeekCalendar
                    initialDate={selectedDateStr}
                    onDateSelect={handleDateSelect}
                />
            )}
        </View>

         {/* Filters Row */}
        <View style={styles.filtersRow}>
             <View style={{ flex: 1, marginRight: 10 }}>
                <BranchSelector />
             </View>
             <TouchableOpacity style={styles.filterButton}>
                <FunnelIcon size={20} color="#6B7280" />
            </TouchableOpacity>
        </View>

        {loading ? (
             <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 20 }} />
        ) : (
            <>
                {errorMessage && (
                    <ThemedText style={{ color: 'red', textAlign: 'center', marginVertical: 10 }}>{errorMessage}</ThemedText>
                )}
                
                <View style={styles.dateSection}>
                    {finalClasses.length > 0 ? (
                        <>
                        {finalClasses.map((classItem, index) => (
                             <ClassCard
                                key={`${classItem.classId}-${index}`}
                                time={classItem.time}
                                title={classItem.title}
                                instructor={classItem.instructor}
                                branch={classItem.branch}
                                imageUrl={classItem.imageUrl}
                                variant='overlay'
                                category={`${t('dashboard.capacity.occupancy')}: ${classItem.capacity || 0}`}
                                onPress={() => {
                                    router.push({
                                        pathname: '/(recepcionist)/class-details',
                                        params: {
                                            id: classItem.classId,
                                            name: classItem.title,
                                            date: classItem.rawDate,
                                            time: classItem.time,
                                            capacity: String(classItem.capacity),
                                            enrolled: "0", // Will be fetched in details
                                            status: 'available',
                                            instructor: classItem.instructor,
                                            description: classItem.description,
                                            instructorImage: classItem.instructorImage,
                                            serviceImage: typeof classItem.imageUrl === 'string' ? classItem.imageUrl : undefined,
                                            notes: classItem.notes,
                                        },
                                    });
                                }}
                            />
                        ))}
                        </>
                    ) : (
                         !loading && !errorMessage && (
                            <ThemedText style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>
                                {t('schedule.noClassesBranch')}
                            </ThemedText>
                        )
                    )}
                     {enrichmentLoading && finalClasses.length > 0 && (
                        <ActivityIndicator size="small" color="#F97316" style={{ marginTop: 10 }} />
                    )}
                </View>
            </>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 45, // Increased padding
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 40,
  },
  viewSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 2,
  },
  viewOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  activeViewOption: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeViewText: {
    color: '#111827',
  },
  filtersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
  },
  filterButton: {
      padding: 10,
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      height: 48, 
      width: 48,
  },
  dateSection: {
      marginBottom: 20,
      minHeight: 200, 
  },
  dateHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      textTransform: 'capitalize'
  },
});
