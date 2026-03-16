import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { useFonts } from 'expo-font';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const toastConfig: ToastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#F5C518', borderRadius: 12, marginHorizontal: 16 }}
        contentContainerStyle={{ paddingHorizontal: 14 }}
        text1Style={{ fontSize: 14, fontWeight: '700', color: '#121212' }}
        text2Style={{ fontSize: 12, color: '#6B7280' }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{ borderLeftColor: '#EF4444', borderRadius: 12, marginHorizontal: 16 }}
        contentContainerStyle={{ paddingHorizontal: 14 }}
        text1Style={{ fontSize: 14, fontWeight: '700', color: '#121212' }}
        text2Style={{ fontSize: 12, color: '#6B7280' }}
      />
    ),
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lend-details" />
        <Stack.Screen name="create-lend" />
        <Stack.Screen name="receipt" />
        <Stack.Screen name="contact-details" />
        <Stack.Screen name="suggest-repayment" />
        <Stack.Screen name="create-borrow" />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}
