import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getRepaymentPlan, RepaymentPlanItem, RepaymentStrategy } from '../../services/api';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { LendStatus } from '../../types';

const STRATEGIES: { key: RepaymentStrategy; label: string; icon: string; desc: string }[] = [
  { key: 'urgency',  label: 'Urgency',  icon: 'alert-circle-outline', desc: 'Overdue & soonest due first' },
  { key: 'snowball', label: 'Snowball', icon: 'snow-outline',          desc: 'Smallest balance first' },
  { key: 'avalanche',label: 'Avalanche',icon: 'trending-down-outline', desc: 'Largest balance first' },
];

const PRIORITY_COLOR: Record<string, string> = {
  OVERDUE:  Colors.danger,
  DUE_SOON: '#F59E0B',
  UPCOMING: Colors.primary,
  LATER:    Colors.textSecondary,
};

export default function SuggestRepaymentScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [strategy, setStrategy] = useState<RepaymentStrategy>('urgency');
  const [plan, setPlan] = useState<RepaymentPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const budget = parseFloat(amount) || 0;
  const totalAssigned = plan.reduce((s, x) => s + x.suggestedPayment, 0);
  const leftover = Math.max(0, budget - totalAssigned);
  const hasBudget = budget > 0;

  const handleSuggest = async () => {
    try {
      setLoading(true);
      const result = await getRepaymentPlan(hasBudget ? budget : undefined, strategy);
      setPlan(result);
      setGenerated(true);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Repayment Planner</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Strategy selector */}
        <Text style={styles.sectionLabel}>Strategy</Text>
        <View style={styles.strategyRow}>
          {STRATEGIES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.strategyCard, strategy === s.key && styles.strategyCardActive]}
              onPress={() => setStrategy(s.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={s.icon as any} size={20} color={strategy === s.key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.strategyLabel, strategy === s.key && styles.strategyLabelActive]}>{s.label}</Text>
              <Text style={[styles.strategyDesc, strategy === s.key && styles.strategyDescActive]}>{s.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget input (optional) */}
        <Text style={styles.sectionLabel}>Available Budget <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.amountRow}>
          <Text style={styles.bdLabel}>BD</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.000"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>
        <Text style={styles.hint}>
          {hasBudget
            ? 'Budget will be distributed across your lends by priority.'
            : 'No budget entered — showing full priority order.'}
        </Text>

        <PrimaryButton title={loading ? 'Generating...' : 'Generate Plan'} onPress={handleSuggest} disabled={loading} />
        {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}

        {/* Plan results */}
        {generated && !loading && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionLabel}>
              Your Repayment Plan
              {hasBudget ? ` for ${formatCurrency(budget)}` : ''}
            </Text>

            {plan.length === 0 ? (
              <CardContainer>
                <View style={styles.emptyWrap}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={Colors.success} />
                  <Text style={styles.emptyTitle}>All clear!</Text>
                  <Text style={styles.emptyText}>You have no active borrowed lends to pay back.</Text>
                </View>
              </CardContainer>
            ) : (
              plan.map((item) => {
                const progress = item.totalAmount > 0 ? item.amountPaid / item.totalAmount : 0;
                return (
                  <TouchableOpacity
                    key={item.lendId}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/lend-details?id=${item.lendId}&incoming=true`)}
                  >
                    <CardContainer style={styles.planCard}>
                      {/* Rank + header */}
                      <View style={styles.planHeader}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>{item.rank}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lenderName}>{item.lenderName}</Text>
                          <View style={styles.priorityRow}>
                            <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[item.priority] }]} />
                            <Text style={[styles.reasonText, { color: PRIORITY_COLOR[item.priority] }]}>{item.reason}</Text>
                          </View>
                        </View>
                        <StatusBadge status={item.status as LendStatus} />
                      </View>

                      {/* Amounts row */}
                      <View style={styles.amountsRow}>
                        <View style={styles.amountChip}>
                          <Text style={styles.amountChipLabel}>Total</Text>
                          <Text style={styles.amountChipValue}>{formatCurrency(item.totalAmount)}</Text>
                        </View>
                        <View style={styles.amountChip}>
                          <Text style={styles.amountChipLabel}>Paid</Text>
                          <Text style={[styles.amountChipValue, { color: Colors.success }]}>{formatCurrency(item.amountPaid)}</Text>
                        </View>
                        <View style={styles.amountChip}>
                          <Text style={styles.amountChipLabel}>Remaining</Text>
                          <Text style={[styles.amountChipValue, { color: Colors.danger }]}>{formatCurrency(item.remainingBalance)}</Text>
                        </View>
                      </View>

                      {/* Progress bar */}
                      <View style={styles.progressWrapper}>
                        <ProgressBar progress={progress} />
                      </View>

                      {/* Suggested payment */}
                      <View style={styles.suggestedRow}>
                        <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
                        <Text style={styles.suggestedLabel}>
                          {hasBudget ? 'Suggested payment: ' : 'Pay: '}
                          <Text style={styles.suggestedAmount}>{formatCurrency(item.suggestedPayment)}</Text>
                        </Text>
                        <Text style={styles.dueLabel}>Due {formatDate(item.dueDate)}</Text>
                      </View>
                    </CardContainer>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Budget summary */}
            {hasBudget && plan.length > 0 && (
              <CardContainer style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Assigned</Text>
                    <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatCurrency(totalAssigned)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Leftover</Text>
                    <Text style={[styles.summaryValue, { color: leftover > 0 ? Colors.warning : Colors.success }]}>
                      {formatCurrency(leftover)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Lends covered</Text>
                    <Text style={styles.summaryValue}>{plan.length}</Text>
                  </View>
                </View>
              </CardContainer>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  headerRight: { width: 32 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  optional: { fontWeight: '400', color: Colors.textSecondary },
  // Strategy
  strategyRow: { flexDirection: 'row', gap: 10 },
  strategyCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, padding: 10, alignItems: 'center', gap: 4, backgroundColor: Colors.card },
  strategyCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  strategyLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  strategyLabelActive: { color: '#fff' },
  strategyDesc: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center' },
  strategyDescActive: { color: 'rgba(255,255,255,0.8)' },
  // Budget input
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.primaryLight, marginBottom: 8 },
  bdLabel: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginRight: 8 },
  amountInput: { fontSize: 28, fontWeight: '700', color: Colors.primary, flex: 1 },
  hint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16, textAlign: 'center' },
  // Results
  resultsSection: { marginTop: 8 },
  planCard: { marginBottom: 12 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  rankBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  lenderName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  reasonText: { fontSize: 11, fontWeight: '500' },
  amountsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  amountChip: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 6, alignItems: 'center' },
  amountChipLabel: { fontSize: 9, color: Colors.textSecondary, marginBottom: 2 },
  amountChipValue: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  progressWrapper: { marginBottom: 10 },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryLight, borderRadius: 10, padding: 10 },
  suggestedLabel: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  suggestedAmount: { fontWeight: '700', color: Colors.primary },
  dueLabel: { fontSize: 11, color: Colors.textSecondary },
  // Summary
  summaryCard: { marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  warning: { color: '#F59E0B' },
});
