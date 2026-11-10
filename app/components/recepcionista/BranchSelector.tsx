import { ThemedText } from '@/components/themed-text';
import { useBranch } from '@/contexts/BranchContext';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, TouchableOpacity, View } from 'react-native';
import { BuildingStorefrontIcon, CheckIcon, ChevronDownIcon, XMarkIcon } from 'react-native-heroicons/outline';

const ITEMS_PER_PAGE = 5;

export function BranchSelector() {
  const { t } = useTranslation();
  const { branches, selectedBranch, selectBranch, isLoading } = useBranch();
  const [modalVisible, setModalVisible] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      setDisplayedCount(ITEMS_PER_PAGE);
    }
  }, [modalVisible]);

  const handleSelect = async (branchId: string) => {
    await selectBranch(branchId);
    setModalVisible(false);
  };

  const handleLoadMore = () => {
    if (displayedCount >= branches.length || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, branches.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const displayedBranches = branches.slice(0, displayedCount);

  if (isLoading && branches.length === 0) {
    return (
      <View className="flex-row items-center px-4 py-2 bg-neutral-100 rounded-full">
        <ActivityIndicator size="small" color="#F27F2A" />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center bg-white border border-neutral-200 rounded-full px-3 py-1.5 shadow-sm"
        style={{ elevation: 2, width: 300 }}
      >
        <BuildingStorefrontIcon size={16} color="#F27F2A" />
        <ThemedText className="mx-2 text-sm font-semibold text-neutral-800 flex-1" numberOfLines={1}>
          {selectedBranch ? selectedBranch.name : t('common.selectBranch')}
        </ThemedText>
        <ChevronDownIcon size={14} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView intensity={80} className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="w-11/12 max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden" style={{ maxHeight: '70%' }}>
            <View className="flex-row justify-between items-center pb-3 pt-4 px-4 border-b border-neutral-100">
              <ThemedText className="text-lg font-bold text-neutral-900">
                {t('common.selectYourBranch')}
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1 bg-neutral-100 rounded-full">
                <XMarkIcon size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={displayedBranches}
              keyExtractor={(item) => item.branch_id}
              contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 16, paddingTop: 16 }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore && displayedCount < branches.length ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#F27F2A" />
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const isSelected = selectedBranch?.branch_id === item.branch_id;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.branch_id)}
                    className={`flex-row items-center justify-between p-3 mb-2 rounded-xl border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-white border-neutral-100'
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                        isSelected ? 'bg-orange-100' : 'bg-neutral-100'
                      }`}>
                         <BuildingStorefrontIcon size={16} color={isSelected ? '#F27F2A' : '#6B7280'} />
                      </View>
                      <View className="flex-1">
                         <ThemedText className={`font-semibold ${isSelected ? 'text-orange-700' : 'text-neutral-800'}`}>
                           {item.name}
                         </ThemedText>
                         {item.address && (
                           <ThemedText className="text-xs text-neutral-500" numberOfLines={1}>
                             {item.address}
                           </ThemedText>
                         )}
                      </View>
                    </View>
                    {isSelected && <CheckIcon size={20} color="#F27F2A" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </BlurView>
      </Modal>
    </>
  );
}
