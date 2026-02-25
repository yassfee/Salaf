import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { MOCK_USER, MOCK_BADGES } from '../../constants/mockData';
import CardContainer from '../../components/ui/CardContainer';
import BadgeCard from '../../components/cards/BadgeCard';
import { getInitials, formatCurrency } from '../../utils/formatCurrency';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(MOCK_USER.name)}</Text>
          </View>
          <Text style={styles.name}>{MOCK_USER.name}</Text>
          <Text style={styles.email}>{MOCK_USER.email}</Text>
        </View>

        {/* Stat Cards */}
        <View style={styles.statRow}>
          <CardContainer style={styles.statCard}>
            <Text style={styles.statLabel}>Total Lent</Text>
            <Text style={styles.statValue}>{formatCurrency(375)}</Text>
          </CardContainer>
          <CardContainer style={styles.statCard}>
            <Text style={styles.statLabel}>Total Borrowed</Text>
            <Text style={styles.statValue}>{formatCurrency(0)}</Text>
          </CardContainer>
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
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
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
  settingsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  logoutBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
