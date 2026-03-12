import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

// Only import native picker on non-web platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

interface Props {
  value: string;          // YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DatePickerField({ value, onChange, placeholder = 'Select date', error }: Props) {
  const [visible, setVisible] = useState(false);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const parsed = value ? new Date(value + 'T00:00:00') : minDate;
  const pickerValue = parsed >= minDate ? parsed : minDate;

  const handleChange = (_e: any, date?: Date) => {
    if (Platform.OS === 'android') setVisible(false);
    if (date) onChange(toLocalISO(date));
  };

  // Web fallback: native HTML date input
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.row, error && styles.errorBorder]}>
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        {/* @ts-ignore */}
        <input
          type="date"
          value={value}
          min={toLocalISO(minDate)}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: value ? Colors.textPrimary : Colors.textSecondary,
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.row, error && styles.errorBorder]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={[styles.label, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Android: render inline when visible */}
      {visible && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerValue}
          minimumDate={minDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}

      {/* iOS: modal with spinner */}
      {Platform.OS === 'ios' && (
        <Modal visible={visible} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Text style={styles.done}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerValue}
                minimumDate={minDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, height: 52, backgroundColor: Colors.background, marginBottom: 4,
  },
  errorBorder: { borderColor: Colors.danger },
  label: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  placeholder: { color: Colors.textSecondary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  done: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
