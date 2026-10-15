import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="add-card" />
      <Stack.Screen name="add-upi" />
      <Stack.Screen name="family" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="info" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="legal" />
    </Stack>
  );
}