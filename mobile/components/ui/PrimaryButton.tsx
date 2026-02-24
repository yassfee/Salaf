import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  color = Colors.primary,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textPrimary} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.45 },
  text: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
