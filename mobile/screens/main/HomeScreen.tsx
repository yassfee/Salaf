import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getDashboardSummary, getDueSoon, getCurrentUser, getLends, DashboardSummary, DueSoonLend, LendResponse, NotificationItem, sendNotification, getNotifications, markAllNotificationsRead, getUnreadNotificationCount } from '../../services/api';
import LendCard from '../../components/cards/LendCard';
import { formatCurrency, getGreeting, getInitials, formatDate } from '../../utils/formatCurrency';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PAD = 20;
const cardW = (SCREEN_W - CARD_PAD * 2 - CARD_GAP) / 2;

const NOTIFIABLE_STATUSES = ['ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'];

export default function HomeScreen() {
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const [userName, setUserName] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dueSoon, setDueSoon] = useState<DueSoonLend[]>([]);
  const [lends, setLends] = useState<LendResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast state
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'1' | '2'>('1');

  // Notify modal state
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [selectedLendId, setSelectedLendId] = useState<number | null>(null);
  const [notifyNote, setNotifyNote] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [showLendPicker, setShowLendPicker] = useState(false);

  // Notifications panel state
  const [bellVisible, setBellVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const showToast = useCallback((type: '1' | '2' = '1') => {
    setToastType(type);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastAnim]);

  useEffect(() => {
    if (toast === '1' || toast === '2') {
      showToast(toast);
      router.setParams({ toast: undefined });
    }
  }, [toast]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [user, sum, due, myLends, count] = await Promise.all([
        getCurrentUser(),
        getDashboardSummary(),
        getDueSoon(),
        getLends(),
        getUnreadNotificationCount(),
      ]);
      if (user) setUserName(user.name);
      setSummary(sum);
      setDueSoon(due);
      setLends(myLends);
      setUnreadCount(count);
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

  const notifiableLends = lends.filter((l) => NOTIFIABLE_STATUSES.includes(l.status));
  const selectedLend = notifiableLends.find((l) => l.id === selectedLendId);

  const handleSendNotification = async () => {
    if (!selectedLendId) {
      Alert.alert('Select a lend', 'Please choose which lend to notify about.');
      return;
    }
    if (!notifyNote.trim()) {
      Alert.alert('Add a note', 'Please write a note for the borrower.');
      return;
    }
    try {
      setNotifySending(true);
      await sendNotification(selectedLendId, notifyNote.trim());
      setNotifyVisible(false);
      setSelectedLendId(null);
      setNotifyNote('');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send notification.');
    } finally {
      setNotifySending(false);
    }
  };

  const handleOpenBell = async () => {
    setBellVisible(true);
    setNotifLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
      if (data.some((n) => !n.read)) {
        await markAllNotificationsRead();
        setUnreadCount(0);
      }
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  };

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
          <TouchableOpacity style={styles.bellBtn} onPress={handleOpenBell}>
            <Ionicons name="notifications-outline" size={22} color="#121212" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
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
              { label: 'Notify',  icon: 'notifications-outline', onPress: () => setNotifyVisible(true) },
              { label: 'Lend',    icon: 'arrow-up-outline',      onPress: () => router.push('/create-lend') },
              { label: 'Borrow',  icon: 'arrow-down-outline',    onPress: () => router.push('/create-borrow') },
              { label: 'Suggest', icon: 'sync-outline',          onPress: () => router.push('/suggest-repayment') },
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
            <Text style={styles.toastTitle}>{toastType === '2' ? 'Borrow request sent!' : 'Lend request sent!'}</Text>
            <Text style={styles.toastSub}>{toastType === '2' ? 'Waiting for the lender to approve.' : 'Waiting for the borrower to accept.'}</Text>
          </View>
        </Animated.View>
      )}

      {/* Notify Modal */}
      <Modal visible={notifyVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Notify Borrower</Text>
            <Text style={styles.modalHint}>Send a payment reminder with a personal note.</Text>

            {/* Lend Picker */}
            <TouchableOpacity
              style={styles.lendSelector}
              onPress={() => setShowLendPicker(!showLendPicker)}
            >
              {selectedLend ? (
                <View style={styles.selectedLendRow}>
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>{getInitials(selectedLend.contact)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lendSelectorName}>{selectedLend.contact}</Text>
                    <Text style={styles.lendSelectorSub}>{formatCurrency(selectedLend.remainingBalance)} remaining</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.lendSelectorPlaceholder}>Select a lend...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showLendPicker && (
              <View style={styles.pickerList}>
                {notifiableLends.length === 0 ? (
                  <Text style={[styles.lendSelectorPlaceholder, { padding: 12 }]}>No active lends to notify about.</Text>
                ) : (
                  notifiableLends.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      style={styles.pickerItem}
                      onPress={() => { setSelectedLendId(l.id); setShowLendPicker(false); }}
                    >
                      <View style={styles.miniAvatar}>
                        <Text style={styles.miniAvatarText}>{getInitials(l.contact)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemName}>{l.contact}</Text>
                        <Text style={styles.pickerItemSub}>{formatCurrency(l.remainingBalance)} remaining · Due {formatDate(l.due)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Note */}
            <TextInput
              style={styles.noteInput}
              placeholder="Write a note to the borrower..."
              placeholderTextColor={Colors.textSecondary}
              value={notifyNote}
              onChangeText={setNotifyNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.sendBtn, notifySending && { opacity: 0.6 }]}
              onPress={handleSendNotification}
              disabled={notifySending}
            >
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>{notifySending ? 'Sending...' : 'Send Notification'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setNotifyVisible(false); setSelectedLendId(null); setNotifyNote(''); setShowLendPicker(false); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Panel */}
      <Modal visible={bellVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.notifHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setBellVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {notifLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
            ) : notifications.length === 0 ? (
              <Text style={styles.emptyNotif}>No notifications yet.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.slice(0, 5).map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.notifCard, !n.read && styles.notifCardUnread]}
                    activeOpacity={0.8}
                    onPress={() => { setBellVisible(false); router.push(`/lend-details?id=${n.lendId}&incoming=true`); }}
                  >
                    <View style={styles.notifIconWrap}>
                      <Ionicons name="notifications" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>
                        Reminder from <Text style={{ fontWeight: '700' }}>{n.senderName}</Text>
                      </Text>
                      <Text style={styles.notifSub}>
                        Paid <Text style={{ color: Colors.success, fontWeight: '600' }}>{formatCurrency(n.amountPaid)}</Text>
                        {' · '}Remaining <Text style={{ color: Colors.danger, fontWeight: '600' }}>{formatCurrency(n.remainingBalance)}</Text>
                      </Text>
                      {n.note ? <Text style={styles.notifNote}>"{n.note}"</Text> : null}
                      <Text style={styles.notifTime}>{formatDate(n.createdAt)}</Text>
                    </View>
                    {!n.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => { setBellVisible(false); router.push('/notifications'); }}
            >
              <Text style={styles.viewAllText}>View All Notifications</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
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
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  modalHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  // Lend selector
  lendSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, backgroundColor: Colors.background, marginBottom: 8,
  },
  selectedLendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  lendSelectorName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  lendSelectorSub: { fontSize: 11, color: Colors.textSecondary },
  lendSelectorPlaceholder: { fontSize: 14, color: Colors.textSecondary },
  pickerList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.background, marginBottom: 12, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  pickerItemSub: { fontSize: 11, color: Colors.textSecondary },
  miniAvatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  noteInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.background, padding: 14, fontSize: 14,
    color: Colors.textPrimary, minHeight: 90, marginBottom: 16,
  },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, marginBottom: 10 },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: Colors.textSecondary },
  // Notifications panel
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  emptyNotif: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, backgroundColor: Colors.background, marginBottom: 8 },
  notifCardUnread: { backgroundColor: Colors.primaryLight },
  notifIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  notifSub: { fontSize: 12, color: Colors.textSecondary },
  notifNote: { fontSize: 12, color: Colors.textPrimary, fontStyle: 'italic', marginTop: 4 },
  notifTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  viewAllText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
