import React, { useEffect, useRef } from 'react';
import { Dimensions, FlatList, Image, View, ViewToken } from 'react-native';

type Props = {
	images: number[];
	onIndexChange?: (i: number) => void;
	interval?: number;
};

const { width, height } = Dimensions.get('window');

export default function BackgroundCarousel({ images, onIndexChange, interval = 3000 }: Props) {
	const flatListRef = useRef<FlatList<number>>(null);
	const currentIndex = useRef(0);

	const viewabilityConfigCallbackPairs = useRef([
		{
			viewabilityConfig: { viewAreaCoveragePercentThreshold: 60 },
			onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
				const v = viewableItems.find((v) => v.isViewable);
				if (typeof v?.index === 'number') {
					currentIndex.current = v.index;
					onIndexChange?.(v.index);
				}
			},
		},
	]);

	const getItemLayout = (_: unknown, index: number) => ({
		length: width,
		offset: width * index,
		index,
	});

	useEffect(() => {
		const id = setInterval(() => {
			let nextIndex = currentIndex.current + 1;
			if (nextIndex >= images.length) nextIndex = 0;

			flatListRef.current?.scrollToIndex({
				index: nextIndex,
				animated: true,
			});
		}, interval);

		return () => clearInterval(id);
	}, [images, interval]);

	return (
		<FlatList
			ref={flatListRef}
			style={{ flex: 1 }}
			data={images}
			keyExtractor={(_, i) => String(i)}
			horizontal
			pagingEnabled
			bounces={false}
			showsHorizontalScrollIndicator={false}
			getItemLayout={getItemLayout}
			viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
			renderItem={({ item }) => (
				<View style={{ width, height, backgroundColor: '#000' }}>
					<Image
						source={item}
						style={{
							width,
							height: height * 1.1,
							position: 'absolute',
							top: '-5%',
						}}
						resizeMode='cover'
					/>
				</View>
			)}
		/>
	);
}
