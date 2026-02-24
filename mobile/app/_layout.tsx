import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
      </Stack>
    </>
  );
}
