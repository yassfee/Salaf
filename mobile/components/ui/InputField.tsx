import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface InputFieldProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  prefix?: string;
  error?: string;
}

export default function InputField({
  icon,
  isPassword,
  prefix,
  error,
  style,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, error ? styles.errorBorder : null]}>
        {icon && (
          <Ionicons name={icon} size={17} color={Colors.textSecondary} style={styles.icon} />
        )}
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  icon: { marginRight: 10 },
  prefix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    height: '100%',
  },
  eyeBtn: { padding: 4 },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});
