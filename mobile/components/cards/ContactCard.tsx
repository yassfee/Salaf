import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Contact } from '../../types';
import { Colors } from '../../constants/colors';
import TrustBadge from '../ui/TrustBadge';
import CardContainer from '../ui/CardContainer';
import { getInitials } from '../../utils/formatCurrency';

interface ContactCardProps {
  contact: Contact;
  onPress: () => void;
}

export default function ContactCard({ contact, onPress }: ContactCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <CardContainer style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.caption}>{contact.activeLends ?? 0} active lend(s)</Text>
            <TrustBadge score={contact.trustScore} />
          </View>
          <Text style={styles.score}>{contact.trustScore}</Text>
        </View>
      </CardContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 15,
  },
  info: { flex: 1, gap: 4 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
});
