import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_CONTACTS, MOCK_LENDS } from '../../constants/mockData';
import CardContainer from '../../components/ui/CardContainer';
import TrustBadge from '../../components/ui/TrustBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatCurrency';

export default function ContactDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const contact = MOCK_CONTACTS.find((c) => c.id === Number(id)) ?? MOCK_CONTACTS[0];
  const contactLends = MOCK_LENDS.filter((l) => l.contactId === contact.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
          </View>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.phone}>{contact.phone}</Text>
        </View>

        <View style={styles.px}>
          {/* Trust Score Card */}
          <CardContainer style={styles.trustCard}>
            <Text style={styles.trustCardTitle}>Trust Score</Text>
            <View style={styles.trustRow}>
              <TrustBadge score={contact.trustScore} />
              <Text style={styles.trustScore}>{contact.trustScore}/100</Text>
            </View>
            <View style={styles.progressWrapper}>
              <ProgressBar progress={contact.trustScore / 100} />
            </View>
            <Text style={styles.trustStats}>
              On time: {contact.onTimePaid ?? 0}  ·  Late: {contact.latePaid ?? 0}
            </Text>
          </CardContainer>

          {/* Stat Row */}
          <View style={styles.statRow}>
            <CardContainer style={styles.statCard}>
              <Text style={styles.statLabel}>Total Lends</Text>
              <Text style={styles.statValue}>{contact.totalLends ?? 0}</Text>
            </CardContainer>
            <CardContainer style={styles.statCard}>
              <Text style={styles.statLabel}>Paid</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {contact.paidLends ?? 0}
              </Text>
            </CardContainer>
            <CardContainer style={styles.statCard}>
              <Text style={styles.statLabel}>Overdue</Text>
              <Text style={[styles.statValue, { color: Colors.danger }]}>
                {contact.overdueLends ?? 0}
              </Text>
            </CardContainer>
          </View>

          {/* Lend History */}
          <Text style={styles.sectionTitle}>Lend History</Text>
          {contactLends.length === 0 ? (
            <Text style={styles.empty}>No lends with this contact.</Text>
          ) : (
            contactLends.map((lend) => (
              <CardContainer key={lend.id} style={styles.lendHistoryCard}>
                <View style={styles.lendHistoryRow}>
                  <View>
                    <Text style={styles.lendAmount}>{formatCurrency(lend.amount)}</Text>
                    <Text style={styles.lendDate}>{formatDate(lend.due)}</Text>
                  </View>
                  <StatusBadge status={lend.status} />
                </View>
              </CardContainer>
            ))
          )}

          <View style={styles.spacer} />
          <PrimaryButton
            title={`+ New Lend to ${contact.name.split(' ')[0]}`}
            onPress={() => router.push('/create-lend')}
          />
        </View>
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
  scroll: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  phone: { fontSize: 14, color: Colors.textSecondary },
  px: { paddingHorizontal: 20 },
  trustCard: { marginBottom: 16 },
  trustCardTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 10,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trustScore: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  progressWrapper: { marginBottom: 10 },
  trustStats: { fontSize: 12, color: Colors.textSecondary },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  lendHistoryCard: { marginBottom: 10 },
  lendHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lendAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  lendDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  empty: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    paddingVertical: 20,
  },
  spacer: { height: 20 },
});
