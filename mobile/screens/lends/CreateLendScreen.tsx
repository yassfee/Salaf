import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getContacts, createLend, ContactResponse } from '../../services/api';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InputField from '../../components/ui/InputField';
import CardContainer from '../../components/ui/CardContainer';
import DatePickerField from '../../components/ui/DatePickerField';
import { getInitials } from '../../utils/formatCurrency';

export default function CreateLendScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    getContacts()
      .then(setContacts)
      .catch(() => Alert.alert('Error', 'Failed to load contacts.'))
      .finally(() => setLoadingContacts(false));
  }, []);

  const chosenContact = contacts.find((c) => c.id === selectedContact);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedContact) errs.contact = 'Please select a contact';
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!dueDate) errs.dueDate = 'Due date is required';
    if (!agreed) errs.agreed = 'You must confirm the lending agreement';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      await createLend(selectedContact!, parseFloat(amount), dueDate, note || undefined);
      router.replace({ pathname: '/(tabs)', params: { toast: '1' } } as any);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Failed to create lend.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Lend</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.px}>
          {/* Contact Selector */}
          {loadingContacts ? (
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: 12 }} />
          ) : (
            <>
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

              {showContactPicker && (
                <CardContainer style={styles.picker}>
                  {contacts.length === 0 ? (
                    <Text style={styles.contactPlaceholder}>No contacts yet. Add one first.</Text>
                  ) : (
                    contacts.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.pickerItem}
                        onPress={() => { setSelectedContact(c.id); setShowContactPicker(false); }}
                      >
                        <View style={styles.miniAvatar}>
                          <Text style={styles.miniAvatarText}>{getInitials(c.name)}</Text>
                        </View>
                        <Text style={styles.pickerItemText}>{c.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </CardContainer>
              )}
            </>
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
          <DatePickerField
            value={dueDate}
            onChange={setDueDate}
            placeholder="Select due date"
            error={!!errors.dueDate}
          />
          {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}

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

          {/* Lender Agreement */}
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.agreementText}>
              I confirm I am lending{chosenContact ? ` to ${chosenContact.name}` : ''} and understand this is a formal record
            </Text>
          </TouchableOpacity>
          {errors.agreed && <Text style={styles.errorText}>{errors.agreed}</Text>}

          <View style={styles.spacer} />
          <PrimaryButton
            title="➕ Submit Lend"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
          <View style={styles.spacerSm} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  headerRight: { width: 32 },
  px: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
  contactSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, backgroundColor: Colors.card, marginBottom: 4,
  },
  errorBorder: { borderColor: Colors.danger },
  selectedContact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  miniAvatarText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  contactName: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  contactPlaceholder: { fontSize: 14, color: Colors.textSecondary },
  picker: { marginBottom: 12, padding: 8 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8 },
  pickerItemText: { fontSize: 14, color: Colors.textPrimary },
  errorText: { fontSize: 11, color: Colors.danger, marginBottom: 8, marginLeft: 4 },
  textareaWrapper: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    backgroundColor: Colors.card, padding: 14, marginBottom: 12, minHeight: 90,
  },
  textarea: { fontSize: 14, color: Colors.textPrimary },
  spacer: { height: 8 },
  spacerSm: { height: 12 },
  agreementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primary },
  agreementText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
