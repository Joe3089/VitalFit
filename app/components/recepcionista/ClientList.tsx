import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { CalendarDaysIcon, UserIcon } from 'react-native-heroicons/outline';

export type Client = {
  id: string;
  name: string;
  level: string;
  time?: string;
};

type ClientListProps = {
  clients: Client[];
  totalCapacity?: number;
  onClientPress?: (client: Client) => void;
  onViewAllPress?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  title?: string;
  showViewAllButton?: boolean;
};

export default function ClientList({
  clients,
  totalCapacity = 100,
  onClientPress,
  onViewAllPress,
  showSearch = true,
  searchPlaceholder,
  title,
  showViewAllButton = true,
}: ClientListProps) {
  const { t } = useTranslation();
  
  const displayTitle = title || t('checkIn.clientList.title');
  const displaySearchPlaceholder = searchPlaceholder || t('checkIn.clientList.searchPlaceholder');

  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={styles.searchWrapper}>
          <TextInput
            placeholder={displaySearchPlaceholder}
            placeholderTextColor='#9CA3AF'
            style={styles.searchInput}
          />
        </View>
      )}

      <View style={styles.clientsHeader}>
        <View style={styles.clientsTitleRow}>
          <CalendarDaysIcon size={20} color='#6B7280' />
          <ThemedText style={styles.clientsTitle}>
            {displayTitle} ({clients.length}/{totalCapacity})
          </ThemedText>
        </View>
      </View>

      <View style={styles.clientsList}>
        {clients.map(client => (
          <TouchableOpacity 
            key={client.id} 
            style={styles.clientCard} 
            activeOpacity={0.8}
            onPress={() => onClientPress?.(client)}
          >
            <View style={styles.clientAvatar}>
              <UserIcon size={24} color='#F97316' />
            </View>
            <View style={styles.clientInfo}>
              <ThemedText style={styles.clientName}>{client.name}</ThemedText>
              <ThemedText style={styles.clientLevel}>{client.level}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {onViewAllPress && showViewAllButton && (
        <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.8} onPress={onViewAllPress}>
          <ThemedText style={styles.viewAllButtonText}>{t('common.viewAllRegistered')}</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  clientsHeader: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  clientsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientsTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  clientsList: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  clientLevel: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewAllButton: {
    marginHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F97316',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '500',
  },
});
