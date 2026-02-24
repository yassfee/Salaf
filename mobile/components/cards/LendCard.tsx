import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lend } from '../../types';
import { Colors } from '../../constants/colors';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import CardContainer from '../ui/CardContainer';
import { getInitials, formatDate } from '../../utils/formatCurrency';

interface LendCardProps {
  lend: Lend;
  onPress: () => void;
}

export default function LendCard({ lend, onPress }: LendCardProps) {
  const progress = lend.amount > 0 ? lend.paid / lend.amount : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <CardContainer style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(lend.contact)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{lend.contact}</Text>
              <Text style={styles.amount}>
                BD {lend.paid.toFixed(3)} / BD {lend.amount.toFixed(3)}
              </Text>
            </View>
          </View>
          <StatusBadge status={lend.status} />
        </View>
        <View style={styles.progressWrapper}>
          <ProgressBar progress={progress} />
        </View>
        <Text style={styles.dueDate}>Due: {formatDate(lend.due)}</Text>
      </CardContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  amount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressWrapper: { marginBottom: 8 },
  dueDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
