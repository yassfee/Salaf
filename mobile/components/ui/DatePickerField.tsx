import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

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
  const [iosVisible, setIosVisible] = useState(false);
  const parsed = value ? new Date(value + 'T00:00:00') : new Date();
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  const displayLabel = value || placeholder;

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parsed >= minDate ? parsed : minDate,
        minimumDate: minDate,
        mode: 'date',
        onChange: (_e, date) => { if (date) onChange(toLocalISO(date)); },
      });
    } else {
      setIosVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.row, error && styles.errorBorder]}
        onPress={open}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={[styles.label, !value && styles.placeholder]}>{displayLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* iOS inline picker in modal */}
      {Platform.OS !== 'android' && (
        <Modal visible={iosVisible} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setIosVisible(false)}>
                  <Text style={styles.done}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parsed >= minDate ? parsed : minDate}
                minimumDate={minDate}
                mode="date"
                display="spinner"
                onChange={(_e, date) => { if (date) onChange(toLocalISO(date)); }}
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
