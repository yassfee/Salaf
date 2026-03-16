import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  getIncomingLends, acceptLend, rejectLend,
  getBorrowRequests, approveBorrowRequest, declineBorrowRequest,
  LendResponse,
} from '../../services/api';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatCurrency';
import { useFocusEffect } from 'expo-router';

type TabType = 'incoming' | 'borrow-requests';

export default function RequestsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [incomingLends, setIncomingLends] = useState<LendResponse[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<LendResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState<Record<number, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 4000);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [incoming, brRequests] = await Promise.all([
        getIncomingLends(),
        getBorrowRequests(),
      ]);
      setIncomingLends(incoming);
      setBorrowRequests(brRequests);
    } catch {
      Alert.alert('Error', 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Incoming (borrower perspective) ─────────────────────────────────────────
  const pendingOffers = incomingLends.filter((l) => l.status === 'PENDING');
  const sentRequests = incomingLends.filter((l) => l.status === 'BORROW_REQUESTED');
  const handledIncoming = incomingLends.filter(
    (l) => l.status === 'ACCEPTED' || l.status === 'REJECTED',
  );

  const toggleAgreed = (id: number) => {
    setAgreed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAccept = async (id: number) => {
    if (!agreed[id]) {
      showError('Please check the agreement box before accepting.');
      return;
    }
    try {
      const updated = await acceptLend(id);
      setIncomingLends((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to accept lend.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const updated = await rejectLend(id);
      setIncomingLends((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to reject lend.');
    }
  };

  // ── Borrow requests (lender perspective) ────────────────────────────────────
  const handleApprove = async (id: number) => {
    try {
      const updated = await approveBorrowRequest(id);
      setBorrowRequests((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to approve request.');
    }
  };

  const handleDecline = async (id: number) => {
    try {
      const updated = await declineBorrowRequest(id);
      setBorrowRequests((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to decline request.');
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderIncomingCard = (req: LendResponse) => (
    <CardContainer key={req.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(req.lenderName)}</Text>
          </View>
          <View>
            <Text style={styles.contactName}>From: {req.lenderName}</Text>
            <Text style={styles.requestAmount}>{formatCurrency(req.amount)}</Text>
          </View>
        </View>
        <StatusBadge status={req.status} />
      </View>

      <Text style={styles.dueDate}>Due: {formatDate(req.due)}</Text>
      {req.note && <Text style={styles.note}>{req.note}</Text>}

      {req.status === 'PENDING' && (
        <>
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => toggleAgreed(req.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed[req.id] && styles.checkboxChecked]}>
              {agreed[req.id] && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>
              I agree to borrow this money and will return it by {formatDate(req.due)}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.acceptBtn, !agreed[req.id] && styles.acceptBtnDisabled]}
              onPress={() => handleAccept(req.id)}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(req.id)}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </CardContainer>
  );

  const renderBorrowRequestCard = (req: LendResponse) => (
    <CardContainer key={req.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(req.contact)}</Text>
          </View>
          <View>
            <Text style={styles.contactName}>{req.contact} wants to borrow</Text>
            <Text style={styles.requestAmount}>{formatCurrency(req.amount)}</Text>
          </View>
        </View>
        <StatusBadge status={req.status} />
      </View>

      <Text style={styles.dueDate}>Due: {formatDate(req.due)}</Text>
      {req.note && <Text style={styles.note}>{req.note}</Text>}

      {req.status === 'BORROW_REQUESTED' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleApprove(req.id)}>
            <Text style={styles.acceptText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleDecline(req.id)}>
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </CardContainer>
  );

  const pendingCount = pendingOffers.length +
    borrowRequests.filter((l) => l.status === 'BORROW_REQUESTED').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header — scrolls with content */}
        <View style={styles.header}>
          <Text style={styles.title}>Requests</Text>
          <Text style={styles.subtitle}>
            {pendingCount > 0 ? `${pendingCount} awaiting your response` : 'No pending requests'}
          </Text>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'incoming' && styles.tabActive]}
              onPress={() => setActiveTab('incoming')}
            >
              <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>
                Incoming Lends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'borrow-requests' && styles.tabActive]}
              onPress={() => setActiveTab('borrow-requests')}
            >
              <Text style={[styles.tabText, activeTab === 'borrow-requests' && styles.tabTextActive]}>
                Borrow Requests
              </Text>
              {borrowRequests.filter((l) => l.status === 'BORROW_REQUESTED').length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {borrowRequests.filter((l) => l.status === 'BORROW_REQUESTED').length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activeTab === 'incoming' ? (
          <View style={styles.px}>
            {errorVisible && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}
            {incomingLends.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No incoming lend requests.</Text>
              </View>
            ) : (
              <>
                {pendingOffers.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Pending Offers</Text>
                    {pendingOffers.map(renderIncomingCard)}
                  </>
                )}
                {sentRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Your Sent Requests</Text>
                    {sentRequests.map(renderIncomingCard)}
                  </>
                )}
                {handledIncoming.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Handled</Text>
                    {handledIncoming.map(renderIncomingCard)}
                  </>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.px}>
            {errorVisible && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}
            {borrowRequests.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No borrow requests received.</Text>
              </View>
            ) : (
              borrowRequests.map(renderBorrowRequestCard)
            )}
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    marginHorizontal: 16, marginTop: 8, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 16, backgroundColor: Colors.primary, borderRadius: 28,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#FFFFFF', opacity: 0.75, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    backgroundColor: Colors.danger, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  center: { paddingVertical: 60, alignItems: 'center' },
  px: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#121212', fontWeight: '700', fontSize: 14 },
  contactName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  requestAmount: { fontSize: 13, color: Colors.textSecondary },
  dueDate: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  note: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 8 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, marginBottom: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2,
    borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary },
  agreementText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  acceptBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  acceptBtnDisabled: { opacity: 0.4 },
  acceptText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.textPrimary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rejectText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.danger },
  errorBannerText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },
});
