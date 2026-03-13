import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import CardContainer from '../ui/CardContainer';

export interface ComputedBadge {
  name: string;
  icon: string;
  desc: string;
  earned: boolean;
  earnedAt?: string;
  progressText?: string;
  progressValue?: number; // 0–1
}

interface BadgeCardProps {
  badge: ComputedBadge;
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <CardContainer style={[styles.card, !badge.earned && styles.cardUnearned]}>
      <View style={styles.row}>
        <View style={[styles.iconWrapper, !badge.earned && styles.iconWrapperUnearned]}>
          <Ionicons
            name={badge.icon as any}
            size={24}
            color={badge.earned ? Colors.primary : '#AAAAAA'}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, !badge.earned && styles.nameUnearned]}>{badge.name}</Text>
            {badge.earned && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.check} />
            )}
          </View>
          <Text style={styles.desc}>{badge.desc}</Text>

          {badge.earned && badge.earnedAt ? (
            <Text style={styles.earnedText}>Earned {badge.earnedAt}</Text>
          ) : badge.progressText ? (
            <View style={styles.progressContainer}>
              {badge.progressValue !== undefined && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.round(badge.progressValue * 100)}%` as any }]} />
                </View>
              )}
              <Text style={styles.progressText}>{badge.progressText}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  cardUnearned: { opacity: 0.75 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapperUnearned: { backgroundColor: '#F0F0F0' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  nameUnearned: { color: Colors.textSecondary },
  check: { marginLeft: 6 },
  desc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  earnedText: { fontSize: 11, color: Colors.success, fontWeight: '500' },
  progressContainer: { gap: 4 },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: { fontSize: 11, color: Colors.textSecondary },
});
