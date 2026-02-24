import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
}

const getColor = (p: number): string => {
  const pct = p * 100;
  if (pct >= 100) return Colors.success;
  if (pct >= 71) return Colors.blue;
  if (pct >= 41) return Colors.primary; // amber
  return Colors.danger;
};

export default function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%` as any, backgroundColor: getColor(clamped) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
