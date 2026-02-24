import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LendStatus, RequestStatus } from '../../types';
import { Colors } from '../../constants/colors';

type AnyStatus = LendStatus | RequestStatus;

interface StatusBadgeProps {
  status: AnyStatus;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:        { bg: Colors.primaryLight,  text: Colors.primaryDark, label: 'Pending' },
  ACCEPTED:       { bg: Colors.blueLight,     text: Colors.blue,        label: 'Accepted' },
  ACTIVE:         { bg: Colors.primary,        text: '#FFFFFF',          label: 'Active' },
  PARTIALLY_PAID: { bg: Colors.warningLight,  text: Colors.warning,     label: 'Partial' },
  PAID:           { bg: Colors.successLight,  text: Colors.success,     label: 'Paid' },
  REJECTED:       { bg: Colors.dangerLight,   text: Colors.danger,      label: 'Rejected' },
  OVERDUE:        { bg: Colors.textPrimary,    text: '#FFFFFF',          label: 'Overdue' },
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
