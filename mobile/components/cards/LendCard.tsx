import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LendStatus } from '../../types';
import { Colors } from '../../constants/colors';
import StatusBadge from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import CardContainer from '../ui/CardContainer';
import { formatDate } from '../../utils/formatCurrency';

interface LendCardLend {
  contact: string;
  amount: number;
  paid: number;
  due: string;
  status: LendStatus;
  type: string;
}

interface LendCardProps {
  lend: LendCardLend;
  onPress: () => void;
}

export default function LendCard({ lend, onPress }: LendCardProps) {
  const progress = lend.amount > 0 ? lend.paid / lend.amount : 0;
  const isBorrowed = lend.type === 'BORROWED';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <CardContainer style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatarRow}>
            {/* Rounded-square arrow icon — gray background, dark icon */}
            <View style={styles.iconWrap}>
              <Ionicons
                name={isBorrowed ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={20}
                color="#121212"
              />
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
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
