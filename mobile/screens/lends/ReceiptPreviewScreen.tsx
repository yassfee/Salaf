import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import { getLendById, getCurrentUser, LendResponse } from '../../services/api';
import PrimaryButton from '../../components/ui/PrimaryButton';
import OutlinedButton from '../../components/ui/OutlinedButton';
import { formatDate, formatCurrency } from '../../utils/formatCurrency';

export default function ReceiptPreviewScreen() {
  const router = useRouter();
  const { lendId } = useLocalSearchParams<{ lendId: string }>();
  
  const [lend, setLend] = useState<LendResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lendData, userData] = await Promise.all([
          getLendById(Number(lendId)),
          getCurrentUser()
        ]);
        setLend(lendData);
        setCurrentUser(userData);
      } catch (error) {
        Alert.alert('Error', 'Failed to load receipt data');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (lendId) loadData();
  }, [lendId]);

  const handleDownloadPDF = async () => {
    if (!lend) return;
    try {
      const pdfUrl = `http://localhost:8080/api/pdf/receipt/${lend.id}`;
      await Clipboard.setStringAsync(pdfUrl);
      Alert.alert('Success', 'PDF download URL copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF URL');
    }
  };

  const handleShareReceipt = async () => {
    if (!lend) return;
    try {
      const pdfUrl = `http://localhost:8080/api/pdf/receipt/${lend.id}`;
      await Clipboard.setStringAsync(pdfUrl);
      Alert.alert('Success', 'Receipt URL copied to clipboard for sharing');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate share URL');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lend || !currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Receipt not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const receiptNo = `RCP-${String(lend.id).padStart(5, '0')}`;
  const today = formatDate(new Date().toISOString());
  const isLender = lend.type === 'LENT';
  const lenderName = isLender ? currentUser.name : lend.lenderName;
  const borrowerName = isLender ? lend.contact : currentUser.name;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Preview</Text>
        <TouchableOpacity
          onPress={handleShareReceipt}
          style={styles.shareBtn}
        >
          <Ionicons name="share-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          {/* Top Section */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptLogo}>Salaf</Text>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
          </View>
          <View style={styles.divider} />

          {/* Receipt Meta */}
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Receipt No.</Text>
            <Text style={styles.receiptValue}>{receiptNo}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Date</Text>
            <Text style={styles.receiptValue}>{today}</Text>
          </View>

          <View style={styles.divider} />

          {/* Parties */}
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Lender</Text>
            <Text style={styles.receiptValue}>{lenderName}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Borrower</Text>
            <View style={styles.valueCol}>
              <Text style={styles.receiptValue}>{borrowerName}</Text>
              <Text style={styles.receiptSub}>{lend.lenderEmail || currentUser.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Amounts */}
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Original Amount</Text>
            <Text style={styles.receiptValue}>{formatCurrency(lend.amount)}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Amount Paid</Text>
            <Text style={[styles.receiptValue, { color: Colors.success }]}>
              {formatCurrency(lend.paid)}
            </Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Remaining Balance</Text>
            <Text style={[styles.receiptValue, { color: Colors.danger }]}>
              {formatCurrency(lend.remainingBalance)}
            </Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Due Date</Text>
            <Text style={styles.receiptValue}>{formatDate(lend.due)}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptKey}>Status</Text>
            <Text style={[styles.receiptValue, { color: lend.status === 'PAID' ? Colors.success : Colors.primary }]}>
              {lend.status}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Acknowledgement */}
          {lend.status === 'ACCEPTED' || lend.status === 'PARTIALLY_PAID' || lend.status === 'PAID' ? (
            <View style={styles.ackSection}>
              <Text style={styles.ackText}>Acknowledged by {borrowerName}</Text>
              <Text style={styles.ackDate}>{formatDate(lend.createdAt)}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Footer */}
          <Text style={styles.receiptFooter}>Generated by Salaf</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Download PDF"
            onPress={handleDownloadPDF}
          />
          <View style={styles.spacer} />
          <OutlinedButton
            title="Share Receipt"
            onPress={handleShareReceipt}
          />
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
  shareBtn: { padding: 4 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  receiptCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  receiptHeader: { alignItems: 'center', marginBottom: 16 },
  receiptLogo: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  receiptTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
    borderStyle: 'dashed',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  receiptKey: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  valueCol: { alignItems: 'flex-end', flex: 1 },
  receiptSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  ackSection: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  ackText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  ackDate: { fontSize: 11, color: Colors.success, marginTop: 4 },
  receiptFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  actions: { gap: 0 },
  spacer: { height: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
