import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import DraggableSheet from '../../components/ui/DraggableSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  getContacts, getLends, createLend, createBorrowRequest, getUserBadges,
  getIncomingLends, ContactResponse, LendResponse, UserBadges,
} from '../../services/api';
import CardContainer from '../../components/ui/CardContainer';
import StatusBadge from '../../components/ui/StatusBadge';
import DatePickerField from '../../components/ui/DatePickerField';
import { getInitials, formatDate, formatCurrency } from '../../utils/formatCurrency';

const onTimeHeroEarned = (b: UserBadges) => b.onTimeHero;
const trustedLenderEarned = (b: UserBadges) => b.trustedLender;
const debtFreeEarned = (b: UserBadges) => b.debtFree;

export default function ContactDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = Number(id);

  const [contact, setContact] = useState<ContactResponse | null>(null);
  const [lends, setLends] = useState<LendResponse[]>([]);
  const [contactBadges, setContactBadges] = useState<UserBadges | null>(null);
  const [loading, setLoading] = useState(true);

  // Lend modal state
  const [lendVisible, setLendVisible] = useState(false);
  const [lendAmount, setLendAmount] = useState('');
  const [lendDueDate, setLendDueDate] = useState('');
  const [lendNote, setLendNote] = useState('');
  const [lendErrors, setLendErrors] = useState<Record<string, string>>({});
  const [lendSubmitting, setLendSubmitting] = useState(false);
  const [lendAgreed, setLendAgreed] = useState(false);

  // Borrow modal state
  const [borrowVisible, setBorrowVisible] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowDueDate, setBorrowDueDate] = useState('');
  const [borrowNote, setBorrowNote] = useState('');
  const [borrowErrors, setBorrowErrors] = useState<Record<string, string>>({});
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);
  const [borrowAgreed, setBorrowAgreed] = useState(false);
  const [borrowSubmitError, setBorrowSubmitError] = useState('');
  const [activeBorrowCount, setActiveBorrowCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [contacts, allLends, incoming] = await Promise.all([getContacts(), getLends(), getIncomingLends().catch(() => [])]);
      const found = contacts.find((c) => c.id === contactId) ?? null;
      setContact(found);
      setLends(allLends.filter((l) => l.contactId === contactId));
      setActiveBorrowCount(incoming.filter((l) => ['ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID', 'OVERDUE'].includes(l.status)).length);
      if (found?.linkedUserId) {
        const badges = await getUserBadges(found.linkedUserId).catch(() => null);
        setContactBadges(badges);
      }
    } catch {
      Alert.alert('Error', 'Failed to load contact details.');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const closeLend = () => {
    setLendVisible(false);
    setLendAmount(''); setLendDueDate(''); setLendNote('');
    setLendErrors({}); setLendAgreed(false);
  };

  const validateLend = () => {
    const errs: Record<string, string> = {};
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
      await createLend(contactId, parseFloat(lendAmount), lendDueDate, lendNote || undefined);
      closeLend();
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to create lend.';
      Alert.alert('Error', msg);
    } finally {
      setLendSubmitting(false);
    }
  };

  const closeBorrow = () => {
    setBorrowVisible(false);
    setBorrowAmount(''); setBorrowDueDate(''); setBorrowNote('');
    setBorrowErrors({}); setBorrowAgreed(false); setBorrowSubmitError('');
  };

  const validateBorrow = () => {
    const errs: Record<string, string> = {};
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
      await createBorrowRequest(contactId, parseFloat(borrowAmount), borrowDueDate, borrowNote || undefined);
      closeBorrow();
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to send borrow request.';
      setBorrowSubmitError(msg);
    } finally {
      setBorrowSubmitting(false);
    }
  };

  // Stats
  const activeLends = lends.filter((l) => ['ACCEPTED', 'ACTIVE', 'PARTIALLY_PAID'].includes(l.status));
  const overdueLends = lends.filter((l) => l.status === 'OVERDUE');
  const paidLends = lends.filter((l) => l.status === 'PAID');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Yellow header — back button + profile info, all scrolls together */}
        <View style={styles.yellowSection}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/contacts')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contact Details</Text>
            <View style={styles.headerRight} />
          </View>

          {!loading && contact && (
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
              </View>
              <Text style={styles.name}>{contact.name}</Text>
              {contact.email ? <Text style={styles.contactInfo}>{contact.email}</Text> : null}
              {contact.phone ? <Text style={styles.contactInfo}>{contact.phone}</Text> : null}
              {contact.linkedUserId ? (
                <View style={styles.registeredBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                  <Text style={styles.registeredText}>On Salaf</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Gray rounded body */}
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : !contact ? (
            <Text style={[styles.emptyText, { marginTop: 40 }]}>Contact not found.</Text>
          ) : (<>
            <View style={styles.px}>
              {/* Stat Row */}
              <View style={styles.statRow}>
                <CardContainer style={styles.statCard}>
                  <Text style={styles.statLabel}>Active</Text>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>{activeLends.length}</Text>
                </CardContainer>
                <CardContainer style={styles.statCard}>
                  <Text style={styles.statLabel}>Paid</Text>
                  <Text style={[styles.statValue, { color: Colors.success }]}>{paidLends.length}</Text>
                </CardContainer>
                <CardContainer style={styles.statCard}>
                  <Text style={styles.statLabel}>Overdue</Text>
                  <Text style={[styles.statValue, { color: Colors.danger }]}>{overdueLends.length}</Text>
                </CardContainer>
              </View>

              {contactBadges && (onTimeHeroEarned(contactBadges) || trustedLenderEarned(contactBadges) || debtFreeEarned(contactBadges)) && (
                <View style={styles.badgesSection}>
                  <Text style={styles.sectionTitle}>Badges</Text>
                  <View style={styles.badgeRow}>
                    {onTimeHeroEarned(contactBadges) && (
                      <View style={styles.badgeChip}>
                        <Ionicons name="trophy-outline" size={14} color={Colors.primary} />
                        <Text style={styles.badgeChipText}>On-Time Hero</Text>
                      </View>
                    )}
                    {trustedLenderEarned(contactBadges) && (
                      <View style={styles.badgeChip}>
                        <Ionicons name="ribbon-outline" size={14} color={Colors.primary} />
                        <Text style={styles.badgeChipText}>Trusted Lender</Text>
                      </View>
                    )}
                    {debtFreeEarned(contactBadges) && (
                      <View style={styles.badgeChip}>
                        <Ionicons name="lock-closed-outline" size={14} color={Colors.primary} />
                        <Text style={styles.badgeChipText}>Debt Free</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Lend History */}
              <Text style={styles.sectionTitle}>Lend History</Text>
              {lends.length === 0 ? (
                <Text style={styles.emptyText}>No lends with this contact.</Text>
              ) : (
                lends.map((lend) => (
                  <TouchableOpacity
                    key={lend.id}
                    onPress={() => router.push(`/lend-details?id=${lend.id}`)}
                    activeOpacity={0.85}
                  >
                    <CardContainer style={styles.lendCard}>
                      <View style={styles.lendRow}>
                        <View style={styles.lendIconWrap}>
                          <Ionicons name="arrow-up-outline" size={18} color={Colors.textPrimary} />
                        </View>
                        <View style={styles.lendInfo}>
                          <Text style={styles.lendAmount}>{formatCurrency(lend.amount)}</Text>
                          <Text style={styles.lendDate}>Due {formatDate(lend.due)}</Text>
                        </View>
                        <StatusBadge status={lend.status} />
                      </View>
                      {lend.remainingBalance < lend.amount && (
                        <Text style={styles.lendPaid}>
                          Paid: {formatCurrency(lend.paid)} · Remaining: {formatCurrency(lend.remainingBalance)}
                        </Text>
                      )}
                    </CardContainer>
                  </TouchableOpacity>
                ))
              )}

              <View style={styles.spacer} />

              {!contact.linkedUserId && (
                <View style={styles.notRegisteredBanner}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.notRegisteredText}>
                    This contact is not registered on Salaf. Lend/Borrow is unavailable.
                  </Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.lendBtn, !contact.linkedUserId && styles.actionBtnDisabled]}
                  onPress={() => {
                    if (!contact.linkedUserId) {
                      Alert.alert('Not Registered', 'This contact must be a registered Salaf user to create a lend.');
                      return;
                    }
                    setLendVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-up-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Lend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.borrowBtn, !contact.linkedUserId && styles.borrowBtnDisabled]}
                  onPress={() => {
                    if (!contact.linkedUserId) {
                      Alert.alert('Not Registered', 'This contact must be a registered Salaf user to request a borrow.');
                      return;
                    }
                    setBorrowVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-down-outline" size={18} color={contact.linkedUserId ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: contact.linkedUserId ? Colors.primary : Colors.textSecondary }]}>Borrow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>)}
        </View>
      </ScrollView>
      {/* ── Borrow Modal ───────────────────────────────────────────────────── */}
      <DraggableSheet visible={borrowVisible} onClose={closeBorrow} sheetStyle={{ maxHeight: '85%' }}>
            <Text style={styles.modalTitle}>Request to Borrow</Text>

            {borrowSubmitError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{borrowSubmitError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Contact (pre-selected, display only) */}
              <View style={styles.contactDisplay}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{getInitials(contact?.name ?? '')}</Text>
                </View>
                <Text style={styles.contactDisplayName}>{contact?.name}</Text>
              </View>

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
                placeholder="Note (optional)"
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
                  I confirm I am requesting to borrow{contact ? ` from ${contact.name}` : ''} and understand this is a formal record
                </Text>
              </TouchableOpacity>
              {borrowErrors.agreed && <Text style={styles.formError}>{borrowErrors.agreed}</Text>}

              <TouchableOpacity
                style={[styles.sendBtn, { marginTop: 16 }, borrowSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmitBorrow}
                disabled={borrowSubmitting}
              >
                <Text style={styles.sendBtnText}>{borrowSubmitting ? 'Submitting...' : 'Send Borrow Request'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeBorrow}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
      </DraggableSheet>

      {/* ── Lend Modal ─────────────────────────────────────────────────────── */}
      <DraggableSheet visible={lendVisible} onClose={closeLend} sheetStyle={{ maxHeight: '85%' }}>
            <Text style={styles.modalTitle}>Create Lend</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Contact (pre-selected, display only) */}
              <View style={styles.contactDisplay}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{getInitials(contact?.name ?? '')}</Text>
                </View>
                <Text style={styles.contactDisplayName}>{contact?.name}</Text>
              </View>

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
                  I confirm I am lending{contact ? ` to ${contact.name}` : ''} and understand this is a formal record
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '600',
    color: '#FFFFFF', textAlign: 'center',
  },
  headerRight: { width: 32 },
  scroll: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1 },
  yellowSection: { backgroundColor: Colors.primary },
  profileHeader: { alignItems: 'center', paddingBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#121212' },
  name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  contactInfo: { fontSize: 14, color: '#FFFFFF', opacity: 0.75, marginTop: 2 },
  registeredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 8,
  },
  registeredText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  body: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', flexGrow: 1, paddingBottom: 40,
  },
  px: { paddingHorizontal: 20 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 24, marginTop: 20 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  lendCard: { marginBottom: 10 },
  lendRow: { flexDirection: 'row', alignItems: 'center' },
  lendIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#EFEFEF', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  lendInfo: { flex: 1 },
  lendAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  lendDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  lendPaid: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, paddingVertical: 20 },
  spacer: { height: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  lendBtn: { backgroundColor: Colors.primary },
  actionBtnDisabled: { backgroundColor: Colors.border },
  borrowBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary },
  borrowBtnDisabled: { borderColor: Colors.border },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  notRegisteredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 4,
  },
  notRegisteredText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  contactDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 12, marginBottom: 4,
  },
  miniAvatar: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  miniAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  contactDisplayName: { fontSize: 15, fontWeight: '600', color: Colors.primaryDark },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, height: 52, backgroundColor: Colors.background,
  },
  amountPrefix: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  noteInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.background,
    minHeight: 80,
  },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  agreementText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  formError: { fontSize: 12, color: Colors.danger, marginTop: 2, marginBottom: 4 },
  errorBorder: { borderColor: Colors.danger },
  sendBtn: {
    height: 52, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
  badgesSection: { marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  badgeChipText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.dangerLight, borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: Colors.danger },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },
});
