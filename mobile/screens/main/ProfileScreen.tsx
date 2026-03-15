import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getCurrentUser, getDashboardSummary, getLends, getIncomingLends, logoutApi, DashboardSummary, LendResponse } from '../../services/api';
import BadgeCard, { ComputedBadge } from '../../components/cards/BadgeCard';
import { getInitials, formatCurrency, formatDate } from '../../utils/formatCurrency';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_H_PAD = 20;
const cardW = (width - CARD_H_PAD * 2 - CARD_GAP) / 2;

function computeBadges(
  lends: LendResponse[],
  incoming: LendResponse[],
  summary: DashboardSummary,
): ComputedBadge[] {
  const completedLends = lends.filter((l) => l.status === 'PAID').length;
  const hasActivity = lends.length > 0 || incoming.length > 0;

  const outstandingBorrowed = incoming
    .filter((l) => l.status === 'ACCEPTED' || l.status === 'PARTIALLY_PAID')
    .reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalBorrowedAmount = incoming.reduce((sum, l) => sum + l.amount, 0);

  return [
    {
      name: 'On-Time Hero',
      icon: 'trophy-outline',
      desc: 'No overdue lends or borrowings',
      earned: hasActivity && summary.overdue === 0,
      progressText:
        summary.overdue > 0
          ? `${summary.overdue} overdue — resolve them to earn this`
          : !hasActivity
          ? 'Start lending or borrowing to earn this'
          : undefined,
      progressValue: summary.overdue > 0 ? 0 : hasActivity ? 1 : 0,
    },
    {
      name: 'Trusted Lender',
      icon: 'ribbon-outline',
      desc: '10 completed lends',
      earned: completedLends >= 10,
      earnedAt: completedLends >= 10 ? formatDate(lends.filter((l) => l.status === 'PAID').sort((a, b) => b.id - a.id)[9]?.createdAt ?? '') : undefined,
      progressText: `${completedLends}/10 completed lends`,
      progressValue: Math.min(completedLends / 10, 1),
    },
    {
      name: 'Debt Free',
      icon: 'lock-closed-outline',
      desc: 'No outstanding borrowed amounts',
      earned: incoming.length > 0 && outstandingBorrowed === 0,
      progressText:
        outstandingBorrowed > 0
          ? `BD ${outstandingBorrowed.toFixed(3)} remaining to pay off`
          : incoming.length === 0
          ? 'No borrowing history yet'
          : undefined,
      progressValue:
        totalBorrowedAmount > 0
          ? Math.max(0, 1 - outstandingBorrowed / totalBorrowedAmount)
          : incoming.length > 0
          ? 1
          : 0,
    },
  ];
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [badges, setBadges] = useState<ComputedBadge[]>([]);

  const load = useCallback(async () => {
    const [user, sum, lends, incoming] = await Promise.all([
      getCurrentUser().catch(() => null),
      getDashboardSummary().catch(() => null),
      getLends().catch(() => [] as LendResponse[]),
      getIncomingLends().catch(() => [] as LendResponse[]),
    ]);
    if (user) { setUserName(user.name); setUserEmail(user.email); }
    if (sum) {
      setSummary(sum);
      setBadges(computeBadges(lends as LendResponse[], incoming as LendResponse[], sum));
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const statCards = [
    { label: 'Total Lent',     value: formatCurrency(summary?.totalLent ?? 0),     icon: 'arrow-up-outline'    },
    { label: 'Total Borrowed', value: formatCurrency(summary?.totalBorrowed ?? 0), icon: 'arrow-down-outline'  },
    { label: 'Outstanding',    value: formatCurrency(summary?.outstanding ?? 0),    icon: 'time-outline'        },
    { label: 'Overdue',        value: formatCurrency(summary?.overdue ?? 0),        icon: 'alert-circle-outline'},
  ];

  const handleLogout = async () => {
    await logoutApi();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={20} color="#121212" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#121212" />
            </TouchableOpacity>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName ? getInitials(userName) : '?'}</Text>
          </View>
          <Text style={styles.name}>{userName || 'Loading...'}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.statSectionTitle}>Quick Stats</Text>
          <View style={styles.statGrid}>
            {statCards.map((card) => (
              <View key={card.label} style={styles.statCard}>
                <View style={styles.statRow}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name={card.icon as any} size={22} color={Colors.textPrimary} />
                  </View>
                  <View style={styles.statTextWrap}>
                    <Text style={styles.statLabel}>{card.label}</Text>
                    <Text style={styles.statValue}>{card.value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            {badges.map((badge) => (
              <BadgeCard key={badge.name} badge={badge} />
            ))}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: {
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  body: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', flexGrow: 1, paddingBottom: 40,
  },
  statSectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: CARD_H_PAD, paddingTop: 20, paddingBottom: 4,
  },
  avatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#121212' },
  name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  email: { fontSize: 13, color: '#FFFFFF', opacity: 0.75 },
  scroll: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CARD_H_PAD, gap: CARD_GAP, paddingTop: 20, paddingBottom: 12 },
  statCard: { width: cardW, backgroundColor: Colors.card, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  statTextWrap: { flex: 1 },
  statLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 12, color: Colors.textSecondary, fontWeight: '400' },
  section: { paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
});
