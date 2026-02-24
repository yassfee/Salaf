import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../../types';
import { Colors } from '../../constants/colors';
import CardContainer from '../ui/CardContainer';
import { formatDate } from '../../utils/formatCurrency';

interface BadgeCardProps {
  badge: Badge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <CardContainer style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{badge.icon}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{badge.name}</Text>
          <Text style={styles.desc}>{badge.desc}</Text>
          <Text style={styles.earned}>Earned {formatDate(badge.earned)}</Text>
        </View>
      </View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 14,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  earned: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
