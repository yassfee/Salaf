import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getContacts, createContact, searchUsers, ContactResponse, UserSearchResult } from '../../services/api';
import ContactCard from '../../components/cards/ContactCard';
import DraggableSheet from '../../components/ui/DraggableSheet';

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Add contact via user search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(data);
    } catch {
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const doSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      setSearching(true);
      const results = await searchUsers(q.trim());
      setSearchResults(results);
    } catch {
      // ignore search errors silently
    } finally {
      setSearching(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    setAddError('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(text), 400);
  };

  const handleAddUser = async (user: UserSearchResult) => {
    setAddError('');
    try {
      setSaving(true);
      const created = await createContact(user.email);
      setContacts((prev) => [created, ...prev]);
      closeModal();
    } catch (e: any) {
      setAddError(e?.response?.data?.message ?? 'Failed to add contact.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setAddError('');
    if (searchTimer.current) clearTimeout(searchTimer.current);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        {/* Yellow header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Contacts</Text>
          <Text style={styles.subtitle}>
            {contacts.length} people · {contacts.filter(c => c.linkedUserId).length} on Salaf
          </Text>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={17} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={Colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Gray rounded body */}
        <View style={styles.body}>
          <View style={styles.list}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <>
                {filtered.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onPress={() => router.push(`/contact-details?id=${contact.id}`)}
                  />
                ))}
                {filtered.length === 0 && (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>No contacts found.</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Contact Modal — search by email/phone */}
      <DraggableSheet visible={modalVisible} onClose={closeModal} sheetStyle={{ maxHeight: '80%' }}>
        <Text style={styles.modalTitle}>Add Contact</Text>
        <Text style={styles.modalHint}>Search for a registered Salaf user by email or phone</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} style={styles.searchRowIcon} />
          <TextInput
            style={styles.searchField}
            placeholder="Email or phone number..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            autoCapitalize="none"
            keyboardType="default"
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.searchingIndicator} />
          )}
        </View>

        {addError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{addError}</Text>
          </View>
        ) : null}

        {searchResults.length > 0 && (
          <ScrollView style={styles.results} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {searchResults.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.resultItem}
                onPress={() => handleAddUser(user)}
                disabled={saving}
                activeOpacity={0.75}
              >
                <View style={styles.resultAvatar}>
                  <Text style={styles.resultAvatarText}>
                    {user.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{user.name}</Text>
                  <Text style={styles.resultEmail}>{user.email}</Text>
                </View>
                <View style={styles.addCircle}>
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {searchResults.length === 0 && searchQuery.trim().length >= 2 && !searching && (
          <Text style={styles.noResults}>No users found. Make sure they are registered on Salaf.</Text>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </DraggableSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: Colors.primary,
  },
  body: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', flexGrow: 1, paddingBottom: 40,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#FFFFFF', opacity: 0.75, marginBottom: 18 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, height: 48,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  center: { paddingVertical: 60, alignItems: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  // Modal
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  modalHint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 12, height: 50, backgroundColor: Colors.background,
    marginBottom: 12,
  },
  searchRowIcon: { marginRight: 8 },
  searchField: {
    flex: 1, fontSize: 14, color: Colors.textPrimary,
  },
  searchingIndicator: { marginLeft: 8 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.dangerLight, borderRadius: 12,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.danger,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },
  results: { maxHeight: 220, marginBottom: 12 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultAvatar: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  resultAvatarText: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  resultEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  addCircle: { padding: 4 },
  noResults: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 12, marginBottom: 4 },
  cancelBtn: {
    height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 15 },
});
