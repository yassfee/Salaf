import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_LENDS } from '../../constants/mockData';
import { Lend } from '../../types';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { formatCurrency } from '../../utils/formatCurrency';

interface Suggestion {
  lend: Lend;
  suggestedAmount: number;
  reason: string;
  rank: number;
}

function generateSuggestions(budget: number, lends: Lend[]): Suggestion[] {
  const active = lends
    .filter((l) => l.status !== 'PAID' && l.status !== 'REJECTED')
    .sort((a, b) => {
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      return new Date(a.due).getTime() - new Date(b.due).getTime();
    });

  const suggestions: Suggestion[] = [];
  let remaining = budget;

  active.forEach((lend, index) => {
    const owed = lend.amount - lend.paid;
    const pay = Math.min(owed, remaining);
    if (pay <= 0) return;

    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(lend.due).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysToDue = Math.floor(
      (new Date(lend.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let reason = '';
    if (lend.status === 'OVERDUE') {
      reason = `Overdue by ${Math.abs(daysOverdue)} day(s)`;
    } else if (daysToDue <= 7) {
      reason = `Due in ${daysToDue} day(s)`;
    } else {
      reason = `Due ${new Date(lend.due).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
    }

    suggestions.push({ lend, suggestedAmount: pay, reason, rank: index + 1 });
    remaining -= pay;
  });

  return suggestions;
}

export default function SuggestRepaymentScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const budget = parseFloat(amount) || 0;
  const totalAssigned = suggestions.reduce((s, x) => s + x.suggestedAmount, 0);
  const leftover = budget - totalAssigned;

  const handleSuggest = () => {
    if (budget <= 0) {
      Alert.alert('Invalid', 'Please enter an amount greater than 0.');
      return;
    }
    const result = generateSuggestions(budget, MOCK_LENDS);
    setSuggestions(result);
    setShowSuggestions(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Repayment Suggestion</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Amount Input */}
        <Text style={styles.label}>How much can you pay today?</Text>
        <View style={styles.amountRow}>
          <Text style={styles.bdLabel}>BD</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.000"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            textAlign="center"
          />
        </View>

        <PrimaryButton title="💡 Suggest Plan" onPress={handleSuggest} />

        {/* Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>Suggested Distribution</Text>
            {suggestions.length === 0 ? (
              <CardContainer>
                <Text style={styles.emptyText}>
                  No active lends to distribute this amount to.
                </Text>
              </CardContainer>
            ) : (
              suggestions.map((s) => {
                const progress = s.lend.amount > 0 ? s.lend.paid / s.lend.amount : 0;
                return (
                  <CardContainer key={s.lend.id} style={styles.suggCard}>
                    <View style={styles.suggHeader}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>{s.rank}</Text>
                      </View>
                      <View style={styles.suggInfo}>
                        <Text style={styles.suggContact}>{s.lend.contact}</Text>
                        <Text style={styles.suggReason}>{s.reason}</Text>
                      </View>
                      <StatusBadge status={s.lend.status} />
                    </View>
                    <Text style={styles.payAmount}>Pay {formatCurrency(s.suggestedAmount)}</Text>
                    <View style={styles.progressWrapper}>
                      <ProgressBar progress={progress} />
                    </View>
                  </CardContainer>
                );
              })
            )}

            {/* Summary */}
            <CardContainer style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Assigned</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    {formatCurrency(totalAssigned)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Left</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: leftover > 0 ? Colors.warning : Colors.success },
                    ]}
                  >
                    {formatCurrency(Math.max(0, leftover))}
                  </Text>
                </View>
              </View>
            </CardContainer>

            <View style={styles.spacer} />
            <PrimaryButton
              title="✅ Apply This Plan"
              onPress={() => {
                Alert.alert('Plan Applied', 'Your repayment plan has been applied!', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: { width: 32 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    backgroundColor: Colors.primaryLight,
  },
  bdLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 120,
  },
  suggestionsSection: { marginTop: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  suggCard: { marginBottom: 12 },
  suggHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  suggInfo: { flex: 1 },
  suggContact: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  suggReason: { fontSize: 12, color: Colors.textSecondary },
  payAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  progressWrapper: {},
  summaryCard: { marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
  spacer: { height: 16 },
});
