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
  const [tab, setTab] = useState<DirectionTab>('Lent');
  const [lends, setLends] = useState<LendResponse[]>([]);
  const [incoming, setIncoming] = useState<LendResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
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
  const filtered = list.filter((l) => statusMap[activeFilter].includes(l.status));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Lends</Text>
            <Text style={styles.subtitle}>
              {tab === 'Lent' ? lends.length : incoming.length} records
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={20} color="#121212" />
          </TouchableOpacity>
        </View>

        {/* Direction Tabs */}
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
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        )}

        {tab === 'Lent' && (
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-lend')}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    marginHorizontal: 16, marginTop: 8, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 16, backgroundColor: Colors.primary, borderRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#FFFFFF', opacity: 0.75, marginTop: 2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center',
  },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tabTextActive: { color: Colors.primary },
  content: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  px: { paddingHorizontal: 20 },
  chipsRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});
