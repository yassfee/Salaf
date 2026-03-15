import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import InputField from '../../components/ui/InputField';
import PrimaryButton from '../../components/ui/PrimaryButton';
import OutlinedButton from '../../components/ui/OutlinedButton';
import { loginApi, registerApi } from '../../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Clear a single field error as the user types
  const clearError = (key: string) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Reset all errors when switching tabs
  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setErrors({});
    setApiError('');
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  const validateLogin = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const email = loginEmail.trim();
    if (!email) errs.loginEmail = 'Email is required';
    else if (!EMAIL_REGEX.test(email)) errs.loginEmail = 'Enter a valid email address';
    if (!loginPassword) errs.loginPassword = 'Password is required';
    else if (loginPassword.length < 6) errs.loginPassword = 'Password must be at least 6 characters';
    return errs;
  };

  const handleLogin = async () => {
    const errs = validateLogin();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      await loginApi(loginEmail.trim(), loginPassword);
      router.replace('/(tabs)');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        setApiError('Incorrect email or password. Please try again.');
      } else if (!e?.response) {
        setApiError('Cannot reach the server. Check your connection.');
      } else {
        setApiError(e?.response?.data?.message ?? 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  const validateRegister = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const name = regName.trim();
    const email = regEmail.trim();

    if (!name) {
      errs.regName = 'Full name is required';
    } else if (name.length < 2) {
      errs.regName = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errs.regName = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    if (!email) {
      errs.regEmail = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      errs.regEmail = 'Enter a valid email address';
    }

    if (!regPassword) {
      errs.regPassword = 'Password is required';
    } else if (!isPasswordValid(regPassword)) {
      errs.regPassword = 'Password does not meet all requirements below';
    }

    if (!regConfirm) {
      errs.regConfirm = 'Please confirm your password';
    } else if (regPassword !== regConfirm) {
      errs.regConfirm = 'Passwords do not match';
    }

    return errs;
  };

  const handleRegister = async () => {
    const errs = validateRegister();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');
    try {
      await registerApi(regName.trim(), regEmail.trim(), regPassword);
      router.replace('/(tabs)');
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      if (status === 409) {
        setApiError('An account with this email already exists.');
      } else if (!e?.response) {
        setApiError('Cannot reach the server. Check your connection.');
      } else if (status === 400 && data?.errors) {
        // Map backend field names → frontend state keys and show inline
        const fieldMap: Record<string, string> = {
          name: 'regName',
          email: 'regEmail',
          password: 'regPassword',
        };
        const mapped: Record<string, string> = {};
        Object.entries(data.errors).forEach(([field, msg]) => {
          const key = fieldMap[field] ?? field;
          mapped[key] = msg as string;
        });
        setErrors(mapped);
      } else {
        setApiError(data?.message ?? 'Registration failed. Please try again.');
      }
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
            <Image
              source={require('../../assets/Salaf LogoY.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoSubtitle}>Smart Personal Lending</Text>
          </View>

          {/* Tab Toggle */}
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
              onPress={() => switchTab('login')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'login' && styles.tabBtnTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
              onPress={() => switchTab('register')}
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
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
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
                  onChangeText={(v) => { setLoginEmail(v); clearError('loginEmail'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  maxLength={254}
                  error={errors.loginEmail}
                />
                <InputField
                  placeholder="Password"
                  icon="lock-closed-outline"
                  value={loginPassword}
                  onChangeText={(v) => { setLoginPassword(v); clearError('loginPassword'); }}
                  isPassword
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  maxLength={128}
                  error={errors.loginPassword}
                />
                <PrimaryButton title="Login" onPress={handleLogin} loading={loading} disabled={loading} />
              </>
            ) : (
              <>
                <InputField
                  placeholder="Full Name"
                  icon="person-outline"
                  value={regName}
                  onChangeText={(v) => { setRegName(v); clearError('regName'); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  maxLength={80}
                  error={errors.regName}
                />
                <InputField
                  placeholder="Email"
                  icon="mail-outline"
                  value={regEmail}
                  onChangeText={(v) => { setRegEmail(v); clearError('regEmail'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  maxLength={254}
                  error={errors.regEmail}
                />
                <InputField
                  placeholder="Password"
                  icon="lock-closed-outline"
                  value={regPassword}
                  onChangeText={(v) => { setRegPassword(v); clearError('regPassword'); }}
                  isPassword
                  textContentType="newPassword"
                  returnKeyType="next"
                  maxLength={128}
                  error={errors.regPassword}
                />
                {!!regPassword && (
                  <PasswordRequirements password={regPassword} />
                )}
                <InputField
                  placeholder="Confirm Password"
                  icon="lock-closed-outline"
                  value={regConfirm}
                  onChangeText={(v) => { setRegConfirm(v); clearError('regConfirm'); }}
                  isPassword
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  maxLength={128}
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

// ── Password helpers ──────────────────────────────────────────────────────────

const PW_RULES = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)',          test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)',          test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number (0–9)',                    test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (@$!%*?&-_)',   test: (p: string) => /[@$!%*?&\-_]/.test(p) },
];

function isPasswordValid(pw: string) {
  return PW_RULES.every(r => r.test(pw));
}

function PasswordRequirements({ password }: { password: string }) {
  return (
    <View style={reqStyles.wrapper}>
      {PW_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.label} style={reqStyles.row}>
            <Ionicons
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={met ? '#22C55E' : Colors.textSecondary}
            />
            <Text style={[reqStyles.text, met && reqStyles.textMet]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const reqStyles = StyleSheet.create({
  wrapper: {
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  textMet: {
    color: '#22C55E',
  },
});

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
  logoImage: {
    width: 180,
    height: 80,
    marginBottom: 8,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
