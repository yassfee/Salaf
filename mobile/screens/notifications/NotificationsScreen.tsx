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
    router.push(`/lend-details?id=${n.lendId}&incoming=true`);
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
            <TouchableOpacity
              key={n.id}
              style={[styles.card, !n.read && styles.cardUnread]}
              activeOpacity={0.8}
              onPress={() => handleTap(n)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, !n.read && styles.iconWrapUnread]}>
                  <Ionicons name="notifications" size={20} color={Colors.primary} />
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  Reminder from <Text style={styles.bold}>{n.senderName}</Text>
                </Text>
                <View style={styles.amountRow}>
                  <View style={styles.amountChip}>
                    <Text style={styles.amountChipLabel}>Total</Text>
                    <Text style={styles.amountChipValue}>{formatCurrency(n.amount)}</Text>
                  </View>
                  <View style={styles.amountChip}>
                    <Text style={styles.amountChipLabel}>Paid</Text>
                    <Text style={[styles.amountChipValue, { color: Colors.success }]}>{formatCurrency(n.amountPaid)}</Text>
                  </View>
                  <View style={styles.amountChip}>
                    <Text style={styles.amountChipLabel}>Remaining</Text>
                    <Text style={[styles.amountChipValue, { color: Colors.danger }]}>{formatCurrency(n.remainingBalance)}</Text>
                  </View>
                </View>
                {n.note ? (
                  <Text style={styles.note}>"{n.note}"</Text>
                ) : null}
                <Text style={styles.time}>{formatDate(n.createdAt)}</Text>
              </View>

              <View style={styles.cardActions}>
                {!n.read && <View style={styles.unreadDot} />}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(n.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardUnread: { backgroundColor: Colors.primaryLight },
  cardLeft: { paddingTop: 2 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  iconWrapUnread: { backgroundColor: Colors.card },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  bold: { fontWeight: '700' },
  amountRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  amountChip: { flex: 1, backgroundColor: Colors.background, borderRadius: 8, padding: 6, alignItems: 'center' },
  amountChipLabel: { fontSize: 10, color: Colors.textSecondary, marginBottom: 2 },
  amountChipValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  note: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 4 },
  time: { fontSize: 11, color: Colors.textSecondary },
  cardActions: { alignItems: 'flex-end', gap: 8, paddingTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  deleteBtn: { padding: 2 },
});
