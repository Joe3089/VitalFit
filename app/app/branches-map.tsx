import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import vitalFitApi from '@/services';
import { isAPIError } from '@vitalfit/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	View,
	TextInput,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
	ArrowLeftIcon,
	MagnifyingGlassIcon,
	MapPinIcon,
	PhoneIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from 'react-native-heroicons/outline';

type BranchInfo = {
	address: string;
	branch_id: string;
	latitude: number;
	longitude: number;
	name: string;
	phone: string;
};

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const CARDS_PER_PAGE = 4;

type UserLocation = {
	latitude: number;
	longitude: number;
} | null;

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number => {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

// Find the closest branch to the user's location
const findClosestBranch = (
	branches: BranchInfo[],
	userLocation: UserLocation
): BranchInfo | null => {
	if (!userLocation || branches.length === 0) return null;

	let closestBranch = branches[0];
	let minDistance = calculateDistance(
		userLocation.latitude,
		userLocation.longitude,
		branches[0].latitude,
		branches[0].longitude
	);

	for (let i = 1; i < branches.length; i++) {
		const distance = calculateDistance(
			userLocation.latitude,
			userLocation.longitude,
			branches[i].latitude,
			branches[i].longitude
		);
		if (distance < minDistance) {
			minDistance = distance;
			closestBranch = branches[i];
		}
	}

	return closestBranch;
};

const generateMapHTML = (
	branches: BranchInfo[],
	selectedBranchId: string | null,
	userLocation: UserLocation
) => {
	const markersGeoJSON = {
		type: 'FeatureCollection',
		features: branches.map((branch) => ({
			type: 'Feature',
			properties: {
				id: branch.branch_id,
				name: branch.name,
				address: branch.address,
				phone: branch.phone,
				isSelected: branch.branch_id === selectedBranchId,
			},
			geometry: {
				type: 'Point',
				coordinates: [branch.longitude, branch.latitude],
			},
		})),
	};

	// Calculate center - prioritize selected branch, then user location, then average of branches
	let center = [-66.9036, 10.4806]; // Default Venezuela
	let zoom = 10;

	if (branches.length > 0) {
		const avgLng = branches.reduce((sum, b) => sum + b.longitude, 0) / branches.length;
		const avgLat = branches.reduce((sum, b) => sum + b.latitude, 0) / branches.length;
		center = [avgLng, avgLat];
		zoom = 11;
	}

	// If user location is available, center on it
	if (userLocation) {
		center = [userLocation.longitude, userLocation.latitude];
		zoom = 12;
	}

	// If a branch is selected, center on it
	if (selectedBranchId) {
		const selected = branches.find((b) => b.branch_id === selectedBranchId);
		if (selected) {
			center = [selected.longitude, selected.latitude];
			zoom = 14;
		}
	}

	// Add user location marker HTML
	const userLocationMarkerJS = userLocation
		? `
		// Add user location marker
		const userEl = document.createElement('div');
		userEl.className = 'user-marker';
		userEl.innerHTML = '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>';
		new mapboxgl.Marker(userEl)
			.setLngLat([${userLocation.longitude}, ${userLocation.latitude}])
			.addTo(map);
		`
		: '';

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
	<script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"></script>
	<link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
		#map { position: absolute; top: 0; bottom: 0; width: 100%; }
		.marker {
			width: 30px;
			height: 30px;
			border-radius: 50%;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 3px solid white;
			box-shadow: 0 2px 6px rgba(0,0,0,0.3);
		}
		.marker-default { background-color: #EF4444; }
		.marker-selected {
			background-color: #F27F2A;
			width: 40px;
			height: 40px;
			border-width: 4px;
		}
		.marker-inner {
			width: 8px;
			height: 8px;
			background: white;
			border-radius: 50%;
		}
		.mapboxgl-popup-content {
			padding: 12px 16px;
			border-radius: 12px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		}
		.popup-name {
			font-weight: 700;
			font-size: 14px;
			color: #1f2937;
			margin-bottom: 4px;
		}
		.popup-address {
			font-size: 12px;
			color: #6b7280;
			margin-bottom: 2px;
		}
		.popup-phone {
			font-size: 12px;
			color: #6b7280;
		}
		.user-marker {
			position: relative;
			width: 20px;
			height: 20px;
		}
		.user-marker-dot {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 14px;
			height: 14px;
			background: #3B82F6;
			border: 3px solid white;
			border-radius: 50%;
			box-shadow: 0 2px 6px rgba(0,0,0,0.3);
			z-index: 2;
		}
		.user-marker-pulse {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 40px;
			height: 40px;
			background: rgba(59, 130, 246, 0.3);
			border-radius: 50%;
			animation: pulse 2s ease-out infinite;
		}
		@keyframes pulse {
			0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
			100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
		}
	</style>
</head>
<body>
	<div id="map"></div>
	<script>
		mapboxgl.accessToken = '${MAPBOX_TOKEN}';

		const map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v12',
			center: ${JSON.stringify(center)},
			zoom: ${zoom}
		});

		map.addControl(new mapboxgl.NavigationControl(), 'top-right');

		const branches = ${JSON.stringify(markersGeoJSON.features)};
		const markers = [];

		branches.forEach(feature => {
			const el = document.createElement('div');
			el.className = 'marker ' + (feature.properties.isSelected ? 'marker-selected' : 'marker-default');

			const inner = document.createElement('div');
			inner.className = 'marker-inner';
			el.appendChild(inner);

			const popup = new mapboxgl.Popup({ offset: 25 })
				.setHTML(
					'<div class="popup-name">' + feature.properties.name + '</div>' +
					'<div class="popup-address">' + feature.properties.address + '</div>' +
					(feature.properties.phone ? '<div class="popup-phone">' + feature.properties.phone + '</div>' : '')
				);

			const marker = new mapboxgl.Marker(el)
				.setLngLat(feature.geometry.coordinates)
				.setPopup(popup)
				.addTo(map);

			el.addEventListener('click', () => {
				window.ReactNativeWebView.postMessage(JSON.stringify({
					type: 'markerClick',
					branchId: feature.properties.id
				}));
			});

			markers.push({ marker, id: feature.properties.id });
		});

		// Open popup for selected branch
		const selectedBranchId = '${selectedBranchId || ''}';
		if (selectedBranchId) {
			const selectedMarker = markers.find(m => m.id === selectedBranchId);
			if (selectedMarker) {
				selectedMarker.marker.togglePopup();
			}
		}

		${userLocationMarkerJS}

		// Listen for flyTo commands from React Native
		window.flyToBranch = function(lng, lat) {
			map.flyTo({
				center: [lng, lat],
				zoom: 14,
				duration: 1000
			});
		};
	</script>
</body>
</html>
`;
};

export default function BranchesMapScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const webViewRef = useRef<WebView>(null);

	const [branches, setBranches] = useState<BranchInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedBranch, setSelectedBranch] = useState<BranchInfo | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(0);
	const [userLocation, setUserLocation] = useState<UserLocation>(null);
	const [initialSelectionDone, setInitialSelectionDone] = useState(false);

	// Get user location
	useEffect(() => {
		const getUserLocation = async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					console.log('Location permission denied');
					return;
				}

				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Balanced,
				});

				setUserLocation({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});
			} catch (err) {
				console.log('Error getting location:', err);
			}
		};

		getUserLocation();
	}, []);

	// Auto-select closest branch when we have both branches and user location
	useEffect(() => {
		if (!initialSelectionDone && branches.length > 0 && userLocation) {
			const closest = findClosestBranch(branches, userLocation);
			if (closest) {
				setSelectedBranch(closest);
				setInitialSelectionDone(true);
			}
		}
	}, [branches, userLocation, initialSelectionDone]);

	useEffect(() => {
		const fetchBranches = async () => {
			try {
				// Public endpoint - token is optional
				const token = await AsyncStorage.getItem('token');
				const response = await vitalFitApi.public.getBranchMap(token || '');
				const data = Array.isArray(response) ? response : response.data || [];

				// Filter branches with valid coordinates
				const validBranches = data.filter(
					(b: BranchInfo) =>
						typeof b.latitude === 'number' &&
						typeof b.longitude === 'number' &&
						!(b.latitude === 0 && b.longitude === 0)
				);

				setBranches(validBranches);
			} catch (err) {
				console.error('Error fetching branches:', err);
				if (isAPIError(err)) {
					setError(err.message || t('branchesMap.fetchError'));
				} else {
					setError(t('branchesMap.connectionError'));
				}
			} finally {
				setLoading(false);
			}
		};

		fetchBranches();
	}, [t]);

	const filteredBranches = useMemo(() => {
		return branches.filter(
			(b) =>
				b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				b.address.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [branches, searchTerm]);

	const totalPages = Math.ceil(filteredBranches.length / CARDS_PER_PAGE);

	const currentBranches = useMemo(() => {
		return filteredBranches.slice(
			currentPage * CARDS_PER_PAGE,
			currentPage * CARDS_PER_PAGE + CARDS_PER_PAGE
		);
	}, [filteredBranches, currentPage]);

	const handleSelectBranch = (branch: BranchInfo) => {
		setSelectedBranch(branch);
		// Fly to the selected branch
		webViewRef.current?.injectJavaScript(
			`window.flyToBranch(${branch.longitude}, ${branch.latitude}); true;`
		);
	};

	const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
		try {
			const message = JSON.parse(event.nativeEvent.data);
			if (message.type === 'markerClick') {
				const branch = branches.find((b) => b.branch_id === message.branchId);
				if (branch) {
					setSelectedBranch(branch);
				}
			}
		} catch (e) {
			console.error('Error parsing WebView message:', e);
		}
	};

	const handleSearchChange = (text: string) => {
		setSearchTerm(text);
		setCurrentPage(0);
	};

	if (loading) {
		return (
			<ThemedView className="flex-1 justify-center items-center bg-white dark:bg-neutral-950">
				<ActivityIndicator size="large" color="#F27F2A" />
				<ThemedText className="mt-4 text-gray-500">{t('branchesMap.loading')}</ThemedText>
			</ThemedView>
		);
	}

	if (error) {
		return (
			<ThemedView className="flex-1 justify-center items-center bg-white dark:bg-neutral-950 px-6">
				<MapPinIcon size={48} color="#9CA3AF" />
				<ThemedText className="mt-4 text-center text-gray-500">{error}</ThemedText>
				<TouchableOpacity
					onPress={() => router.back()}
					className="mt-6 bg-orange-500 px-6 py-3 rounded-xl"
				>
					<ThemedText className="text-white font-semibold">{t('branchesMap.goBack')}</ThemedText>
				</TouchableOpacity>
			</ThemedView>
		);
	}

	const mapHTML = generateMapHTML(filteredBranches, selectedBranch?.branch_id || null, userLocation);

	return (
		<SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
			{/* Search bar at top */}
			<View className="px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
				<View className="flex-row items-center">
					<TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
						<ArrowLeftIcon size={24} color="#374151" />
					</TouchableOpacity>
					<View className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex-row items-center px-4 py-3">
						<MagnifyingGlassIcon size={20} color="#9CA3AF" />
						<TextInput
							className="flex-1 ml-3 text-gray-900 dark:text-white"
							placeholder={t('branchesMap.searchPlaceholder')}
							placeholderTextColor="#9CA3AF"
							value={searchTerm}
							onChangeText={handleSearchChange}
						/>
					</View>
				</View>
			</View>

			{/* Map */}
			<View className="flex-1">
				<WebView
					ref={webViewRef}
					source={{ html: mapHTML }}
					style={{ flex: 1 }}
					onMessage={handleWebViewMessage}
					javaScriptEnabled
					domStorageEnabled
					originWhitelist={['*']}
				/>

				{/* Branch cards overlay */}
				<View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-3xl shadow-xl">
					<View className="w-12 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full self-center mt-3 mb-2" />

					{filteredBranches.length === 0 ? (
						<View className="p-6 items-center">
							<ThemedText className="text-gray-400 italic">
								{t('branchesMap.noBranchesFound')}
							</ThemedText>
						</View>
					) : (
						<>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
							>
								{currentBranches.map((branch) => (
									<TouchableOpacity
										key={branch.branch_id}
										onPress={() => handleSelectBranch(branch)}
										className={`w-64 p-4 rounded-2xl border-2 ${
											selectedBranch?.branch_id === branch.branch_id
												? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
												: 'border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800'
										}`}
									>
										<ThemedText className="font-bold text-gray-900 dark:text-white text-base">
											{branch.name}
										</ThemedText>
										<View className="flex-row items-start mt-2">
											<MapPinIcon size={16} color="#9CA3AF" />
											<ThemedText className="text-sm text-gray-500 dark:text-gray-400 ml-2 flex-1">
												{branch.address}
											</ThemedText>
										</View>
										{branch.phone && (
											<View className="flex-row items-center mt-2">
												<PhoneIcon size={16} color="#9CA3AF" />
												<ThemedText className="text-sm text-gray-500 dark:text-gray-400 ml-2">
													{branch.phone}
												</ThemedText>
											</View>
										)}
									</TouchableOpacity>
								))}
							</ScrollView>

							{/* Pagination */}
							{totalPages > 1 && (
								<View className="flex-row items-center justify-center pb-4 gap-4">
									<TouchableOpacity
										onPress={() => setCurrentPage((p) => Math.max(p - 1, 0))}
										disabled={currentPage === 0}
										className={`p-2 rounded-full ${currentPage === 0 ? 'opacity-30' : ''}`}
									>
										<ChevronLeftIcon size={24} color="#374151" />
									</TouchableOpacity>

									<View className="flex-row gap-2">
										{Array.from({ length: totalPages }).map((_, i) => (
											<View
												key={i}
												className={`h-2 rounded-full ${
													i === currentPage ? 'w-6 bg-orange-500' : 'w-2 bg-gray-300 dark:bg-neutral-600'
												}`}
											/>
										))}
									</View>

									<TouchableOpacity
										onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}
										disabled={currentPage >= totalPages - 1}
										className={`p-2 rounded-full ${currentPage >= totalPages - 1 ? 'opacity-30' : ''}`}
									>
										<ChevronRightIcon size={24} color="#374151" />
									</TouchableOpacity>
								</View>
							)}
						</>
					)}
				</View>
			</View>
		</SafeAreaView>
	);
}
