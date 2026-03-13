import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, NotificationItem,
} from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';

function lendRoute(n: NotificationItem): string {
  if (n.type === 'BORROW_REQUEST') return `/lend-details?id=${n.lendId}`;
  return `/lend-details?id=${n.lendId}&incoming=true`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback(() => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastAnim]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleTap = async (n: NotificationItem) => {
    if (!n.read) {
      await markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    router.push(lendRoute(n) as any);
  };

  const handleConfirmDelete = async () => {
    if (confirmId === null) return;
    await deleteNotification(confirmId).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== confirmId));
    setConfirmId(null);
    showToast();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {notifications.map((n) => (
            <View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
              <TouchableOpacity
                style={styles.cardTouchable}
                activeOpacity={0.7}
                onPress={() => handleTap(n)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="notifications" size={18} color={Colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>
                    {n.type === 'LEND_REQUEST'
                      ? <><Text style={styles.bold}>{n.senderName}</Text> sent you a lend request</>
                      : n.type === 'BORROW_REQUEST'
                      ? <><Text style={styles.bold}>{n.senderName}</Text> wants to borrow from you</>
                      : <>Reminder from <Text style={styles.bold}>{n.senderName}</Text></>}
                  </Text>
                  <Text style={styles.cardSub}>
                    {n.type === 'REMINDER'
                      ? <>Paid <Text style={{ color: Colors.success, fontWeight: '600' }}>{formatCurrency(n.amountPaid)}</Text>{' · '}Remaining <Text style={{ color: Colors.danger, fontWeight: '600' }}>{formatCurrency(n.remainingBalance)}</Text></>
                      : <Text style={{ color: Colors.primary, fontWeight: '600' }}>{formatCurrency(n.amount)}</Text>}
                  </Text>
                  {n.note ? <Text style={styles.cardNote}>"{n.note}"</Text> : null}
                  <Text style={styles.cardTime}>{formatDate(n.createdAt)}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setConfirmId(n.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toastVisible && (
        <Animated.View style={[styles.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
        }]}>
          <View style={styles.toastIconWrap}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>Notification deleted</Text>
            <Text style={styles.toastSub}>The notification has been removed.</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      <Modal visible={confirmId !== null} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="trash-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>Delete Notification</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to remove this notification? This cannot be undone.</Text>
            <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleConfirmDelete}>
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setConfirmId(null)}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  headerRight: { width: 80 },
  markAllBtn: { paddingHorizontal: 4 },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12,
    backgroundColor: Colors.background, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardUnread: { backgroundColor: Colors.primaryLight },
  cardTouchable: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  bold: { fontWeight: '700' },
  cardSub: { fontSize: 12, color: Colors.textSecondary },
  cardNote: { fontSize: 12, color: Colors.textPrimary, fontStyle: 'italic', marginTop: 4 },
  cardTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  // Toast
  toast: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  toastIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  toastTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  toastSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  // Confirm modal
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  confirmSheet: { width: '100%', backgroundColor: Colors.card, borderRadius: 20, padding: 24, alignItems: 'center' },
  confirmIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  confirmMessage: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confirmDeleteBtn: { width: '100%', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  confirmCancelBtn: { width: '100%', alignItems: 'center', paddingVertical: 10 },
  confirmCancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
});
