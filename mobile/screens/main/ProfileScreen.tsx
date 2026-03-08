import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_BADGES } from '../../constants/mockData';
import { getCurrentUser, getDashboardSummary, logoutApi, DashboardSummary } from '../../services/api';
import BadgeCard from '../../components/cards/BadgeCard';
import { getInitials, formatCurrency } from '../../utils/formatCurrency';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_H_PAD = 20;
const cardW = (width - CARD_H_PAD * 2 - CARD_GAP) / 2;

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const load = useCallback(async () => {
    const [user, sum] = await Promise.all([
      getCurrentUser().catch(() => null),
      getDashboardSummary().catch(() => null),
    ]);
    if (user) { setUserName(user.name); setUserEmail(user.email); }
    if (sum) setSummary(sum);
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
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName ? getInitials(userName) : '?'}</Text>
        </View>
        <Text style={styles.name}>{userName || 'Loading...'}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
          {MOCK_BADGES.map((badge) => (
            <BadgeCard key={badge.name} badge={badge} />
          ))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => {}}>
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    marginHorizontal: 16, marginTop: 8, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 28, backgroundColor: Colors.primary,
    borderRadius: 28, alignItems: 'center',
  },
  avatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#121212' },
  name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  email: { fontSize: 13, color: '#FFFFFF', opacity: 0.75 },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 40 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CARD_H_PAD, gap: CARD_GAP, paddingTop: 20, paddingBottom: 12 },
  statCard: { width: cardW, backgroundColor: Colors.card, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  statTextWrap: { flex: 1 },
  statLabel: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 12, color: Colors.textSecondary, fontWeight: '400' },
  section: { paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  spacer: { height: 12 },
  settingsBtn: { height: 52, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  settingsText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  logoutBtn: { height: 52, borderRadius: 14, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});
