import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_USER, MOCK_BADGES } from '../../constants/mockData';
import BadgeCard from '../../components/cards/BadgeCard';
import { getInitials, formatCurrency } from '../../utils/formatCurrency';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_H_PAD = 20;
const cardW = (width - CARD_H_PAD * 2 - CARD_GAP) / 2;

const statCards = [
  { label: 'Total Lent',     value: formatCurrency(375), icon: 'arrow-up-outline'     },
  { label: 'Total Borrowed', value: formatCurrency(0),   icon: 'arrow-down-outline'   },
  { label: 'Outstanding',    value: formatCurrency(300), icon: 'time-outline'          },
  { label: 'Overdue',        value: formatCurrency(200), icon: 'alert-circle-outline'  },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Amber Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(MOCK_USER.name)}</Text>
        </View>
        <Text style={styles.name}>{MOCK_USER.name}</Text>
        <Text style={styles.email}>{MOCK_USER.email}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stat Cards — responsive 2-column grid */}
        <View style={styles.statGrid}>
          {statCards.map((card) => (
            <View key={card.label} style={styles.statCard}>
              {/* Row: icon circle on left, text on right */}
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

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {MOCK_BADGES.map((badge) => (
            <BadgeCard key={badge.name} badge={badge} />
          ))}
        </View>

        {/* Settings & Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => {}}>
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/auth')}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  email: { fontSize: 13, color: Colors.textPrimary, opacity: 0.65 },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 40 },

  // Stat cards grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_H_PAD,
    gap: CARD_GAP,
    paddingTop: 20,
    paddingBottom: 12,
  },
  statCard: {
    width: cardW,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  section: { paddingHorizontal: 20, marginTop: 8, marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  spacer: { height: 12 },
  settingsBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  logoutBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});
