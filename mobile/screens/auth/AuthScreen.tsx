import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import InputField from '../../components/ui/InputField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import OutlinedButton from '../../components/ui/OutlinedButton';
import { loginApi, registerApi } from '../../services/api';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const router = useRouter();

  const handleLogin = async () => {
    const errs: Record<string, string> = {};
    if (!loginEmail) errs.loginEmail = 'Email is required';
    if (!loginPassword) errs.loginPassword = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      await loginApi(loginEmail, loginPassword);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Login failed';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const errs: Record<string, string> = {};
    if (!regName) errs.regName = 'Full name is required';
    if (!regEmail) errs.regEmail = 'Email is required';
    if (!regPassword) errs.regPassword = 'Password is required';
    if (regPassword !== regConfirm) errs.regConfirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      await registerApi(regName, regEmail, regPassword);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Registration failed';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <Text style={styles.logoIcon}>💰</Text>
            <Text style={styles.logoText}>LendWise</Text>
            <Text style={styles.logoSubtitle}>Smart Personal Lending</Text>
          </View>

          {/* Tab Toggle */}
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'login' && styles.tabBtnTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
              onPress={() => setActiveTab('register')}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'register' && styles.tabBtnTextActive]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* API error banner */}
          {!!apiError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          )}

          {/* Forms */}
          <View style={styles.form}>
            {activeTab === 'login' ? (
              <>
                <InputField
                  placeholder="Email"
                  icon="mail-outline"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.loginEmail}
                />
                <InputField
                  placeholder="Password"
                  icon="lock-closed-outline"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  isPassword
                  error={errors.loginPassword}
                />
                <TouchableOpacity style={styles.forgotRow}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
                <PrimaryButton title="Login" onPress={handleLogin} loading={loading} disabled={loading} />
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <OutlinedButton
                  title="Continue with Google"
                  onPress={() => {}}
                  icon="logo-google"
                />
              </>
            ) : (
              <>
                <InputField
                  placeholder="Full Name"
                  icon="person-outline"
                  value={regName}
                  onChangeText={setRegName}
                  error={errors.regName}
                />
                <InputField
                  placeholder="Email"
                  icon="mail-outline"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.regEmail}
                />
                <InputField
                  placeholder="Password"
                  icon="lock-closed-outline"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  isPassword
                  error={errors.regPassword}
                />
                <InputField
                  placeholder="Confirm Password"
                  icon="lock-closed-outline"
                  value={regConfirm}
                  onChangeText={setRegConfirm}
                  isPassword
                  error={errors.regConfirm}
                />
                <PrimaryButton title="Create Account" onPress={handleRegister} loading={loading} disabled={loading} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  logoSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  form: {
    gap: 0,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: 12,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
