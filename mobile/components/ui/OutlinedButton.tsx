import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface OutlinedButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  disabled?: boolean;
}

export default function OutlinedButton({
  title,
  onPress,
  icon,
  color = Colors.primary,
  disabled,
}: OutlinedButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: color }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {icon && <Ionicons name={icon} size={18} color={color} style={styles.icon} />}
      <Text style={[styles.text, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  icon: { marginRight: 8 },
  disabled: { opacity: 0.5 },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
