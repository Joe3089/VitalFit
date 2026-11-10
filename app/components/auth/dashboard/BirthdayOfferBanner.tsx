import vitalFitApi from '@/services';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface RandomBanner {
  image_url: string;
  service_id: string;
}

interface ServiceDetails {
  name: string;
  category?: {
    name: string;
  };
  banners?: {
    name: string;
  }[];
}

export default function BirthdayOfferBanner() {
    const router = useRouter();
	const [banner, setBanner] = useState<RandomBanner | null>(null);
    const [serviceName, setServiceName] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {

        
        // Wrapper to handle the finally logic cleanly without the 'finally' block interfering with recursion
        // Wrapper removed as unnecessary
        // Actually, let's just implement the logic inside one effect with a loop instead of recursion to avoid stack/complexity issues with React useEffect.
        // It's cleaner.
        const executeFetch = async () => {
             let attempts = 0;
             const maxAttempts = 4; // Initial + 3 retries
             
             while (attempts < maxAttempts) {
                 attempts++;
                 try {
                    const timestamp = Date.now() + Math.random();
                     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                     // @ts-ignore
                     const bannerResponse = await vitalFitApi.client.get({
                         url: `/marketing/banners/random?t=${timestamp}`,
                     });
                     
                     const bannerDataRaw = bannerResponse.data || bannerResponse;
                     const bannerData = (bannerDataRaw.data || bannerDataRaw) as RandomBanner;

                     if (bannerData && bannerData.image_url) {

                         // Relaxed filter: check ID OR URL match (and handle potential whitespace)
                         const forbiddenId = '184ae346-b6e0-4985-af14-8c9777eb8cab';
                         const forbiddenUrlPart = 'Screenshot-2026-01-08-140639.png'; // Unique part of the URL

                         const isForbidden = 
                             (bannerData.service_id?.trim() === forbiddenId) ||
                             (bannerData.image_url?.includes(forbiddenUrlPart));
                        
                         if (isForbidden) {

                             continue; // Try again
                         }
                         
                         // Valid banner found
                         setBanner(bannerData);
                         
                         // Fetch Service Details
                         if (bannerData.service_id) {
                            try {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                const serviceResponse = await vitalFitApi.client.get({
                                    url: `/services/${bannerData.service_id}`,
                                });
                                const serviceDataRaw = serviceResponse.data || serviceResponse;
                                const serviceData = (serviceDataRaw.data || serviceDataRaw) as ServiceDetails & { banners?: { name: string }[] };
                                
                                if (serviceData) {
                                    // User requested to use the name from the 'banners' array
                                    if (serviceData.banners && serviceData.banners.length > 0 && serviceData.banners[0].name) {
                                        setServiceName(serviceData.banners[0].name);
                                    } else {
                                        // Fallback to service name if banner name is missing
                                        setServiceName(serviceData.name);
                                    }

                                    if (serviceData.category?.name) {
                                        setCategoryName(serviceData.category.name);
                                    }
                                }
                            } catch {
                                // Ignore parsing errors
                            }
                         }
                         break; // Exit loop efficiently
                     } else {
                         // No banner data
                         break;
                     }
                 } catch {
                     break; // Don't retry on API error to avoid unexpected behavior
                 }
             }
             setLoading(false);
        };

		executeFetch();
	}, []);

	if (loading || !banner) {
		return null; 
	}

	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={() => router.push('/services')}
			className='h-40 w-full rounded-2xl overflow-hidden relative bg-gray-100'>
			<Image
				source={{ uri: banner.image_url }}
				style={{ width: '100%', height: '100%' }}
				resizeMode='cover'
			/>
            
            {/* Overlay Gradient/Text if we have service info */}
            {(serviceName || categoryName) && (
                <View className='absolute bottom-0 left-0 right-0 bg-black/40 p-4'>
                    {categoryName && (
                        <Text className='text-orange-400 font-bold text-xs uppercase tracking-wider mb-1'>
                            {categoryName}
                        </Text>
                    )}
                    {serviceName && (
                        <Text className='text-white font-bold text-lg' numberOfLines={2}>
                            {serviceName}
                        </Text>
                    )}
                </View>
            )}
		</TouchableOpacity>
	);
}
