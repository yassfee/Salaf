import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_LENDS, MOCK_REPAYMENTS } from '../../constants/mockData';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import OutlinedButton from '../../components/ui/OutlinedButton';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatCurrency';

const timelineEvents = [
  { label: 'Lend Created', date: '15 Jan 2025', color: Colors.primary },
  { label: 'Acknowledged', date: '16 Jan 2025', color: Colors.success },
  { label: 'Repayment BD 50.000', date: '15 Feb 2025', color: Colors.warning },
  { label: 'Due Date', date: '03 Mar 2025', color: Colors.danger },
];

export default function LendDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');

  const lend = MOCK_LENDS.find((l) => l.id === Number(id)) ?? MOCK_LENDS[0];
  const repayments = MOCK_REPAYMENTS.filter((r) => r.lendId === lend.id);
  const progress = lend.amount > 0 ? lend.paid / lend.amount : 0;
  const remaining = lend.amount - lend.paid;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lend Details</Text>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Main Summary Card */}
        <View style={styles.px}>
          <CardContainer>
            <View style={styles.summaryTop}>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(lend.contact)}</Text>
                </View>
                <Text style={styles.contactName}>{lend.contact}</Text>
              </View>
              <StatusBadge status={lend.status} />
            </View>
            <Text style={styles.remainingAmount}>{formatCurrency(remaining)}</Text>
            <Text style={styles.remainingLabel}>Remaining</Text>
            <View style={styles.progressWrapper}>
              <ProgressBar progress={progress} />
            </View>
            <Text style={styles.dueDate}>Due: {formatDate(lend.due)}</Text>
          </CardContainer>

          {/* Stat Row */}
          <View style={styles.statRow}>
            <CardContainer style={styles.statCard}>
              <Text style={styles.statLabel}>Original Amount</Text>
              <Text style={styles.statValue}>{formatCurrency(lend.amount)}</Text>
            </CardContainer>
            <CardContainer style={styles.statCard}>
              <Text style={styles.statLabel}>Amount Paid</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {formatCurrency(lend.paid)}
              </Text>
            </CardContainer>
          </View>

          {/* Timeline */}
          <Text style={styles.sectionTitle}>Timeline</Text>
          <CardContainer style={styles.timelineCard}>
            {timelineEvents.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: event.color }]} />
                  {index < timelineEvents.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>{event.label}</Text>
                  <Text style={styles.timelineDate}>{event.date}</Text>
                </View>
              </View>
            ))}
          </CardContainer>

          {/* Repayments */}
          <Text style={styles.sectionTitle}>Repayments</Text>
          {repayments.length === 0 ? (
            <Text style={styles.noRepayments}>No repayments yet.</Text>
          ) : (
            repayments.map((rep) => (
              <CardContainer key={rep.id} style={styles.repayCard}>
                <View style={styles.repayRow}>
                  <View>
                    <Text style={styles.repayAmount}>{formatCurrency(rep.amount)}</Text>
                    <Text style={styles.repayMeta}>
                      {formatDate(rep.date)} · {rep.ref}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`/receipt?lendId=${lend.id}`)}
                    style={styles.receiptBtn}
                  >
                    <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </CardContainer>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <PrimaryButton title="+ Record Repayment" onPress={() => setModalVisible(true)} />
        <View style={styles.spacer} />
        <OutlinedButton
          title="🧾 Download Receipt"
          onPress={() => router.push(`/receipt?lendId=${lend.id}`)}
        />
      </View>

      {/* Record Repayment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Record Repayment</Text>
            <View style={styles.inputRow}>
              <Text style={styles.bdPrefix}>BD</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                placeholder="0.000"
                value={repayAmount}
                onChangeText={setRepayAmount}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <PrimaryButton
              title="Record"
              onPress={() => {
                setModalVisible(false);
                setRepayAmount('');
                Alert.alert('Recorded', 'Repayment has been recorded.');
              }}
            />
            <View style={styles.spacer} />
            <OutlinedButton title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
  menuBtn: { padding: 4 },
  scroll: { paddingBottom: 24 },
  px: { paddingHorizontal: 20 },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  contactName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  remainingAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  remainingLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  progressWrapper: { marginBottom: 10 },
  dueDate: { fontSize: 12, color: Colors.textSecondary },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  timelineCard: { padding: 16 },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  timelineLabel: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  timelineDate: { fontSize: 12, color: Colors.textSecondary },
  noRepayments: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  repayCard: { marginBottom: 10 },
  repayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repayAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  repayMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  receiptBtn: { padding: 4 },
  bottomActions: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.background },
  spacer: { height: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  bdPrefix: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginRight: 8 },
  modalInput: { flex: 1, fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
});
