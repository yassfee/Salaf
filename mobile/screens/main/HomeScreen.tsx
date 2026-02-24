import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_LENDS, MOCK_USER } from '../../constants/mockData';
import LendCard from '../../components/cards/LendCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import OutlinedButton from '../../components/ui/OutlinedButton';
import { formatCurrency, getGreeting } from '../../utils/formatCurrency';

const summaryCards = [
  { label: 'Total Lent', icon: 'arrow-up-outline', amount: 375, color: Colors.primary },
  { label: 'Total Borrowed', icon: 'arrow-down-outline', amount: 0, color: Colors.primary },
  { label: 'Outstanding', icon: 'time-outline', amount: 300, color: Colors.primary },
  { label: 'Overdue', icon: 'alert-circle-outline', amount: 200, color: Colors.primary },
];

const dueSoonLends = MOCK_LENDS.filter(
  (l) => l.status === 'ACTIVE' || l.status === 'OVERDUE'
);

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.greeting}>
          {getGreeting()}, {MOCK_USER.name.split(' ')[0]} 👋
        </Text>
        <TouchableOpacity style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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

        {/* Due Soon Section */}
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGap}>
            <PrimaryButton title="+ New Lend" onPress={() => router.push('/create-lend')} />
            <View style={styles.spacer} />
            <OutlinedButton
              title="Suggest Repayment"
              onPress={() => router.push('/suggest-repayment')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bellBtn: {
    padding: 4,
  },
  scroll: {
    paddingBottom: 24,
  },
  summaryRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
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
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  redText: {
    color: Colors.danger,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsGap: {
    gap: 0,
  },
  spacer: {
    height: 12,
  },
});
