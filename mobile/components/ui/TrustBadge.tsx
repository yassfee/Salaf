import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface TrustBadgeProps {
  score: number;
}

const getTrustLevel = (score: number) => {
  if (score >= 70) return { label: 'Reliable', bg: '#F0FDF4', text: '#16A34A' };
  if (score >= 40) return { label: 'Moderate', bg: Colors.primaryLight, text: Colors.primaryDark };
  return { label: 'Risky', bg: '#FEF2F2', text: Colors.danger };
};

export default function TrustBadge({ score }: TrustBadgeProps) {
  const level = getTrustLevel(score);
  return (
    <View style={[styles.badge, { backgroundColor: level.bg }]}>
      <Text style={[styles.text, { color: level.text }]}>{level.label}</Text>
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
