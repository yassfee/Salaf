import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MOCK_CONTACTS } from '../../constants/mockData';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InputField from '../../components/ui/InputField';
import CardContainer from '../../components/ui/CardContainer';
import { getInitials } from '../../utils/formatCurrency';

type LendDirection = 'lending' | 'borrowing';

export default function CreateLendScreen() {
  const router = useRouter();
  const [direction, setDirection] = useState<LendDirection>('lending');
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [requireAck, setRequireAck] = useState(true);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const chosenContact = MOCK_CONTACTS.find((c) => c.id === selectedContact);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedContact) errs.contact = 'Please select a contact';
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!dueDate) errs.dueDate = 'Due date is required';
    else {
      const due = new Date(dueDate);
      if (due <= new Date()) errs.dueDate = 'Due date must be in the future';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      Alert.alert('Success', 'Lend created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Lend</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.px}>
          {/* Direction Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, direction === 'lending' && styles.toggleBtnActive]}
              onPress={() => setDirection('lending')}
            >
              <Text
                style={[styles.toggleText, direction === 'lending' && styles.toggleTextActive]}
              >
                I'm Lending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, direction === 'borrowing' && styles.toggleBtnActive]}
              onPress={() => setDirection('borrowing')}
            >
              <Text
                style={[styles.toggleText, direction === 'borrowing' && styles.toggleTextActive]}
              >
                I'm Borrowing
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contact Selector */}
          <TouchableOpacity
            style={[styles.contactSelector, errors.contact && styles.errorBorder]}
            onPress={() => setShowContactPicker(!showContactPicker)}
          >
            {chosenContact ? (
              <View style={styles.selectedContact}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{getInitials(chosenContact.name)}</Text>
                </View>
                <Text style={styles.contactName}>{chosenContact.name}</Text>
              </View>
            ) : (
              <Text style={styles.contactPlaceholder}>Select Contact</Text>
            )}
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}

          {/* Contact Picker Dropdown */}
          {showContactPicker && (
            <CardContainer style={styles.picker}>
              {MOCK_CONTACTS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedContact(c.id);
                    setShowContactPicker(false);
                  }}
                >
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>{getInitials(c.name)}</Text>
                  </View>
                  <Text style={styles.pickerItemText}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </CardContainer>
          )}

          {/* Amount */}
          <InputField
            placeholder="0.000"
            prefix="BD"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            error={errors.amount}
          />

          {/* Due Date */}
          <InputField
            placeholder="YYYY-MM-DD"
            icon="calendar-outline"
            value={dueDate}
            onChangeText={setDueDate}
            error={errors.dueDate}
          />

          {/* Note */}
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textarea}
              placeholder="Note (optional)"
              placeholderTextColor={Colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Transfer Ref */}
          <InputField
            placeholder="Transfer Reference (optional)"
            icon="card-outline"
            value={transferRef}
            onChangeText={setTransferRef}
          />

          {/* Require Acknowledgement */}
          <View style={styles.ackRow}>
            <View>
              <Text style={styles.ackLabel}>Require Acknowledgement</Text>
              <Text style={styles.ackSub}>Borrower must confirm this lend</Text>
            </View>
            <Switch
              value={requireAck}
              onValueChange={setRequireAck}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={requireAck ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={styles.spacer} />
          <PrimaryButton title="➕ Submit Lend" onPress={handleSubmit} />
          <View style={styles.spacerSm} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: { width: 32 },
  px: { paddingHorizontal: 20, paddingBottom: 24 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },
  contactSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
    marginBottom: 4,
  },
  errorBorder: { borderColor: Colors.danger },
  selectedContact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  contactName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  contactPlaceholder: { fontSize: 14, color: Colors.textSecondary },
  picker: { marginBottom: 12, padding: 8 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  pickerItemText: { fontSize: 14, color: Colors.textPrimary },
  errorText: { fontSize: 11, color: Colors.danger, marginBottom: 8, marginLeft: 4 },
  textareaWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
    padding: 14,
    marginBottom: 12,
    minHeight: 90,
  },
  textarea: { fontSize: 14, color: Colors.textPrimary },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ackLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ackSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  spacer: { height: 8 },
  spacerSm: { height: 12 },
});
