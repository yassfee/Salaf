import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactResponse } from '../../services/api';
import { Colors } from '../../constants/colors';
import CardContainer from '../ui/CardContainer';
import { getInitials } from '../../utils/formatCurrency';

interface ContactCardProps {
  contact: ContactResponse;
  onPress: () => void;
}

export default function ContactCard({ contact, onPress }: ContactCardProps) {
  const isRegistered = !!contact.linkedUserId;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <CardContainer style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{contact.name}</Text>
              {isRegistered && (
                <View style={styles.registeredBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.registeredText}>On Salaf</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>{contact.email}</Text>
            {contact.phone ? <Text style={styles.phone}>{contact.phone}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </View>
      </CardContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 15 },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  registeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.successLight, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  registeredText: { fontSize: 10, fontWeight: '600', color: Colors.success },
  email: { fontSize: 12, color: Colors.textSecondary },
  phone: { fontSize: 12, color: Colors.textSecondary },
});
