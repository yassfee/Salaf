import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  getRepaymentPlan, RepaymentPlanItem, RepaymentStrategy,
  getMyRepayments, MyRepaymentItem, deleteRepayment,
  getWallet, WalletResponse,
} from '../../services/api';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { LendStatus } from '../../types';

const STRATEGIES: { key: RepaymentStrategy; label: string; icon: string; desc: string }[] = [
  { key: 'urgency',   label: 'Urgency',   icon: 'alert-circle-outline', desc: 'Overdue & soonest due first' },
  { key: 'snowball',  label: 'Snowball',  icon: 'snow-outline',          desc: 'Smallest balance first' },
  { key: 'avalanche', label: 'Avalanche', icon: 'trending-down-outline', desc: 'Largest balance first' },
];

const PRIORITY_COLOR: Record<string, string> = {
  OVERDUE:  Colors.danger,
  DUE_SOON: '#F59E0B',
  UPCOMING: Colors.primary,
  LATER:    Colors.textSecondary,
};

const PLANS_KEY = 'repayment_plans';

interface SavedPlan {
  id: string;
  savedAt: string;
  strategy: RepaymentStrategy;
  budget: number;
  items: RepaymentPlanItem[];
}

type Tab = 'plan' | 'plans' | 'history';

export default function SuggestRepaymentScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('plan');
  const [strategy, setStrategy] = useState<RepaymentStrategy>('urgency');
  const [plan, setPlan] = useState<RepaymentPlanItem[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [history, setHistory] = useState<MyRepaymentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const budget = Number(wallet?.balance ?? 0);
  const totalAssigned = plan.reduce((s, x) => s + x.suggestedPayment, 0);
  const leftover = Math.max(0, budget - totalAssigned);

  useEffect(() => {
    getWallet().then(setWallet).catch(() => {});
  }, []);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    getMyRepayments()
      .then(setHistory)
      .catch(() => Alert.alert('Error', 'Failed to load repayment history.'))
      .finally(() => setHistoryLoading(false));
  }, []);

  const loadSavedPlans = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(PLANS_KEY);
      setSavedPlans(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }, []);

  useFocusEffect(useCallback(() => {
    if (tab === 'history') loadHistory();
    if (tab === 'plans') loadSavedPlans();
  }, [tab, loadHistory, loadSavedPlans]));

  useEffect(() => {
    if (tab === 'history') loadHistory();
    if (tab === 'plans') loadSavedPlans();
  }, [tab]);

  const handleSuggest = async () => {
    try {
      setPlanLoading(true);
      const result = await getRepaymentPlan(budget > 0 ? budget : undefined, strategy);
      setPlan(result);
      setGenerated(true);
      // Auto-save to plans
      if (result.length > 0) {
        const newPlan: SavedPlan = {
          id: Date.now().toString(),
          savedAt: new Date().toISOString(),
          strategy,
          budget,
          items: result,
        };
        const raw = await AsyncStorage.getItem(PLANS_KEY);
        const existing: SavedPlan[] = raw ? JSON.parse(raw) : [];
        const updated = [newPlan, ...existing].slice(0, 20); // keep last 20
        await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(updated));
        setSavedPlans(updated);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to generate plan.');
    } finally {
      setPlanLoading(false);
    }
  };

  const deleteSavedPlan = async (id: string) => {
    const updated = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(updated);
    await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(updated));
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'plan',    label: 'Plan' },
    { key: 'plans',   label: 'Saved Plans' },
    { key: 'history', label: 'History' },
  ];

  const renderPlanItems = (items: RepaymentPlanItem[], planBudget: number) =>
    items.map((item) => {
      const progress = item.totalAmount > 0 ? item.amountPaid / item.totalAmount : 0;
      return (
        <TouchableOpacity
          key={item.lendId}
          activeOpacity={0.85}
          onPress={() => router.push(`/lend-details?id=${item.lendId}&incoming=true`)}
        >
          <CardContainer style={styles.planCard}>
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
            <View style={styles.progressWrapper}>
              <ProgressBar progress={progress} />
            </View>
            <View style={styles.suggestedRow}>
              <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
              <Text style={styles.suggestedLabel}>
                {planBudget > 0 ? 'Suggested payment: ' : 'Pay: '}
                <Text style={styles.suggestedAmount}>{formatCurrency(item.suggestedPayment)}</Text>
              </Text>
              <Text style={styles.dueLabel}>Due {formatDate(item.dueDate)}</Text>
            </View>
          </CardContainer>
        </TouchableOpacity>
      );
    });

  return (
    <SafeAreaView style={styles.container}>
      {/* Yellow header — title + tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Repayment Planner</Text>
        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Gray rounded body */}
      <View style={styles.body}>

      {/* ── Plan Tab ── */}
      {tab === 'plan' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.budgetCard}>
            <View style={styles.budgetLeft}>
              <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
              <Text style={styles.budgetLabel}>Available Balance</Text>
            </View>
            <Text style={styles.budgetAmount}>{formatCurrency(budget)}</Text>
          </View>
          {budget === 0 && (
            <Text style={styles.hint}>No wallet balance set — showing full priority order.</Text>
          )}

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

          <View style={{ height: 20 }} />
          <PrimaryButton title={planLoading ? 'Generating...' : 'Generate Plan'} onPress={handleSuggest} disabled={planLoading} />
          {planLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}

          {generated && !planLoading && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionLabel}>
                Your Repayment Plan{budget > 0 ? ` for ${formatCurrency(budget)}` : ''}
              </Text>
              {plan.length === 0 ? (
                <CardContainer>
                  <View style={styles.emptyWrap}>
                    <Ionicons name="checkmark-circle-outline" size={40} color={Colors.success} />
                    <Text style={styles.emptyTitle}>All clear!</Text>
                    <Text style={styles.emptyText}>You have no active borrowed lends to pay back.</Text>
                  </View>
                </CardContainer>
              ) : renderPlanItems(plan, budget)}

              {budget > 0 && plan.length > 0 && (
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
      )}

      {/* ── Saved Plans Tab ── */}
      {tab === 'plans' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {savedPlans.length === 0 ? (
            <CardContainer>
              <View style={styles.emptyWrap}>
                <Ionicons name="document-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No saved plans</Text>
                <Text style={styles.emptyText}>Generate a plan and it will be saved here automatically.</Text>
              </View>
            </CardContainer>
          ) : (
            savedPlans.map((p) => {
              const isExpanded = expandedPlanId === p.id;
              const strategyInfo = STRATEGIES.find((s) => s.key === p.strategy);
              const totalSuggested = p.items.reduce((s, x) => s + x.suggestedPayment, 0);
              return (
                <CardContainer key={p.id} style={styles.savedPlanCard}>
                  {/* Header row */}
                  <TouchableOpacity
                    style={styles.savedPlanHeader}
                    activeOpacity={0.8}
                    onPress={() => setExpandedPlanId(isExpanded ? null : p.id)}
                  >
                    <View style={styles.savedPlanLeft}>
                      <View style={styles.savedPlanIconWrap}>
                        <Ionicons name={strategyInfo?.icon as any} size={18} color={Colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.savedPlanStrategy}>{strategyInfo?.label} Strategy</Text>
                        <Text style={styles.savedPlanDate}>{formatDate(p.savedAt)} · {p.items.length} lend{p.items.length !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {p.budget > 0 && (
                        <Text style={styles.savedPlanBudget}>{formatCurrency(p.budget)}</Text>
                      )}
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
                    </View>
                  </TouchableOpacity>

                  {/* Summary chips */}
                  <View style={styles.savedPlanChips}>
                    <View style={styles.savedPlanChip}>
                      <Text style={styles.savedPlanChipLabel}>Suggested</Text>
                      <Text style={[styles.savedPlanChipValue, { color: Colors.primary }]}>{formatCurrency(totalSuggested)}</Text>
                    </View>
                    {p.budget > 0 && (
                      <View style={styles.savedPlanChip}>
                        <Text style={styles.savedPlanChipLabel}>Leftover</Text>
                        <Text style={[styles.savedPlanChipValue, { color: Colors.warning }]}>{formatCurrency(Math.max(0, p.budget - totalSuggested))}</Text>
                      </View>
                    )}
                    <View style={styles.savedPlanChip}>
                      <Text style={styles.savedPlanChipLabel}>Lends</Text>
                      <Text style={styles.savedPlanChipValue}>{p.items.length}</Text>
                    </View>
                  </View>

                  {/* Expanded items */}
                  {isExpanded && (
                    <View style={{ marginTop: 8 }}>
                      {renderPlanItems(p.items, p.budget)}
                    </View>
                  )}

                  {/* Delete */}
                  <View style={styles.historyDivider} />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                      Alert.alert('Delete Plan', 'Remove this saved plan?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteSavedPlan(p.id) },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </CardContainer>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {historyLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
          ) : history.length === 0 ? (
            <CardContainer>
              <View style={styles.emptyWrap}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No repayments yet</Text>
                <Text style={styles.emptyText}>Your repayment history will appear here.</Text>
              </View>
            </CardContainer>
          ) : (
            <>
              <View style={styles.budgetCard}>
                <View style={styles.budgetLeft}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
                  <Text style={styles.budgetLabel}>Total Repaid</Text>
                </View>
                <Text style={[styles.budgetAmount, { color: Colors.success }]}>
                  {formatCurrency(history.reduce((s, r) => s + r.amountPaid, 0))}
                </Text>
              </View>
              <Text style={styles.sectionLabel}>{history.length} repayment{history.length !== 1 ? 's' : ''}</Text>
              {history.map((r) => (
                <CardContainer key={r.id} style={styles.historyCard}>
                  <TouchableOpacity
                    style={styles.historyRow}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/lend-details?id=${r.lendId}&incoming=true`)}
                  >
                    <View style={styles.historyIcon}>
                      <Ionicons name="arrow-up-circle" size={22} color={Colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyLender}>{r.lenderName}</Text>
                      {r.note ? <Text style={styles.historyNote}>"{r.note}"</Text> : null}
                      <Text style={styles.historyDate}>{formatDate(r.paidAt)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.historyAmount}>{formatCurrency(r.amountPaid)}</Text>
                      <Text style={styles.historyTotal}>of {formatCurrency(r.totalAmount)}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.historyDivider} />
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                      Alert.alert(
                        'Delete Repayment',
                        `Remove the ${formatCurrency(r.amountPaid)} repayment to ${r.lenderName}? This will restore the balance.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteRepayment(r.id);
                                setHistory((prev) => prev.filter((x) => x.id !== r.id));
                              } catch (e: any) {
                                Alert.alert('Error', e?.response?.data?.message ?? 'Failed to delete repayment.');
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </CardContainer>
              ))}
            </>
          )}
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 16, textAlign: 'left' },
  body: {
    flex: 1, backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
  },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tabTextActive: { color: Colors.primary },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  budgetCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 16, marginTop: 16 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetLabel: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  budgetAmount: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  strategyRow: { flexDirection: 'row', gap: 10 },
  strategyCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, padding: 10, alignItems: 'center', gap: 4, backgroundColor: Colors.card },
  strategyCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  strategyLabel: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  strategyLabelActive: { color: '#fff' },
  strategyDesc: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center' },
  strategyDescActive: { color: 'rgba(255,255,255,0.8)' },
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
  summaryCard: { marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  emptyWrap: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  // Saved plans
  savedPlanCard: { marginBottom: 12 },
  savedPlanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  savedPlanLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  savedPlanIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  savedPlanStrategy: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  savedPlanDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  savedPlanBudget: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  savedPlanChips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  savedPlanChip: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 8, alignItems: 'center' },
  savedPlanChipLabel: { fontSize: 9, color: Colors.textSecondary, marginBottom: 2 },
  savedPlanChipValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  // History
  historyCard: { marginBottom: 10 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  historyLender: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  historyNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  historyDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '700', color: Colors.success },
  historyTotal: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  historyDivider: { height: 1, backgroundColor: Colors.border, marginTop: 10, marginBottom: 6 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', paddingVertical: 2 },
  deleteBtnText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
});
