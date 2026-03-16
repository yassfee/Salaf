import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  ActivityIndicator, Animated, TextInput, Alert, Pressable,
} from 'react-native';
import DraggableSheet from '../../components/ui/DraggableSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  getDashboardSummary, getDueSoon, getCurrentUser, getLends,
  DashboardSummary, DueSoonLend, LendResponse, NotificationItem,
  sendNotification, getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount,
  getContacts, ContactResponse, createLend, createBorrowRequest,
  getIncomingLends, acceptLend, rejectLend, getBorrowRequests, approveBorrowRequest, declineBorrowRequest,
  WalletResponse, getWallet, saveWalletCard, processWalletTransaction,
} from '../../services/api';
import LendCard from '../../components/cards/LendCard';
import StatusBadge from '../../components/ui/StatusBadge';
import DatePickerField from '../../components/ui/DatePickerField';
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

  // Toast
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'1' | '2' | '3' | '4'>('1');

  // Notify modal
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [selectedLendId, setSelectedLendId] = useState<number | null>(null);
  const [notifyNote, setNotifyNote] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [showLendPicker, setShowLendPicker] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  // Bell panel
  const [bellVisible, setBellVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  // Wallet
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const balanceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  // Wallet form state
  const [wCardNumber, setWCardNumber] = useState('');
  const [wCardholder, setWCardholder] = useState('');
  const [wExpiry, setWExpiry] = useState('');
  const [wBalance, setWBalance] = useState('');
  const [wSaving, setWSaving] = useState(false);
  const [wError, setWError] = useState('');

  // Shared contacts (lend + borrow modals)
  const [formContacts, setFormContacts] = useState<ContactResponse[]>([]);
  const [formContactsLoading, setFormContactsLoading] = useState(false);

  // Lend modal
  const [lendVisible, setLendVisible] = useState(false);
  const [lendContact, setLendContact] = useState<number | null>(null);
  const [lendAmount, setLendAmount] = useState('');
  const [lendDueDate, setLendDueDate] = useState('');
  const [lendNote, setLendNote] = useState('');
  const [lendPickerOpen, setLendPickerOpen] = useState(false);
  const [lendErrors, setLendErrors] = useState<Record<string, string>>({});
  const [lendSubmitting, setLendSubmitting] = useState(false);
  const [lendAgreed, setLendAgreed] = useState(false);

  // Borrow modal
  const [borrowVisible, setBorrowVisible] = useState(false);
  const [borrowContact, setBorrowContact] = useState<number | null>(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDueDate, setBorrowDueDate] = useState('');
  const [borrowNote, setBorrowNote] = useState('');
  const [borrowPickerOpen, setBorrowPickerOpen] = useState(false);
  const [borrowErrors, setBorrowErrors] = useState<Record<string, string>>({});
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);
  const [borrowAgreed, setBorrowAgreed] = useState(false);
  const [lendSubmitError, setLendSubmitError] = useState('');
  const [borrowSubmitError, setBorrowSubmitError] = useState('');
  const [activeBorrowCount, setActiveBorrowCount] = useState(0);

  // Requests modal
  const [requestsVisible, setRequestsVisible] = useState(false);
  const [incomingLends, setIncomingLends] = useState<LendResponse[]>([]);
  const [borrowReqList, setBorrowReqList] = useState<LendResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsTab, setRequestsTab] = useState<'incoming' | 'borrow-requests'>('incoming');
  const [requestsAgreed, setRequestsAgreed] = useState<Record<number, boolean>>({});
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const showToast = useCallback((type: '1' | '2' | '3' | '4' = '1') => {
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

  // ── Dashboard load ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [userR, sumR, dueR, lendsR, countR, walletR, incomingR, borrowR] = await Promise.allSettled([
        getCurrentUser(),
        getDashboardSummary(),
        getDueSoon(),
        getLends(),
        getUnreadNotificationCount(),
        getWallet(),
        getIncomingLends(),
        getBorrowRequests(),
      ]);
      if (userR.status === 'fulfilled' && userR.value) setUserName(userR.value.name);
      if (sumR.status === 'fulfilled') setSummary(sumR.value);
      if (dueR.status === 'fulfilled') setDueSoon(dueR.value);
      if (lendsR.status === 'fulfilled') setLends(lendsR.value);
      if (countR.status === 'fulfilled') setUnreadCount(countR.value);
      if (walletR.status === 'fulfilled') setWallet(walletR.value);
      const incomingPending = incomingR.status === 'fulfilled' ? incomingR.value.filter((l) => l.status === 'PENDING').length : 0;
      const borrowPending = borrowR.status === 'fulfilled' ? borrowR.value.filter((l) => l.status === 'BORROW_REQUESTED').length : 0;
      setPendingRequestsCount(incomingPending + borrowPending);
      if (incomingR.status === 'fulfilled') {
        setActiveBorrowCount(incomingR.value.filter((l) => ['ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'].includes(l.status)).length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Shared contacts loader ───────────────────────────────────────────────────
  const loadFormContacts = async () => {
    if (formContacts.length > 0) return;
    setFormContactsLoading(true);
    try {
      const data = await getContacts();
      setFormContacts(data);
    } catch {
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setFormContactsLoading(false);
    }
  };

  // ── Notify ───────────────────────────────────────────────────────────────────
  const notifiableLends = lends.filter((l) => NOTIFIABLE_STATUSES.includes(l.status));
  const selectedLend = notifiableLends.find((l) => l.id === selectedLendId);

  const handleSendNotification = async () => {
    if (!selectedLendId) { setNotifyError('Please select a lend to notify about.'); return; }
    if (!notifyNote.trim()) { setNotifyError('Please write a note for the borrower.'); return; }
    setNotifyError('');
    try {
      setNotifySending(true);
      await sendNotification(selectedLendId, notifyNote.trim());
      setNotifyVisible(false);
      setSelectedLendId(null);
      setNotifyNote('');
      setNotifyError('');
      showToast('4');
    } catch (e: any) {
      setNotifyError(e?.response?.data?.message ?? 'Failed to send notification.');
    } finally {
      setNotifySending(false);
    }
  };

  // ── Bell panel ───────────────────────────────────────────────────────────────
  const handleOpenBell = async () => {
    setBellVisible(true);
    setNotifLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  };

  // ── Lend modal ───────────────────────────────────────────────────────────────
  const openLend = () => { setLendVisible(true); loadFormContacts(); };
  const closeLend = () => {
    setLendVisible(false);
    setLendContact(null); setLendAmount(''); setLendDueDate('');
    setLendNote(''); setLendPickerOpen(false); setLendErrors({}); setLendAgreed(false); setLendSubmitError('');
  };
  const lendChosenContact = formContacts.find((c) => c.id === lendContact);

  const validateLend = () => {
    const errs: Record<string, string> = {};
    if (!lendContact) errs.contact = 'Please select a contact';
    if (!lendAmount || parseFloat(lendAmount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!lendDueDate) errs.dueDate = 'Due date is required';
    if (!lendAgreed) errs.agreed = 'You must confirm the lending agreement';
    setLendErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitLend = async () => {
    if (!validateLend()) return;
    try {
      setLendSubmitting(true);
      await createLend(lendContact!, parseFloat(lendAmount), lendDueDate, lendNote || undefined);
      closeLend();
      await load();
      showToast('1');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to create lend.';
      setLendSubmitError(msg);
    } finally {
      setLendSubmitting(false);
    }
  };

  // ── Borrow modal ─────────────────────────────────────────────────────────────
  const openBorrow = () => { setBorrowVisible(true); loadFormContacts(); };
  const closeBorrow = () => {
    setBorrowVisible(false);
    setBorrowContact(null); setBorrowAmount(''); setBorrowDueDate('');
    setBorrowNote(''); setBorrowPickerOpen(false); setBorrowErrors({}); setBorrowAgreed(false); setBorrowSubmitError('');
  };
  const borrowChosenContact = formContacts.find((c) => c.id === borrowContact);

  const validateBorrow = () => {
    const errs: Record<string, string> = {};
    if (!borrowContact) errs.contact = 'Please select who you want to borrow from';
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!borrowDueDate) errs.dueDate = 'Due date is required';
    if (!borrowAgreed) errs.agreed = 'You must confirm the borrowing agreement';
    setBorrowErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitBorrow = async () => {
    if (activeBorrowCount >= 3) {
      setBorrowSubmitError('You have reached the limit of 3 active borrows. Please finish at least one before making a new request.');
      return;
    }
    if (!validateBorrow()) return;
    try {
      setBorrowSubmitting(true);
      await createBorrowRequest(borrowContact!, parseFloat(borrowAmount), borrowDueDate, borrowNote || undefined);
      closeBorrow();
      await load();
      showToast('2');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to send borrow request.';
      setBorrowSubmitError(msg);
    } finally {
      setBorrowSubmitting(false);
    }
  };

  // ── Requests modal ───────────────────────────────────────────────────────────
  const openRequests = async (tab: 'incoming' | 'borrow-requests' = 'incoming') => {
    setRequestsTab(tab);
    setRequestsVisible(true);
    setRequestsLoading(true);
    try {
      const [incoming, brReqs] = await Promise.all([getIncomingLends(), getBorrowRequests()]);
      setIncomingLends(incoming);
      setBorrowReqList(brReqs);
      const incomingPending = incoming.filter((l) => l.status === 'PENDING').length;
      const borrowPending = brReqs.filter((l) => l.status === 'BORROW_REQUESTED').length;
      setPendingRequestsCount(incomingPending + borrowPending);
    } catch {
      Alert.alert('Error', 'Failed to load requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const closeRequests = () => {
    setRequestsVisible(false);
    setRequestsTab('incoming');
    setRequestsAgreed({});
  };

  const handleAccept = async (id: number) => {
    if (!requestsAgreed[id]) { Alert.alert('Agreement Required', 'Please check the agreement box before accepting.'); return; }
    try {
      const updated = await acceptLend(id);
      setIncomingLends((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch { Alert.alert('Error', 'Failed to accept lend.'); }
  };

  const handleReject = async (id: number) => {
    try {
      const updated = await rejectLend(id);
      setIncomingLends((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch { Alert.alert('Error', 'Failed to reject lend.'); }
  };

  const handleApprove = async (id: number) => {
    try {
      const updated = await approveBorrowRequest(id);
      setBorrowReqList((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch { Alert.alert('Error', 'Failed to approve request.'); }
  };

  const handleDecline = async (id: number) => {
    try {
      const updated = await declineBorrowRequest(id);
      setBorrowReqList((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch { Alert.alert('Error', 'Failed to decline request.'); }
  };

  const pendingIncoming = incomingLends.filter((l) => l.status === 'PENDING');
  const handledIncoming = incomingLends.filter((l) => l.status === 'ACCEPTED' || l.status === 'REJECTED');
  const pendingBorrowReqs = borrowReqList.filter((l) => l.status === 'BORROW_REQUESTED');

  // ── Wallet helpers ────────────────────────────────────────────────────────────
  const detectBrand = (num: string): string => {
    const d = num.replace(/\D/g, '');
    if (d.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'MASTERCARD';
    if (/^3[47]/.test(d)) return 'AMEX';
    if (/^6/.test(d)) return 'DISCOVER';
    return '';
  };
  const formatCardInput = (val: string) => {
    const d = val.replace(/\D/g, '').substring(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
  };
  const formatExpiryInput = (val: string) => {
    const d = val.replace(/\D/g, '').substring(0, 4);
    return d.length >= 3 ? d.substring(0, 2) + '/' + d.substring(2) : d;
  };
  const wBrand = detectBrand(wCardNumber);
  const wLast4 = wCardNumber.replace(/\D/g, '').slice(-4);

  const openWalletModal = () => {
    setWCardNumber(wallet?.last4 ? `•••• •••• •••• ${wallet.last4}` : '');
    setWCardholder(wallet?.cardholderName ?? '');
    const mo = wallet?.expiryMonth?.toString().padStart(2, '0') ?? '';
    const yr = wallet?.expiryYear?.toString().slice(-2) ?? '';
    setWExpiry(mo && yr ? `${mo}/${yr}` : '');
    setWBalance(wallet?.balance != null ? Number(wallet.balance).toFixed(3) : '');
    setWalletModalVisible(true);
  };

  const handleSaveWallet = async () => {
    setWError('');
    const rawDigits = wCardNumber.replace(/\D/g, '');
    const usingExistingCard = wallet?.hasCard && wCardNumber.includes('•') && rawDigits.length <= 4;

    if (!usingExistingCard && rawDigits.length < 13) {
      setWError('Please enter a valid card number (13–19 digits).');
      return;
    }
    const [moStr, yrStr] = wExpiry.split('/');
    const mo = parseInt(moStr ?? '0');
    const yr = parseInt(yrStr ?? '0');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (!mo || mo < 1 || mo > 12 || !yr) {
      setWError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (yr < currentYear || (yr === currentYear && mo < currentMonth)) {
      setWError('This card has expired.');
      return;
    }
    if (!wCardholder.trim()) {
      setWError('Please enter the cardholder name.');
      return;
    }
    if (wCardholder.trim().length < 2) {
      setWError('Cardholder name must be at least 2 characters.');
      return;
    }

    const enteredBalance = parseFloat(wBalance) || 0;
    if (enteredBalance < 0) {
      setWError('Balance cannot be negative.');
      return;
    }
    if (enteredBalance > 99999) {
      setWError('Balance cannot exceed 99,999 BD.');
      return;
    }

    const last4 = usingExistingCard ? (wallet!.last4 ?? rawDigits) : rawDigits.slice(-4);
    const brand = usingExistingCard ? (wallet!.brand ?? 'OTHER') : (detectBrand(wCardNumber) || 'OTHER');

    try {
      setWSaving(true);
      const updatedCard = await saveWalletCard({
        last4, brand,
        cardholderName: wCardholder.trim().toUpperCase(),
        expiryMonth: mo,
        expiryYear: 2000 + yr,
      });

      // Adjust balance via transaction (DEPOSIT or WITHDRAWAL for the delta)
      const currentBalance = parseFloat(wallet?.balance?.toString() ?? '0') || 0;
      const delta = parseFloat((enteredBalance - currentBalance).toFixed(3));
      let updatedBalance = updatedCard;
      if (delta > 0) {
        updatedBalance = await processWalletTransaction('DEPOSIT', delta);
      } else if (delta < 0) {
        updatedBalance = await processWalletTransaction('WITHDRAWAL', Math.abs(delta));
      }

      setWallet({ ...updatedCard, balance: updatedBalance.balance });
      setWalletModalVisible(false);
      showToast('3');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to save wallet.';
      setWError(msg);
    } finally {
      setWSaving(false);
    }
  };

  // card display helpers
  const cardBrandColor: Record<string, string> = {
    VISA: '#1A1F71', MASTERCARD: '#EB5757', AMEX: '#007B5E', DISCOVER: '#E65C00',
  };
  const cardDisplayBrand = wallet?.brand ?? '';
  const cardAccent = cardBrandColor[cardDisplayBrand] ?? '#333';
  const cardExpiry = wallet?.expiryMonth && wallet?.expiryYear
    ? `${wallet.expiryMonth.toString().padStart(2, '0')}/${wallet.expiryYear.toString().slice(-2)}`
    : '——/——';

  // ── Summary ──────────────────────────────────────────────────────────────────
  const summaryCards = [
    { label: 'Total Lent',     icon: 'arrow-up-outline',      amount: summary?.totalLent ?? 0 },
    { label: 'Total Borrowed', icon: 'arrow-down-outline',    amount: summary?.totalBorrowed ?? 0 },
    { label: 'Outstanding',    icon: 'time-outline',          amount: summary?.outstanding ?? 0 },
    { label: 'Overdue',        icon: 'alert-circle-outline',  amount: summary?.overdue ?? 0 },
  ];

  const firstName = userName ? userName.split(' ')[0] : '';
  const toastTranslateY = toastAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName ? getInitials(userName) : '?'}</Text>
              </View>
              <View>
                <Text style={styles.greeting}>Hi{firstName ? `, ${firstName}` : ''}!</Text>
                <Text style={styles.subGreeting}>Welcome back!</Text>
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
          <TouchableOpacity style={styles.cardDisplay} onPress={openWalletModal} activeOpacity={0.85}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardChipIcon}>
                <Ionicons name="card-outline" size={14} color={Colors.primary} />
              </View>
              {cardDisplayBrand ? (
                <Text style={styles.cardBrand}>{cardDisplayBrand}</Text>
              ) : <Text style={styles.cardBrand}>TAP TO ADD</Text>}
            </View>
            <Text style={styles.cardNumber}>
              {wallet?.hasCard ? `•••• •••• •••• ${wallet.last4}` : '•••• •••• •••• ••••'}
            </Text>
            <View style={styles.cardBottomRow}>
              <View>
                <Text style={styles.cardFieldLabel}>CARDHOLDER</Text>
                <Text style={styles.cardFieldValue}>{wallet?.cardholderName ?? '— — — — —'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardFieldLabel}>EXPIRES</Text>
                <Text style={styles.cardFieldValue}>{cardExpiry}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.totalChip} activeOpacity={0.8} onPress={() => {
              if (balanceVisible) {
                setBalanceVisible(false);
                if (balanceTimerRef.current) clearTimeout(balanceTimerRef.current);
              } else {
                setBalanceVisible(true);
                if (balanceTimerRef.current) clearTimeout(balanceTimerRef.current);
                balanceTimerRef.current = setTimeout(() => setBalanceVisible(false), 3000);
              }
            }}>
            <Ionicons name={balanceVisible ? 'eye-off-outline' : 'eye-outline'} size={13} color="#121212" />
            <Text style={styles.totalChipText}>
              {balanceVisible ? `BD ${Number(wallet?.balance ?? 0).toFixed(3)}` : 'Show Balance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gray rounded body */}
        <View style={styles.body}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* Quick Actions */}
              <View style={styles.quickRow}>
                {[
                  { label: 'Notify',    icon: 'notifications-outline',    onPress: () => setNotifyVisible(true),    badge: 0 },
                  { label: 'Lend',      icon: 'arrow-up-outline',         onPress: openLend,                        badge: 0 },
                  { label: 'Borrow',    icon: 'arrow-down-outline',       onPress: openBorrow,                      badge: 0 },
                  { label: 'Requests',  icon: 'git-pull-request-outline', onPress: () => openRequests('incoming'),  badge: pendingRequestsCount },
                ].map(({ label, icon, onPress, badge }) => (
                  <TouchableOpacity key={label} style={styles.quickItem} activeOpacity={0.8} onPress={onPress}>
                    <View style={styles.quickCircle}>
                      <Ionicons name={icon as any} size={22} color="#FFFFFF" />
                      {badge > 0 && (
                        <View style={styles.quickBadge}>
                          <Text style={styles.quickBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                        </View>
                      )}
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
            </>
          )}
        </View>
      </ScrollView>

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastTranslateY }] }]}>
          <View style={styles.toastIconWrap}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          </View>
          <View style={styles.toastTextWrap}>
            <Text style={styles.toastTitle}>
              {toastType === '4' ? 'Notification sent!' : toastType === '3' ? 'Wallet saved!' : toastType === '2' ? 'Borrow request sent!' : 'Lend request sent!'}
            </Text>
            <Text style={styles.toastSub}>
              {toastType === '4' ? 'The borrower has been notified.' : toastType === '3' ? 'Your card and balance have been updated.' : toastType === '2' ? 'Waiting for the lender to approve.' : 'Waiting for the borrower to accept.'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── Notify Modal ─────────────────────────────────────────────────────── */}
      <DraggableSheet visible={notifyVisible} onClose={() => { setNotifyVisible(false); setSelectedLendId(null); setNotifyNote(''); setShowLendPicker(false); setNotifyError(''); }}>
            <Text style={styles.modalTitle}>Notify Borrower</Text>
            <Text style={styles.modalHint}>Send a payment reminder with a personal note.</Text>

            <TouchableOpacity style={styles.contactSelector} onPress={() => setShowLendPicker(!showLendPicker)}>
              {selectedLend ? (
                <View style={styles.selectorRow}>
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>{getInitials(selectedLend.contact)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorName}>{selectedLend.contact}</Text>
                    <Text style={styles.selectorSub}>{formatCurrency(selectedLend.remainingBalance)} remaining</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>Select a lend...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showLendPicker && (
              <View style={styles.pickerList}>
                {notifiableLends.length === 0 ? (
                  <Text style={[styles.selectorPlaceholder, { padding: 12 }]}>No active lends to notify about.</Text>
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

            {notifyError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{notifyError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.sendBtn, notifySending && { opacity: 0.6 }]}
              onPress={handleSendNotification}
              disabled={notifySending}
            >
              <Text style={styles.sendBtnText}>{notifySending ? 'Sending...' : 'Send Notification'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNotifyVisible(false); setSelectedLendId(null); setNotifyNote(''); setShowLendPicker(false); setNotifyError(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
      </DraggableSheet>

      {/* ── Bell Panel ───────────────────────────────────────────────────────── */}
      <DraggableSheet visible={bellVisible} onClose={() => setBellVisible(false)} sheetStyle={{ maxHeight: '80%' }}>
            <Text style={styles.modalTitle}>Notifications</Text>
            {notifLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
            ) : notifications.filter((n) => !n.read).length === 0 ? (
              <Text style={styles.emptyNotif}>No new notifications.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.filter((n) => !n.read).slice(0, 5).map((n) => (
                  <View key={n.id} style={[styles.notifCard, !n.read && styles.notifCardUnread]}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}
                      activeOpacity={0.7}
                      onPress={async () => {
                        setBellVisible(false);
                        try { await markNotificationRead(n.id); } catch { /* ignore */ }
                        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                        if (!n.read) setUnreadCount((prev) => Math.max(0, prev - 1));
                        if (n.type === 'LEND_REQUEST') {
                          openRequests('incoming');
                        } else if (n.type === 'BORROW_REQUEST') {
                          openRequests('borrow-requests');
                        } else {
                          router.push(`/lend-details?id=${n.lendId}&incoming=true`);
                        }
                      }}
                    >
                      <View style={styles.notifIconWrap}>
                        <Ionicons name="notifications" size={18} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifTitle}>
                          {n.type === 'LEND_REQUEST'
                            ? <><Text style={{ fontWeight: '700' }}>{n.senderName}</Text> sent you a lend request</>
                            : n.type === 'BORROW_REQUEST'
                            ? <><Text style={{ fontWeight: '700' }}>{n.senderName}</Text> wants to borrow from you</>
                            : <>Reminder from <Text style={{ fontWeight: '700' }}>{n.senderName}</Text></>}
                        </Text>
                        <Text style={styles.notifSub}>
                          {n.type === 'REMINDER'
                            ? <>Paid <Text style={{ color: Colors.success, fontWeight: '600' }}>{formatCurrency(n.amountPaid)}</Text>{' · '}Remaining <Text style={{ color: Colors.danger, fontWeight: '600' }}>{formatCurrency(n.remainingBalance)}</Text></>
                            : <Text style={{ color: Colors.primary, fontWeight: '600' }}>{formatCurrency(n.amount)}</Text>}
                        </Text>
                        {n.note ? <Text style={styles.notifNote}>"{n.note}"</Text> : null}
                        <Text style={styles.notifTime}>{formatDate(n.createdAt)}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.notifDismissBtn}
                      onPress={() => {
                        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                        if (!n.read) setUnreadCount((prev) => Math.max(0, prev - 1));
                        markNotificationRead(n.id).catch(() => {});
                      }}
                    >
                      <Ionicons name="checkmark" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => { setBellVisible(false); router.push('/notifications'); }}>
              <Text style={styles.viewAllText}>View All Notifications</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
      </DraggableSheet>

      {/* ── Lend Modal ───────────────────────────────────────────────────────── */}
      <DraggableSheet visible={lendVisible} onClose={closeLend} sheetStyle={{ maxHeight: '85%' }}>
            <Text style={styles.modalTitle}>Create Lend</Text>
            {lendSubmitError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{lendSubmitError}</Text>
              </View>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Contact Selector */}
              {formContactsLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginBottom: 12 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.contactSelector, lendErrors.contact && styles.errorBorder]}
                    onPress={() => setLendPickerOpen(!lendPickerOpen)}
                  >
                    {lendChosenContact ? (
                      <View style={styles.selectorRow}>
                        <View style={styles.miniAvatar}>
                          <Text style={styles.miniAvatarText}>{getInitials(lendChosenContact.name)}</Text>
                        </View>
                        <Text style={styles.selectorName}>{lendChosenContact.name}</Text>
                      </View>
                    ) : (
                      <Text style={styles.selectorPlaceholder}>Select Contact</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  {lendErrors.contact && <Text style={styles.formError}>{lendErrors.contact}</Text>}

                  {lendPickerOpen && (
                    <View style={styles.pickerList}>
                      {formContacts.length === 0 ? (
                        <Text style={[styles.selectorPlaceholder, { padding: 12 }]}>No contacts yet. Add one first.</Text>
                      ) : (
                        formContacts.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.pickerItem}
                            onPress={() => { setLendContact(c.id); setLendPickerOpen(false); }}
                          >
                            <View style={styles.miniAvatar}>
                              <Text style={styles.miniAvatarText}>{getInitials(c.name)}</Text>
                            </View>
                            <Text style={styles.pickerItemName}>{c.name}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Amount */}
              <View style={[styles.amountRow, lendErrors.amount && styles.errorBorder]}>
                <Text style={styles.amountPrefix}>BD</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.000"
                  placeholderTextColor={Colors.textSecondary}
                  value={lendAmount}
                  onChangeText={setLendAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              {lendErrors.amount && <Text style={styles.formError}>{lendErrors.amount}</Text>}

              {/* Due Date */}
              <DatePickerField
                value={lendDueDate}
                onChange={setLendDueDate}
                placeholder="Select due date"
                error={!!lendErrors.dueDate}
              />
              {lendErrors.dueDate && <Text style={styles.formError}>{lendErrors.dueDate}</Text>}

              {/* Note */}
              <TextInput
                style={styles.noteInput}
                placeholder="Note (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={lendNote}
                onChangeText={setLendNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Agreement */}
              <TouchableOpacity style={styles.agreementRow} onPress={() => setLendAgreed(!lendAgreed)} activeOpacity={0.8}>
                <View style={[styles.checkbox, lendAgreed && styles.checkboxChecked]}>
                  {lendAgreed && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.agreementText}>
                  I confirm I am lending{lendChosenContact ? ` to ${lendChosenContact.name}` : ''} and understand this is a formal record
                </Text>
              </TouchableOpacity>
              {lendErrors.agreed && <Text style={styles.formError}>{lendErrors.agreed}</Text>}

              <TouchableOpacity
                style={[styles.sendBtn, { marginTop: 16 }, lendSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitLend}
                disabled={lendSubmitting}
              >
                <Text style={styles.sendBtnText}>{lendSubmitting ? 'Submitting...' : 'Submit Lend'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeLend}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
      </DraggableSheet>

      {/* ── Borrow Modal ─────────────────────────────────────────────────────── */}
      <DraggableSheet visible={borrowVisible} onClose={closeBorrow} sheetStyle={{ maxHeight: '85%' }}>
            <Text style={styles.modalTitle}>Request to Borrow</Text>
            {borrowSubmitError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{borrowSubmitError}</Text>
              </View>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.modalHint}>Select a contact. They will review and approve your request.</Text>

              {/* Contact Selector */}
              {formContactsLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginBottom: 12 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.contactSelector, borrowErrors.contact && styles.errorBorder]}
                    onPress={() => setBorrowPickerOpen(!borrowPickerOpen)}
                  >
                    {borrowChosenContact ? (
                      <View style={styles.selectorRow}>
                        <View style={styles.miniAvatar}>
                          <Text style={styles.miniAvatarText}>{getInitials(borrowChosenContact.name)}</Text>
                        </View>
                        <Text style={styles.selectorName}>{borrowChosenContact.name}</Text>
                      </View>
                    ) : (
                      <Text style={styles.selectorPlaceholder}>Borrow from...</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  {borrowErrors.contact && <Text style={styles.formError}>{borrowErrors.contact}</Text>}

                  {borrowPickerOpen && (
                    <View style={styles.pickerList}>
                      {formContacts.length === 0 ? (
                        <Text style={[styles.selectorPlaceholder, { padding: 12 }]}>No contacts yet. Add one first.</Text>
                      ) : (
                        formContacts.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.pickerItem}
                            onPress={() => { setBorrowContact(c.id); setBorrowPickerOpen(false); }}
                          >
                            <View style={styles.miniAvatar}>
                              <Text style={styles.miniAvatarText}>{getInitials(c.name)}</Text>
                            </View>
                            <Text style={styles.pickerItemName}>{c.name}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Amount */}
              <View style={[styles.amountRow, borrowErrors.amount && styles.errorBorder]}>
                <Text style={styles.amountPrefix}>BD</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.000"
                  placeholderTextColor={Colors.textSecondary}
                  value={borrowAmount}
                  onChangeText={setBorrowAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              {borrowErrors.amount && <Text style={styles.formError}>{borrowErrors.amount}</Text>}

              {/* Due Date */}
              <DatePickerField
                value={borrowDueDate}
                onChange={setBorrowDueDate}
                placeholder="Select due date"
                error={!!borrowErrors.dueDate}
              />
              {borrowErrors.dueDate && <Text style={styles.formError}>{borrowErrors.dueDate}</Text>}

              {/* Note */}
              <TextInput
                style={styles.noteInput}
                placeholder="Reason / Note (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={borrowNote}
                onChangeText={setBorrowNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Agreement */}
              <TouchableOpacity style={styles.agreementRow} onPress={() => setBorrowAgreed(!borrowAgreed)} activeOpacity={0.8}>
                <View style={[styles.checkbox, borrowAgreed && styles.checkboxChecked]}>
                  {borrowAgreed && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.agreementText}>
                  I confirm I want to borrow{borrowChosenContact ? ` from ${borrowChosenContact.name}` : ''} and will repay the full amount on time
                </Text>
              </TouchableOpacity>
              {borrowErrors.agreed && <Text style={styles.formError}>{borrowErrors.agreed}</Text>}

              <TouchableOpacity
                style={[styles.sendBtn, { marginTop: 16 }, borrowSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitBorrow}
                disabled={borrowSubmitting}
              >
                <Text style={styles.sendBtnText}>{borrowSubmitting ? 'Sending...' : 'Send Borrow Request'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeBorrow}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
      </DraggableSheet>

      {/* ── Wallet Modal ─────────────────────────────────────────────────────── */}
      <DraggableSheet visible={walletModalVisible} onClose={() => { setWalletModalVisible(false); setWError(''); }} sheetStyle={{ maxHeight: '85%' }}>
            <Text style={styles.modalTitle}>Manage Wallet</Text>
            {!!wError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{wError}</Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.modalHint}>Enter your card details and set your available balance.</Text>

              <Text style={styles.walletFieldLabel}>Card Number</Text>
              <View style={styles.walletInputRow}>
                <Ionicons name="card-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.walletInput}
                  placeholder="•••• •••• •••• ••••"
                  placeholderTextColor={Colors.textSecondary}
                  value={wCardNumber}
                  onChangeText={(v) => { setWCardNumber(formatCardInput(v)); setWError(''); }}
                  keyboardType="number-pad"
                  maxLength={19}
                />
                {wBrand ? <Text style={styles.wBrandPill}>{wBrand}</Text> : null}
              </View>

              <Text style={styles.walletFieldLabel}>Cardholder Name</Text>
              <View style={styles.walletInputRow}>
                <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.walletInput}
                  placeholder="FULL NAME"
                  placeholderTextColor={Colors.textSecondary}
                  value={wCardholder}
                  onChangeText={(v) => { setWCardholder(v.replace(/[^a-zA-Z\s'-]/g, '').toUpperCase()); setWError(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={50}
                />
              </View>

              <Text style={styles.walletFieldLabel}>Expiry Date</Text>
              <View style={styles.walletInputRow}>
                <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.walletInput}
                  placeholder="MM/YY"
                  placeholderTextColor={Colors.textSecondary}
                  value={wExpiry}
                  onChangeText={(v) => { setWExpiry(formatExpiryInput(v)); setWError(''); }}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>

              <Text style={styles.walletFieldLabel}>Available Balance (BHD)</Text>
              <View style={styles.walletInputRow}>
                <Text style={[styles.amountPrefix, { marginRight: 8 }]}>BHD</Text>
                <TextInput
                  style={styles.walletInput}
                  placeholder="0.000"
                  placeholderTextColor={Colors.textSecondary}
                  value={wBalance}
                  onChangeText={(v) => {
                    // Allow only digits and a single decimal point with max 3 decimal places
                    const clean = v.replace(/[^0-9.]/g, '');
                    const parts = clean.split('.');
                    const formatted = parts.length > 2
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : parts[0] + (parts[1] !== undefined ? '.' + parts[1].slice(0, 3) : '');
                    setWBalance(formatted);
                    setWError('');
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, { marginTop: 20 }, wSaving && { opacity: 0.6 }]}
                onPress={handleSaveWallet}
                disabled={wSaving}
              >
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>{wSaving ? 'Saving...' : 'Save Wallet'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setWalletModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
      </DraggableSheet>

      {/* ── Requests Modal ───────────────────────────────────────────────────── */}
      <DraggableSheet visible={requestsVisible} onClose={closeRequests} sheetStyle={{ maxHeight: '88%', paddingBottom: 24 }}>
            <Text style={styles.modalTitle}>Requests</Text>

            {/* Tabs */}
            <View style={styles.reqTabRow}>
              <TouchableOpacity
                style={[styles.reqTab, requestsTab === 'incoming' && styles.reqTabActive]}
                onPress={() => setRequestsTab('incoming')}
              >
                <Text style={[styles.reqTabText, requestsTab === 'incoming' && styles.reqTabTextActive]}>Incoming Lends</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reqTab, requestsTab === 'borrow-requests' && styles.reqTabActive]}
                onPress={() => setRequestsTab('borrow-requests')}
              >
                <Text style={[styles.reqTabText, requestsTab === 'borrow-requests' && styles.reqTabTextActive]}>Borrow Requests</Text>
                {pendingBorrowReqs.length > 0 && (
                  <View style={styles.reqTabBadge}>
                    <Text style={styles.reqTabBadgeText}>{pendingBorrowReqs.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {requestsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                {requestsTab === 'incoming' ? (
                  incomingLends.length === 0 || (pendingIncoming.length === 0 && handledIncoming.length === 0) ? (
                    <Text style={styles.reqEmptyText}>No incoming lend requests.</Text>
                  ) : (
                    <>
                      {pendingIncoming.length > 0 && (
                        <>
                          <Text style={styles.reqSectionLabel}>Pending Offers</Text>
                          {pendingIncoming.map((req) => (
                            <View key={req.id} style={styles.reqCard}>
                              <TouchableOpacity activeOpacity={0.7} onPress={() => { setRequestsVisible(false); router.push(`/lend-details?id=${req.id}&incoming=true`); }}>
                                <View style={styles.reqCardHeader}>
                                  <View style={styles.reqAvatarRow}>
                                    <View style={styles.reqAvatar}>
                                      <Text style={styles.reqAvatarText}>{getInitials(req.lenderName)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.reqContactName} numberOfLines={1}>From: {req.lenderName}</Text>
                                      <Text style={styles.reqAmount}>{formatCurrency(req.amount)}</Text>
                                    </View>
                                  </View>
                                  <StatusBadge status={req.status} />
                                </View>
                                <Text style={styles.reqDueDate}>Due: {formatDate(req.due)}</Text>
                                {req.note ? <Text style={styles.reqNote}>{req.note}</Text> : null}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.agreementRow}
                                onPress={() => setRequestsAgreed((p) => ({ ...p, [req.id]: !p[req.id] }))}
                                activeOpacity={0.8}
                              >
                                <View style={[styles.checkbox, requestsAgreed[req.id] && styles.checkboxChecked]}>
                                  {requestsAgreed[req.id] && <Ionicons name="checkmark" size={12} color="#fff" />}
                                </View>
                                <Text style={styles.agreementText}>I agree to borrow this money and will return it by {formatDate(req.due)}</Text>
                              </TouchableOpacity>
                              <View style={styles.reqActionRow}>
                                <TouchableOpacity
                                  style={[styles.reqAcceptBtn, !requestsAgreed[req.id] && styles.reqAcceptBtnDisabled]}
                                  onPress={() => handleAccept(req.id)}
                                >
                                  <Text style={styles.reqAcceptText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.reqRejectBtn} onPress={() => handleReject(req.id)}>
                                  <Text style={styles.reqRejectText}>Reject</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </>
                      )}
                      {handledIncoming.length > 0 && (
                        <>
                          <Text style={styles.reqSectionLabel}>Handled</Text>
                          {handledIncoming.map((req) => (
                            <TouchableOpacity key={req.id} style={styles.reqCard} activeOpacity={0.7} onPress={() => { setRequestsVisible(false); router.push(`/lend-details?id=${req.id}&incoming=true`); }}>
                              <View style={styles.reqCardHeader}>
                                <View style={styles.reqAvatarRow}>
                                  <View style={styles.reqAvatar}>
                                    <Text style={styles.reqAvatarText}>{getInitials(req.lenderName)}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.reqContactName} numberOfLines={1}>From: {req.lenderName}</Text>
                                    <Text style={styles.reqAmount}>{formatCurrency(req.amount)}</Text>
                                  </View>
                                </View>
                                <StatusBadge status={req.status} />
                              </View>
                              <Text style={styles.reqDueDate}>Due: {formatDate(req.due)}</Text>
                            </TouchableOpacity>
                          ))}
                        </>
                      )}
                    </>
                  )
                ) : (
                  borrowReqList.length === 0 ? (
                    <Text style={styles.reqEmptyText}>No borrow requests received.</Text>
                  ) : (
                    borrowReqList.map((req) => (
                      <View key={req.id} style={styles.reqCard}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => { setRequestsVisible(false); router.push(`/lend-details?id=${req.id}`); }}>
                          <View style={styles.reqCardHeader}>
                            <View style={styles.reqAvatarRow}>
                              <View style={styles.reqAvatar}>
                                <Text style={styles.reqAvatarText}>{getInitials(req.contact)}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.reqContactName} numberOfLines={1}>{req.contact} wants to borrow</Text>
                                <Text style={styles.reqAmount}>{formatCurrency(req.amount)}</Text>
                              </View>
                            </View>
                            <StatusBadge status={req.status} />
                          </View>
                          <Text style={styles.reqDueDate}>Due: {formatDate(req.due)}</Text>
                          {req.note ? <Text style={styles.reqNote}>{req.note}</Text> : null}
                        </TouchableOpacity>
                        {req.status === 'BORROW_REQUESTED' && (
                          <View style={styles.reqActionRow}>
                            <TouchableOpacity style={styles.reqAcceptBtn} onPress={() => handleApprove(req.id)}>
                              <Text style={styles.reqAcceptText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.reqRejectBtn} onPress={() => handleDecline(req.id)}>
                              <Text style={styles.reqRejectText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  )
                )}
              </ScrollView>
            )}
      </DraggableSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  header: {
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28,
    backgroundColor: Colors.primary,
  },
  body: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', flexGrow: 1, paddingBottom: 40,
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
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  headline: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: 3, marginBottom: 18 },
  totalChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#EFEFEF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7 },
  totalChipText: { fontSize: 13, fontWeight: '600', color: '#121212' },
  center: { paddingVertical: 80, alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 20, paddingVertical: 20 },
  quickItem: { alignItems: 'center', gap: 8 },
  quickCircle: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  quickBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.background },
  quickBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
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
  toast: { position: 'absolute', bottom: 28, left: 20, right: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  toastIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  toastTextWrap: { flex: 1 },
  toastTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  toastSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  // Modal base
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 12, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 14, marginTop: 4 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  // Contact selector (shared)
  contactSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: Colors.background, marginBottom: 4 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  selectorName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  selectorSub: { fontSize: 11, color: Colors.textSecondary },
  selectorPlaceholder: { fontSize: 14, color: Colors.textSecondary },
  pickerList: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.background, marginBottom: 10, overflow: 'hidden', maxHeight: 180 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  pickerItemSub: { fontSize: 11, color: Colors.textSecondary },
  miniAvatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  miniAvatarText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  // Form inputs (lend/borrow)
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: Colors.background, marginBottom: 4 },
  amountPrefix: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: Colors.background, marginBottom: 4 },
  dateInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  noteInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.background, padding: 14, fontSize: 14, color: Colors.textPrimary, minHeight: 80, marginBottom: 12 },
  formError: { fontSize: 11, color: Colors.danger, marginBottom: 8, marginLeft: 4 },
  errorBorder: { borderColor: Colors.danger },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: Colors.primary },
  agreementText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, marginBottom: 10 },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: Colors.textSecondary },
  // Notifications panel
  emptyNotif: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, backgroundColor: Colors.background, marginBottom: 8 },
  notifCardUnread: { backgroundColor: Colors.primaryLight },
  notifIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  notifSub: { fontSize: 12, color: Colors.textSecondary },
  notifNote: { fontSize: 12, color: Colors.textPrimary, fontStyle: 'italic', marginTop: 4 },
  notifTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
  notifDismissBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8, alignSelf: 'center' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  viewAllText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  // Requests modal
  reqTabRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  reqTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  reqTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  reqTabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  reqTabTextActive: { color: '#fff' },
  reqTabBadge: { backgroundColor: Colors.danger, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  reqTabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  reqSectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  reqEmptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  reqCard: { backgroundColor: Colors.background, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  reqCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reqAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  reqAvatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center' },
  reqAvatarText: { color: '#121212', fontWeight: '700', fontSize: 13 },
  reqContactName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  reqAmount: { fontSize: 12, color: Colors.textSecondary },
  reqDueDate: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  reqNote: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 6 },
  reqActionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  reqAcceptBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  reqAcceptBtnDisabled: { opacity: 0.4 },
  reqAcceptText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  reqRejectBtn: { flex: 1, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  reqRejectText: { color: Colors.textPrimary, fontWeight: '600', fontSize: 13 },
  // Card display in header
  cardDisplay: {
    backgroundColor: '#EFEFEF', borderRadius: 16, padding: 16,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardChipIcon: { width: 28, height: 20, borderRadius: 4, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardBrand: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  cardNumber: { fontSize: 19, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 4, marginBottom: 14 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardFieldLabel: { fontSize: 9, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 2 },
  cardFieldValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  // Wallet modal inputs
  walletFieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  walletInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: Colors.background },
  walletInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  wBrandPill: { fontSize: 11, fontWeight: '700', color: Colors.primary, backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: Colors.danger },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },
});
