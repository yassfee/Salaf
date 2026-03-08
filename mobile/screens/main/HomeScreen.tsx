import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getDashboardSummary, getDueSoon, getCurrentUser, DashboardSummary, DueSoonLend } from '../../services/api';
import LendCard from '../../components/cards/LendCard';
import { formatCurrency, getGreeting, getInitials } from '../../utils/formatCurrency';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PAD = 20;
const cardW = (SCREEN_W - CARD_PAD * 2 - CARD_GAP) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const [userName, setUserName] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dueSoon, setDueSoon] = useState<DueSoonLend[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast state
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback(() => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastAnim]);

  // Show toast when navigated here with toast param
  useEffect(() => {
    if (toast === '1') {
      showToast();
      router.setParams({ toast: undefined });
    }
  }, [toast]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [user, sum, due] = await Promise.all([
        getCurrentUser(),
        getDashboardSummary(),
        getDueSoon(),
      ]);
      if (user) setUserName(user.name);
      setSummary(sum);
      setDueSoon(due);
    } catch {
      // silently fail — show zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const summaryCards = [
    { label: 'Total Lent',     icon: 'arrow-up-outline',      amount: summary?.totalLent ?? 0 },
    { label: 'Total Borrowed', icon: 'arrow-down-outline',    amount: summary?.totalBorrowed ?? 0 },
    { label: 'Outstanding',    icon: 'time-outline',          amount: summary?.outstanding ?? 0 },
    { label: 'Overdue',        icon: 'alert-circle-outline',  amount: summary?.overdue ?? 0 },
  ];

  const firstName = userName ? userName.split(' ')[0] : '';

  const toastTranslateY = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName ? getInitials(userName) : '?'}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hi{firstName ? `, ${firstName}` : ''}!</Text>
              <Text style={styles.subGreeting}>{getGreeting()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="#121212" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headline}>•••• •••• •••• 4242</Text>
        <TouchableOpacity style={styles.totalChip} activeOpacity={0.8}>
          <Ionicons name="eye-outline" size={13} color="#121212" />
          <Text style={styles.totalChipText}>Show Balance</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Quick Actions */}
          <View style={styles.quickRow}>
            {[
              { label: 'Notify',  icon: 'notifications-outline', onPress: () => {} },
              { label: 'Lend',    icon: 'arrow-up-outline',      onPress: () => router.push('/create-lend') },
              { label: 'Borrow',  icon: 'arrow-down-outline',    onPress: () => router.push('/create-borrow') },
              { label: 'Suggest', icon: 'sync-outline',          onPress: () => {} },
            ].map(({ label, icon, onPress }) => (
              <TouchableOpacity key={label} style={styles.quickItem} activeOpacity={0.8} onPress={onPress}>
                <View style={styles.quickCircle}>
                  <Ionicons name={icon as any} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Due Soon */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Due Soon</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{dueSoon.length}</Text>
              </View>
            </View>
            {dueSoon.length === 0 ? (
              <Text style={styles.emptyText}>No lends due soon.</Text>
            ) : (
              dueSoon.map((lend) => (
                <LendCard
                  key={`${lend.type}-${lend.id}`}
                  lend={lend}
                  onPress={() => {
                    if (lend.type === 'BORROWED') {
                      router.push(`/lend-details?id=${lend.id}&incoming=true`);
                    } else {
                      router.push(`/lend-details?id=${lend.id}`);
                    }
                  }}
                />
              ))
            )}
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
          </View>
          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <View key={card.label} style={[styles.summaryCard, { width: cardW }]}>
                <View style={styles.summaryTop}>
                  <Text style={styles.summaryLabel}>{card.label}</Text>
                  <Ionicons name={card.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={[styles.summaryAmount, card.label === 'Overdue' && styles.redText]}>
                  {formatCurrency(card.amount)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Success Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastTranslateY }] }]}>
          <View style={styles.toastIconWrap}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          </View>
          <View style={styles.toastTextWrap}>
            <Text style={styles.toastTitle}>Lend request sent!</Text>
            <Text style={styles.toastSub}>Waiting for the borrower to accept.</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    marginHorizontal: 16, marginTop: 8, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 28, backgroundColor: Colors.primary, borderRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#121212' },
  greeting: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  subGreeting: { fontSize: 12, color: '#FFFFFF', opacity: 0.75 },
  bellBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  headline: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: 3, marginBottom: 18 },
  totalChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  totalChipText: { fontSize: 13, fontWeight: '600', color: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 24 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 20, paddingVertical: 20 },
  quickItem: { alignItems: 'center', gap: 8 },
  quickCircle: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  section: { paddingHorizontal: 20, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  countBadge: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 13, color: Colors.textSecondary, paddingBottom: 8 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CARD_PAD, paddingBottom: 16, gap: CARD_GAP },
  summaryCard: { height: 90, backgroundColor: Colors.card, borderRadius: 14, padding: 14, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  summaryAmount: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  redText: { color: Colors.danger },
  // Toast
  toast: {
    position: 'absolute', bottom: 28, left: 20, right: 20,
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
  },
  toastIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  toastTextWrap: { flex: 1 },
  toastTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  toastSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
