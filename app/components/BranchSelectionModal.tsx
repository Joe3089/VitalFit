import { ThemedText } from '@/components/themed-text';
import vitalFitApi from '@/services';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    TouchableOpacity,
    View,
} from 'react-native';

type BranchItem = {
    branch_id: string;
    name: string;
    address?: string;
    state?: string;
    country?: string;
};

type BranchSelectionModalProps = {
    visible: boolean;
    selectedBranchId: string;
    onSelect: (branchId: string, branchName: string) => void;
    onClose: () => void;
};

const ITEMS_PER_PAGE = 20;

export default function BranchSelectionModal({
    visible,
    selectedBranchId,
    onSelect,
    onClose,
}: BranchSelectionModalProps) {
    const [allBranches, setAllBranches] = useState<BranchItem[]>([]);
    const [visibleBranches, setVisibleBranches] = useState<BranchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [error, setError] = useState<string | null>(null);

    const loadBranches = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('token');
            const response = await vitalFitApi.public.getBranchMap(token || '');
            const data = (response as { data?: BranchItem[] }).data || [];

            setAllBranches(data);
            setVisibleBranches(data.slice(0, ITEMS_PER_PAGE));
            setVisibleCount(ITEMS_PER_PAGE);
        } catch (err) {
            console.error('Error loading branches:', err);
            setError('No se pudieron cargar las sucursales');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            // Reset state when modal opens
            setVisibleCount(ITEMS_PER_PAGE);
            loadBranches();
        }
    }, [visible, loadBranches]);

    const handleLoadMore = useCallback(() => {
        if (visibleCount < allBranches.length) {
            const newCount = Math.min(visibleCount + ITEMS_PER_PAGE, allBranches.length);
            setVisibleCount(newCount);
            setVisibleBranches(allBranches.slice(0, newCount));
        }
    }, [visibleCount, allBranches]);

    const isCloseToBottom = (nativeEvent: NativeScrollEvent) => {
        const paddingToBottom = 100;
        return (
            nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - paddingToBottom
        );
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(event.nativeEvent)) {
            handleLoadMore();
        }
    };

    const handleSelectBranch = (branchId: string, branchName: string) => {
        onSelect(branchId, branchName);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <Pressable className="flex-1" onPress={onClose} />
                <View className="bg-white rounded-t-3xl max-h-[70%]">
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-200">
                        <ThemedText className="font-heading text-xl font-bold text-neutral-900">
                            Seleccionar Sucursal
                        </ThemedText>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading && visibleBranches.length === 0 ? (
                        <View className="items-center justify-center py-12">
                            <ActivityIndicator size="large" color="#f97316" />
                            <ThemedText className="font-body text-sm text-neutral-500 mt-4">
                                Cargando sucursales...
                            </ThemedText>
                        </View>
                    ) : error ? (
                        <View className="items-center justify-center py-12 px-6">
                            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                            <ThemedText className="font-body text-sm text-red-500 mt-4 text-center">
                                {error}
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => loadBranches()}
                                className="mt-4 bg-orange-500 px-6 py-2 rounded-lg">
                                <ThemedText className="font-body text-sm font-semibold text-white">
                                    Reintentar
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={visibleBranches}
                            keyExtractor={(item) => item.branch_id}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            renderItem={({ item }) => {
                                const isSelected = item.branch_id === selectedBranchId;
                                return (
                                    <TouchableOpacity
                                        onPress={() => handleSelectBranch(item.branch_id, item.name)}
                                        className={`px-6 py-4 border-b border-neutral-100 ${
                                            isSelected ? 'bg-orange-50' : 'bg-white'
                                        }`}>
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-1 mr-4">
                                                <ThemedText
                                                    className={`font-body text-base ${
                                                        isSelected ? 'font-bold' : 'font-medium'
                                                    }`}
                                                    style={{
                                                        color: isSelected ? '#f97316' : '#111827',
                                                    }}>
                                                    {item.name}
                                                </ThemedText>
                                                {item.state && (
                                                    <ThemedText className="font-body text-sm text-neutral-500 mt-1">
                                                        {item.state}
                                                        {item.country ? `, ${item.country}` : ''}
                                                    </ThemedText>
                                                )}
                                            </View>
                                            {isSelected && (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={24}
                                                    color="#f97316"
                                                />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                !loading ? (
                                    <View className="items-center justify-center py-12">
                                        <Ionicons
                                            name="business-outline"
                                            size={48}
                                            color="#9ca3af"
                                        />
                                        <ThemedText className="font-body text-sm text-neutral-500 mt-4">
                                            No hay sucursales disponibles
                                        </ThemedText>
                                    </View>
                                ) : null
                            }
                            ListFooterComponent={
                                visibleCount < allBranches.length ? (
                                    <View className="py-4 items-center">
                                        <ActivityIndicator size="small" color="#f97316" />
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}
