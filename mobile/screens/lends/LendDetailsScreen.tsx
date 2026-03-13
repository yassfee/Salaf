import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getLendById, getIncomingLendById, recordRepayment, LendResponse } from '../../services/api';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import OutlinedButton from '../../components/ui/OutlinedButton';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatCurrency';
import { downloadReceipt } from '../../utils/pdfUtils';

export default function LendDetailsScreen() {
  const router = useRouter();
  const { id, incoming } = useLocalSearchParams<{ id: string; incoming?: string }>();
  const isBorrowerView = incoming === 'true';
  const [lend, setLend] = useState<LendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [repayLoading, setRepayLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 4000);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetch = isBorrowerView ? getIncomingLendById : getLendById;
    fetch(Number(id))
      .then(setLend)
      .catch(() => Alert.alert('Error', 'Failed to load lend details.'))
      .finally(() => setLoading(false));
  }, [id, isBorrowerView]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lend) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ color: Colors.textSecondary }}>Lend not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = lend.amount > 0 ? lend.paid / lend.amount : 0;
  const timelineEvents = [
    { label: isBorrowerView ? 'Borrow Received' : 'Lend Created', date: formatDate(lend.createdAt), color: Colors.primary },
    { label: 'Due Date', date: formatDate(lend.due), color: Colors.danger },
  ];

  const handleQuickDownload = async () => {
    setDownloadingPdf(true);
    try {
      await downloadReceipt(lend.id, { showSuccessAlert: true, allowShare: false });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isBorrowerView ? 'Borrow Details' : 'Lend Details'}</Text>
        <View style={styles.menuBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.px}>
          <CardContainer>
            <View style={styles.summaryTop}>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(lend.contact)}</Text>
                </View>
                <View>
                  <Text style={styles.contactName}>{lend.contact}</Text>
                  <Text style={styles.contactRole}>{isBorrowerView ? 'Lender' : 'Borrower'}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.rolePill, isBorrowerView ? styles.rolePillBorrow : styles.rolePillLend]}>
                  <Text style={[styles.rolePillText, isBorrowerView ? styles.rolePillTextBorrow : styles.rolePillTextLend]}>
                    {isBorrowerView ? 'You Borrowed' : 'You Lent'}
                  </Text>
                </View>
                <StatusBadge status={lend.status} />
              </View>
            </View>
            <Text style={styles.remainingAmount}>{formatCurrency(lend.remainingBalance)}</Text>
            <Text style={styles.remainingLabel}>{isBorrowerView ? 'You owe' : 'Remaining'}</Text>
            <View style={styles.progressWrapper}>
              <ProgressBar progress={progress} />
            </View>
            <Text style={styles.dueDate}>Due: {formatDate(lend.due)}</Text>
          </CardContainer>

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

          {/* Note */}
          {lend.note ? (
            <>
              <Text style={styles.sectionTitle}>Note</Text>
              <CardContainer style={styles.noteCard}>
                <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} style={styles.noteIcon} />
                <Text style={styles.noteText}>{lend.note}</Text>
              </CardContainer>
            </>
          ) : null}

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
          {lend.repayments.length === 0 ? (
            <Text style={styles.noRepayments}>No repayments yet.</Text>
          ) : (
            lend.repayments.map((rep) => (
              <CardContainer key={rep.id} style={styles.repayCard}>
                <View style={styles.repayRow}>
                  <View>
                    <Text style={styles.repayAmount}>{formatCurrency(rep.amountPaid)}</Text>
                    <Text style={styles.repayMeta}>{formatDate(rep.paidAt)}</Text>
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

      {errorVisible && !modalVisible && (
        <View style={styles.errorToast}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorToastText}>{errorMsg}</Text>
        </View>
      )}

      <View style={styles.bottomActions}>
        {isBorrowerView && lend.status !== 'PAID' && lend.status !== 'REJECTED' && lend.status !== 'PENDING' && (
          <PrimaryButton title="+ Record Repayment" onPress={() => setModalVisible(true)} />
        )}
        <View style={styles.spacer} />
        <OutlinedButton
          title={downloadingPdf ? "Downloading..." : "Quick Download"}
          onPress={handleQuickDownload}
          loading={downloadingPdf}
          disabled={downloadingPdf}
        />
        <View style={styles.spacer} />
        <OutlinedButton
          title="View Receipt"
          onPress={() => router.push(`/receipt?lendId=${lend.id}`)}
        />
      </View>

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
            <TextInput
              style={[styles.modalInput, styles.noteInput]}
              placeholder="Note (optional)"
              value={repayNote}
              onChangeText={setRepayNote}
              placeholderTextColor={Colors.textSecondary}
            />
            <PrimaryButton
              title={repayLoading ? 'Recording...' : 'Record'}
              onPress={async () => {
                const amount = parseFloat(repayAmount);
                if (!repayAmount || isNaN(amount) || amount <= 0) {
                  showError('Please enter a valid amount.');
                  return;
                }
                setRepayLoading(true);
                try {
                  await recordRepayment(lend.id, amount, repayNote || undefined);
                  setModalVisible(false);
                  setRepayAmount('');
                  setRepayNote('');
                  const fetch = isBorrowerView ? getIncomingLendById : getLendById;
                  const updated = await fetch(lend.id);
                  setLend(updated);
                } catch (e: any) {
                  showError(e?.response?.data?.message ?? 'Failed to record repayment.');
                } finally {
                  setRepayLoading(false);
                }
              }}
            />
            <View style={styles.spacer} />
            <OutlinedButton title="Cancel" onPress={() => { setModalVisible(false); setRepayAmount(''); setRepayNote(''); }} />

            {/* Error Toast inside modal so it appears above the overlay */}
            {errorVisible && (
              <View style={styles.modalErrorToast}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorToastText}>{errorMsg}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  menuBtn: { padding: 4 },
  scroll: { paddingBottom: 24 },
  px: { paddingHorizontal: 20 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#121212', fontWeight: '700', fontSize: 16 },
  contactName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  remainingAmount: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  remainingLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  progressWrapper: { marginBottom: 10 },
  dueDate: { fontSize: 12, color: Colors.textSecondary },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 12 },
  timelineCard: { padding: 16 },
  timelineItem: { flexDirection: 'row' },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4, minHeight: 24 },
  timelineContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20 },
  timelineLabel: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  timelineDate: { fontSize: 12, color: Colors.textSecondary },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteIcon: { marginTop: 1 },
  noteText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  contactRole: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillLend: { backgroundColor: Colors.primaryLight },
  rolePillBorrow: { backgroundColor: Colors.warningLight },
  rolePillText: { fontSize: 11, fontWeight: '700' },
  rolePillTextLend: { color: Colors.primaryDark },
  rolePillTextBorrow: { color: Colors.warning },
  noRepayments: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  repayCard: { marginBottom: 10 },
  repayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repayAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  repayMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  receiptBtn: { padding: 4 },
  bottomActions: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: Colors.background },
  spacer: { height: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 56, marginBottom: 16 },
  bdPrefix: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginRight: 8 },
  modalInput: { flex: 1, fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  noteInput: { fontSize: 14, fontWeight: '400', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 48, marginBottom: 16 },
  errorToast: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.danger },
  modalErrorToast: { marginTop: 16, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.danger },
  errorToastText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },
});
