import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
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

  const handleDelete = (id: number) => {
    Alert.alert('Delete notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteNotification(id).catch(() => {});
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        },
      },
    ]);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
                onPress={() => handleDelete(n.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
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
    borderWidth: 1.5, borderColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
});
