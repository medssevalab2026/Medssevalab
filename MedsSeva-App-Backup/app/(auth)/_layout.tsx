import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="account-type" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="partner-register" />
      <Stack.Screen name="partner-login" />
      <Stack.Screen name="partner-pending" />
      <Stack.Screen name="other-type" />
      <Stack.Screen name="phlebotomist-login" />
      <Stack.Screen name="phlebotomist-register" />
      <Stack.Screen name="phlebotomist-pending" />
      <Stack.Screen name="doctor-login" />
      <Stack.Screen name="doctor-register" />
      <Stack.Screen name="doctor-pending" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}