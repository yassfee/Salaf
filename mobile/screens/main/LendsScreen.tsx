import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_LENDS } from '../../constants/mockData';
import { LendStatus } from '../../types';
import LendCard from '../../components/cards/LendCard';

type DirectionTab = 'owed' | 'iowe';
type FilterChip = 'All' | 'Pending' | 'Active' | 'Overdue' | 'Paid';

const filterChips: FilterChip[] = ['All', 'Pending', 'Active', 'Overdue', 'Paid'];

const statusMap: Record<FilterChip, LendStatus[]> = {
  All: ['PENDING', 'ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID', 'PAID', 'REJECTED', 'OVERDUE'],
  Pending: ['PENDING', 'ACCEPTED'],
  Active: ['ACTIVE', 'PARTIALLY_PAID'],
  Overdue: ['OVERDUE'],
  Paid: ['PAID'],
};

export default function LendsScreen() {
  const router = useRouter();
  const [direction, setDirection] = useState<DirectionTab>('owed');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');

  const filtered = MOCK_LENDS.filter((l) => statusMap[activeFilter].includes(l.status));

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Amber Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Lends</Text>
            <Text style={styles.subtitle}>{MOCK_LENDS.length} total records</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={20} color="#121212" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Direction Toggle */}
          <View style={styles.px}>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, direction === 'owed' && styles.toggleBtnActive]}
                onPress={() => setDirection('owed')}
              >
                <Text style={[styles.toggleText, direction === 'owed' && styles.toggleTextActive]}>
                  Owed to Me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, direction === 'iowe' && styles.toggleBtnActive]}
                onPress={() => setDirection('iowe')}
              >
                <Text style={[styles.toggleText, direction === 'iowe' && styles.toggleTextActive]}>
                  I Owe
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {filterChips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, activeFilter === chip && styles.chipActive]}
                onPress={() => setActiveFilter(chip)}
              >
                <Text style={[styles.chipText, activeFilter === chip && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lend List */}
          <View style={styles.px}>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No lends found.</Text>
              </View>
            ) : (
              filtered.map((lend) => (
                <LendCard
                  key={lend.id}
                  lend={lend}
                  onPress={() => router.push(`/lend-details?id=${lend.id}`)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-lend')}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: Colors.primary,
    borderRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#FFFFFF', opacity: 0.75, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, backgroundColor: Colors.background },
  px: { paddingHorizontal: 20 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },
  chipsRow: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
