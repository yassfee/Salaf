import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
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

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PAD = 20;
const cardW = (SCREEN_W - CARD_PAD * 2 - CARD_GAP) / 2;

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
            <Ionicons name="notifications-outline" size={22} color="#121212" />
          </TouchableOpacity>

        </View>

        <Text style={styles.headline}>•••• •••• •••• 4242</Text>

        <TouchableOpacity style={styles.totalChip} activeOpacity={0.8}>
          <Ionicons name="eye-outline" size={13} color="#121212" />

          <Text style={styles.totalChipText}>Show Balance</Text>
        </TouchableOpacity>
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

        {/* Overview — 2×2 grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
        </View>
        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <View key={card.label} style={[styles.summaryCard, { width: cardW }]}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryLabel}>{card.label}</Text>
                <Ionicons name={card.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.summaryAmount, card.label === 'Overdue' && styles.redText]}>
                {formatCurrency(card.amount)}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
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
    paddingBottom: 28,
    backgroundColor: Colors.primary,
    borderRadius: 28,
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
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#121212' },
  greeting: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  subGreeting: { fontSize: 12, color: '#FFFFFF', opacity: 0.75 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 18,
  },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  totalChipText: { fontSize: 13, fontWeight: '600', color: '#121212' },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 24 },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_PAD,
    paddingBottom: 16,
    gap: CARD_GAP,
  },
  summaryCard: {
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
    borderRadius: 16,
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
