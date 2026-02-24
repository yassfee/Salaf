import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LendStatus, RequestStatus } from '../../types';
import { Colors } from '../../constants/colors';

type AnyStatus = LendStatus | RequestStatus;

interface StatusBadgeProps {
  status: AnyStatus;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  ACCEPTED: { bg: Colors.primaryLight, text: Colors.primary, label: 'Accepted' },
  ACTIVE: { bg: Colors.primaryLight, text: Colors.primary, label: 'Active' },
  PARTIALLY_PAID: { bg: '#FEF3C7', text: '#D97706', label: 'Partial' },
  PAID: { bg: '#D1FAE5', text: Colors.success, label: 'Paid' },
  REJECTED: { bg: '#FEE2E2', text: Colors.danger, label: 'Rejected' },
  OVERDUE: { bg: '#FEE2E2', text: Colors.danger, label: 'Overdue' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig['PENDING'];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
