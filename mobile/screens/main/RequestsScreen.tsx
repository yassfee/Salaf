import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { MOCK_REQUESTS } from '../../constants/mockData';
import { LendRequest } from '../../types';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatCurrency';

export default function RequestsScreen() {
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [requests, setRequests] = useState<LendRequest[]>(MOCK_REQUESTS);

  const incoming = requests.filter((r) => r.type === 'INCOMING');
  const outgoing = requests.filter((r) => r.type === 'OUTGOING');
  const displayed = tab === 'incoming' ? incoming : outgoing;

  const handleAccept = (id: number) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'ACCEPTED' } : r))
    );
  };

  const handleReject = (id: number) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Requests</Text>
        </View>

        {/* Toggle */}
        <View style={styles.px}>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, tab === 'incoming' && styles.toggleBtnActive]}
              onPress={() => setTab('incoming')}
            >
              <Text style={[styles.toggleText, tab === 'incoming' && styles.toggleTextActive]}>
                Incoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, tab === 'outgoing' && styles.toggleBtnActive]}
              onPress={() => setTab('outgoing')}
            >
              <Text style={[styles.toggleText, tab === 'outgoing' && styles.toggleTextActive]}>
                Outgoing
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Request Cards */}
        <View style={styles.px}>
          {displayed.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No {tab} requests.</Text>
            </View>
          )}
          {displayed.map((req) => (
            <CardContainer key={req.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(req.contact)}</Text>
                  </View>
                  <View>
                    <Text style={styles.contactName}>{req.contact}</Text>
                    <Text style={styles.requestAmount}>
                      Requesting {formatCurrency(req.amount)}
                    </Text>
                  </View>
                </View>
                {tab === 'outgoing' && <StatusBadge status={req.status} />}
              </View>

              <Text style={styles.dueDate}>Due: {formatDate(req.due)}</Text>
              {req.note && <Text style={styles.note}>{req.note}</Text>}

              {/* Actions for pending incoming */}
              {tab === 'incoming' && req.status === 'PENDING' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(req.id)}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(req.id)}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Already actioned */}
              {tab === 'incoming' && req.status !== 'PENDING' && (
                <StatusBadge status={req.status} />
              )}
            </CardContainer>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  px: { paddingHorizontal: 20 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  contactName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  requestAmount: { fontSize: 13, color: Colors.textSecondary },
  dueDate: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  note: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  rejectBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
