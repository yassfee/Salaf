import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getLends, getIncomingLends, LendResponse } from '../../services/api';
import { LendStatus } from '../../types';
import LendCard from '../../components/cards/LendCard';

type DirectionTab = 'Lent' | 'Borrowed';
type FilterChip = 'All' | 'Active' | 'Overdue' | 'Paid';
type SortOrder = 'due' | 'recent';

const filterChips: FilterChip[] = ['All', 'Active', 'Overdue', 'Paid'];

const statusMap: Record<FilterChip, LendStatus[]> = {
  All: ['PENDING', 'BORROW_REQUESTED', 'ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID', 'OVERDUE', 'PAID', 'REJECTED'],
  Active: ['ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID'],
  Overdue: ['OVERDUE'],
  Paid: ['PAID'],
};

export default function LendsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<DirectionTab>('Lent');
  const [lends, setLends] = useState<LendResponse[]>([]);
  const [incoming, setIncoming] = useState<LendResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lentData, borrowedData] = await Promise.all([getLends(), getIncomingLends()]);
      setLends(lentData);
      setIncoming(borrowedData);
    } catch {
      Alert.alert('Error', 'Failed to load lends.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = tab === 'Lent' ? lends : incoming;
  const filtered = list
    .filter((l) => statusMap[activeFilter].includes(l.status))
    .sort((a, b) =>
      sortOrder === 'due'
        ? new Date(a.due).getTime() - new Date(b.due).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Yellow header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Lends</Text>
          <Text style={styles.subtitle}>{filtered.length} records</Text>
          <View style={styles.tabRow}>
            {(['Lent', 'Borrowed'] as DirectionTab[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sortRow}>
            <Ionicons name="funnel-outline" size={13} color="rgba(255,255,255,0.7)" />
            <TouchableOpacity
              style={[styles.sortBtn, sortOrder === 'due' && styles.sortBtnActive]}
              onPress={() => setSortOrder('due')}
            >
              <Text style={[styles.sortText, sortOrder === 'due' && styles.sortTextActive]}>Earliest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortBtn, sortOrder === 'recent' && styles.sortBtnActive]}
              onPress={() => setSortOrder('recent')}
            >
              <Text style={[styles.sortText, sortOrder === 'recent' && styles.sortTextActive]}>Recent</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Gray rounded body */}
        <View style={styles.body}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
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
              <View style={styles.px}>
                {filtered.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>
                      {tab === 'Lent' ? 'No lends found.' : 'No borrowed records found.'}
                    </Text>
                  </View>
                ) : (
                  filtered.map((lend) => (
                    <LendCard
                      key={lend.id}
                      lend={lend}
                      onPress={() => {
                        if (tab === 'Lent') {
                          router.push(`/lend-details?id=${lend.id}`);
                        } else {
                          router.push(`/lend-details?id=${lend.id}&incoming=true`);
                        }
                      }}
                    />
                  ))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28,
    backgroundColor: Colors.primary,
  },
  body: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', flexGrow: 1, paddingBottom: 40,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#FFFFFF', opacity: 0.75, marginBottom: 18 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  tabBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
  tabTextActive: { color: Colors.primary },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  sortBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  sortText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
  sortTextActive: { color: Colors.primary },
  center: { paddingVertical: 60, alignItems: 'center' },
  px: { paddingHorizontal: 20, paddingBottom: 24 },
  chipsScroll: { flexShrink: 0, flexGrow: 0 },
  chipsRow: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
});
