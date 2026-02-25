import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_LENDS, MOCK_USER } from '../../constants/mockData';
import LendCard from '../../components/cards/LendCard';
import { formatCurrency, getGreeting, getInitials } from '../../utils/formatCurrency';

const summaryCards = [
  { label: 'Total Lent', icon: 'arrow-up-outline', amount: 375 },
  { label: 'Total Borrowed', icon: 'arrow-down-outline', amount: 0 },
  { label: 'Outstanding', icon: 'time-outline', amount: 300 },
  { label: 'Overdue', icon: 'alert-circle-outline', amount: 200 },
];

const dueSoonLends = MOCK_LENDS.filter(
  (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE'
);

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Amber Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(MOCK_USER.name)}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hi, {MOCK_USER.name.split(' ')[0]}!</Text>
              <Text style={styles.subGreeting}>{getGreeting()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headline}>Track your loans,{'\n'}stay in control.</Text>

        <View style={styles.totalChip}>
          <Ionicons name="arrow-up-outline" size={13} color={Colors.primary} />
          <Text style={styles.totalChipText}>{formatCurrency(375)} total lent</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Action Circles */}
        <View style={styles.quickRow}>
          {[
            { label: 'Notify',   icon: 'notifications-outline' },
            { label: 'Lend',     icon: 'arrow-up-outline'      },
            { label: 'Borrow',   icon: 'arrow-down-outline'    },
            { label: 'Suggest',  icon: 'sync-outline'          },
          ].map(({ label, icon }) => (
            <TouchableOpacity key={label} style={styles.quickItem} activeOpacity={0.8}>
              <View style={styles.quickCircle}>
                <Ionicons name={icon as any} size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          {summaryCards.map((card) => (
            <View key={card.label} style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryLabel}>{card.label}</Text>
                <Ionicons name={card.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.summaryAmount, card.label === 'Overdue' && styles.redText]}>
                {formatCurrency(card.amount)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Due Soon */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Due Soon</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{dueSoonLends.length}</Text>
            </View>
          </View>
          {dueSoonLends.map((lend) => (
            <LendCard
              key={lend.id}
              lend={lend}
              onPress={() => router.push(`/lend-details?id=${lend.id}`)}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: Colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  greeting: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  subGreeting: { fontSize: 12, color: Colors.textPrimary, opacity: 0.6 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: 18,
  },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  totalChipText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 24 },
  summaryRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  summaryCard: {
    width: 140,
    height: 90,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  redText: { color: Colors.danger },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.background,
  },
  quickItem: { alignItems: 'center', gap: 8 },
  quickCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
